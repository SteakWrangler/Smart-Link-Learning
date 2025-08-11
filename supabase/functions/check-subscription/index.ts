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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" }
        }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("User check:", { user: user?.id, error: userError });
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get user's profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    console.log("Profile check:", { profile, error: profileError });

    if (!profile?.stripe_customer_id) {
      console.log("No stripe_customer_id found for user");
      return new Response(JSON.stringify({ 
        isActive: false, 
        status: "no_customer",
        debug: "User has no stripe_customer_id in profile"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Check Stripe for active subscriptions
    console.log("Checking Stripe for customer:", profile.stripe_customer_id);
    
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "all",
      limit: 10,
    });

    console.log("Stripe subscriptions found:", subscriptions.data.length);
    console.log("Subscription details:", subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      current_period_end: sub.current_period_end,
      current_period_end_date: new Date(sub.current_period_end * 1000).toISOString()
    })));

    const activeSubscription = subscriptions.data.find(sub => 
      ["active", "trialing"].includes(sub.status) && 
      new Date(sub.current_period_end * 1000) > new Date()
    );

    console.log("Active subscription found:", !!activeSubscription);

    return new Response(JSON.stringify({
      isActive: !!activeSubscription,
      status: activeSubscription?.status || "inactive",
      currentPeriodEnd: activeSubscription ? new Date(activeSubscription.current_period_end * 1000).toISOString() : null,
      debug: {
        customerId: profile.stripe_customer_id,
        totalSubscriptions: subscriptions.data.length,
        subscriptionStatuses: subscriptions.data.map(s => s.status)
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Subscription check error:", error);
    return new Response(JSON.stringify({ 
      error: "Server error",
      isActive: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});