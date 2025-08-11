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
  console.log('🔵 check-subscription: Function called with method:', req.method);
  
  if (req.method === "OPTIONS") {
    console.log('🔵 check-subscription: Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔵 check-subscription: Starting subscription check process');
  
  try {
    console.log('🔵 check-subscription: Creating Supabase client...');
    const authHeader = req.headers.get("Authorization");
    console.log('🔵 check-subscription: Auth header exists:', !!authHeader);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader ?? "" }
        }
      }
    );
    console.log('🔵 check-subscription: Supabase client created');

    console.log('🔵 check-subscription: Getting user from Supabase auth...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🟢 check-subscription: User check result:', { 
      userId: user?.id, 
      userEmail: user?.email, 
      hasError: !!userError,
      errorMessage: userError?.message 
    });
    
    if (userError || !user) {
      console.log('🔴 check-subscription: User authentication failed');
      console.log('🔴 check-subscription: User error:', userError);
      console.log('🔴 check-subscription: User object:', user);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get user's profile with Stripe customer ID
    console.log('🔵 check-subscription: Fetching user profile for ID:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    console.log('🟠 check-subscription: Profile check result:', { 
      hasProfile: !!profile, 
      stripeCustomerId: profile?.stripe_customer_id,
      hasError: !!profileError,
      errorMessage: profileError?.message 
    });

    if (!profile?.stripe_customer_id) {
      console.log('🔴 check-subscription: No stripe_customer_id found for user');
      console.log('🔴 check-subscription: Profile data:', profile);
      return new Response(JSON.stringify({ 
        isActive: false, 
        status: "no_customer",
        debug: "User has no stripe_customer_id in profile"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Check Stripe for active subscriptions
    console.log('🔵 check-subscription: Querying Stripe for customer:', profile.stripe_customer_id);
    
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "all",
      limit: 10,
    });
    
    console.log('🟢 check-subscription: Stripe API call completed successfully');

    console.log('🟢 check-subscription: Stripe subscriptions found:', subscriptions.data.length);
    console.log('🟢 check-subscription: Subscription details:', subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      current_period_end: sub.current_period_end,
      current_period_end_date: new Date(sub.current_period_end * 1000).toISOString(),
      is_valid_period: new Date(sub.current_period_end * 1000) > new Date()
    })));

    console.log('🔵 check-subscription: Checking for active subscriptions...');
    const activeSubscription = subscriptions.data.find(sub => 
      ["active", "trialing"].includes(sub.status) && 
      new Date(sub.current_period_end * 1000) > new Date()
    );

    console.log('🟢 check-subscription: Active subscription found:', !!activeSubscription);
    if (activeSubscription) {
      console.log('🟢 check-subscription: Active subscription details:', {
        id: activeSubscription.id,
        status: activeSubscription.status,
        current_period_end_date: new Date(activeSubscription.current_period_end * 1000).toISOString()
      });
    }

    const responseData = {
      isActive: !!activeSubscription,
      status: activeSubscription?.status || "inactive",
      currentPeriodEnd: activeSubscription ? new Date(activeSubscription.current_period_end * 1000).toISOString() : null,
      debug: {
        customerId: profile.stripe_customer_id,
        totalSubscriptions: subscriptions.data.length,
        subscriptionStatuses: subscriptions.data.map(s => s.status)
      }
    };
    
    console.log('🟢 check-subscription: Returning response:', JSON.stringify(responseData, null, 2));
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('🔴 check-subscription: Exception occurred:', error);
    console.error('🔴 check-subscription: Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    const errorResponse = { 
      error: "Server error",
      isActive: false,
      debug: {
        errorMessage: error.message,
        errorName: error.name
      }
    };
    
    console.log('🔴 check-subscription: Returning error response:', JSON.stringify(errorResponse, null, 2));
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});