import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { dryRun = true } = await req.json().catch(() => ({}));
    
    console.log(`🔵 Starting subscription sync process (dry run: ${dryRun})`);

    const results = {
      totalSubscriptions: 0,
      foundProfiles: 0,
      syncedSubscriptions: 0,
      skippedExisting: 0,
      errors: [] as string[],
      synced: [] as Array<{ subscriptionId: string; customerId: string; email?: string; status: string }>
    };

    // Get all active and trialing subscriptions from Stripe
    console.log(`🔵 Fetching active subscriptions from Stripe...`);
    
    const subscriptions = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: any = {
        status: 'all',
        limit: 100,
        expand: ['data.customer']
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const stripeSubscriptions = await stripe.subscriptions.list(params);
      subscriptions.push(...stripeSubscriptions.data);
      
      hasMore = stripeSubscriptions.has_more;
      if (hasMore && stripeSubscriptions.data.length > 0) {
        startingAfter = stripeSubscriptions.data[stripeSubscriptions.data.length - 1].id;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    results.totalSubscriptions = subscriptions.length;
    console.log(`🔵 Found ${subscriptions.length} total subscriptions in Stripe`);

    // Process each subscription
    for (const sub of subscriptions) {
      try {
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        let customerEmail = 'unknown';
        
        // Get customer email for logging (customer should be expanded)
        if (typeof sub.customer === 'object' && sub.customer.email) {
          customerEmail = sub.customer.email;
        }

        console.log(`🔵 Processing subscription ${sub.id} for customer ${customerId} (${customerEmail})`);

        // Find profile by stripe_customer_id
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, has_used_trial")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profileError || !profile) {
          console.log(`⚠️ No profile found for customer ${customerId} (${customerEmail})`);
          results.errors.push(`No profile found for customer ${customerId} (${customerEmail})`);
          continue;
        }

        results.foundProfiles++;
        console.log(`✅ Found profile for ${profile.email}`);

        // Check if subscription already exists
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("id", sub.id)
          .single();

        if (existingSub) {
          console.log(`⚠️ Subscription ${sub.id} already exists, skipping`);
          results.skippedExisting++;
          continue;
        }

        // Prepare subscription payload (matching webhook format)
        const payload = {
          id: sub.id,
          user_id: profile.id,
          customer_id: customerId,
          price_id: sub.items.data[0]?.price?.id ?? "",
          product_id: (sub.items.data[0]?.price?.product as string) ?? "",
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Insert subscription if not dry run
        if (!dryRun) {
          const { error: insertError } = await supabase
            .from("subscriptions")
            .insert(payload);

          if (insertError) {
            console.error(`❌ Failed to insert subscription ${sub.id}:`, insertError);
            results.errors.push(`Failed to insert subscription ${sub.id}: ${insertError.message}`);
            continue;
          }

          // Mark trial as used for active/trialing subscriptions
          if ((sub.status === "trialing" || sub.status === "active") && !profile.has_used_trial) {
            console.log(`Marking trial as used for user ${profile.id} (subscription ${sub.id})`);
            
            const { error: trialUpdateError } = await supabase
              .from("profiles")
              .update({ has_used_trial: true })
              .eq("id", profile.id);
              
            if (trialUpdateError) {
              console.error("Failed to mark trial as used:", trialUpdateError);
              results.errors.push(`Failed to mark trial as used for ${profile.email}: ${trialUpdateError.message}`);
            }
          }
        }

        console.log(`✅ ${dryRun ? 'Would sync' : 'Synced'} subscription ${sub.id} for ${profile.email}`);
        results.syncedSubscriptions++;
        results.synced.push({
          subscriptionId: sub.id,
          customerId: customerId,
          email: profile.email,
          status: sub.status
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing subscription ${sub.id}:`, error);
        results.errors.push(`Error processing subscription ${sub.id}: ${error.message}`);
      }
    }

    console.log(`🔵 Subscription sync complete:`, results);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("🔴 Subscription sync function error:", error);
    return new Response(JSON.stringify({ 
      error: "Server error",
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});