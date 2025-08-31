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
    
    console.log(`🔵 Starting backfill process (dry run: ${dryRun})`);

    // First, get overview of all profiles for debugging
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from("profiles")
      .select("id, email, stripe_customer_id")
      .not("email", "is", null);

    if (allProfilesError) {
      console.error("Error fetching all profiles:", allProfilesError);
      return new Response(JSON.stringify({ error: "Failed to fetch profiles" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`🔵 Total profiles: ${allProfiles.length}`);
    console.log(`🔵 Profiles with stripe_customer_id: ${allProfiles.filter(p => p.stripe_customer_id).length}`);
    console.log(`🔵 Profiles without stripe_customer_id: ${allProfiles.filter(p => !p.stripe_customer_id).length}`);

    // Get all profiles missing stripe_customer_id
    const profiles = allProfiles.filter(p => !p.stripe_customer_id);

    console.log(`🔵 Found ${profiles.length} profiles without stripe_customer_id`);

    const results = {
      totalProfiles: profiles.length,
      foundCustomers: 0,
      updatedProfiles: 0,
      errors: [] as string[],
      matches: [] as Array<{ email: string; customerId: string; updated: boolean }>
    };

    // Process each profile
    for (const profile of profiles) {
      try {
        console.log(`🔵 Processing profile ${profile.email}`);
        
        // Search Stripe for customer by email
        const customers = await stripe.customers.list({
          email: profile.email,
          limit: 1
        });

        if (customers.data.length > 0) {
          const customer = customers.data[0];
          console.log(`✅ Found Stripe customer ${customer.id} for ${profile.email}`);
          
          results.foundCustomers++;
          results.matches.push({
            email: profile.email,
            customerId: customer.id,
            updated: false
          });

          // Update profile with stripe_customer_id if not dry run
          if (!dryRun) {
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ stripe_customer_id: customer.id })
              .eq("id", profile.id);

            if (updateError) {
              console.error(`❌ Failed to update profile ${profile.email}:`, updateError);
              results.errors.push(`Failed to update ${profile.email}: ${updateError.message}`);
            } else {
              console.log(`✅ Updated profile ${profile.email} with customer ID ${customer.id}`);
              results.updatedProfiles++;
              results.matches[results.matches.length - 1].updated = true;
            }
          }
        } else {
          console.log(`⚠️ No Stripe customer found for ${profile.email}`);
        }

        // Rate limiting - wait 100ms between API calls
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing ${profile.email}:`, error);
        results.errors.push(`Error processing ${profile.email}: ${error.message}`);
      }
    }

    console.log(`🔵 Backfill complete:`, results);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("🔴 Backfill function error:", error);
    return new Response(JSON.stringify({ 
      error: "Server error",
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});