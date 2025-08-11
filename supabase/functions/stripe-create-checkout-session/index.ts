import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "false",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    // Authenticated Supabase client using the caller's JWT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { priceId, successUrl, cancelUrl } = await req.json().catch(() => ({}));
    if (!priceId) {
      return new Response(JSON.stringify({ error: "Missing priceId" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Ensure Stripe customer exists and check trial eligibility
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, stripe_customer_id, has_used_trial")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    let customerId = profile.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Determine if user is eligible for free trial
    const isTrialEligible = !profile.has_used_trial;
    
    console.log(`Creating checkout session for user ${user.id}:`, {
      email: profile.email,
      customerId,
      hasUsedTrial: profile.has_used_trial,
      isTrialEligible
    });

    // Create checkout session configuration
    const sessionConfig = {
      mode: "subscription" as const,
      customer: customerId!,
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      allow_promotion_codes: true,
      success_url: successUrl ?? `${new URL(req.url).origin}?checkout=success`,
      cancel_url: cancelUrl ?? `${new URL(req.url).origin}?checkout=cancel`,
    };

    // Only add trial for eligible users
    if (isTrialEligible) {
      sessionConfig.subscription_data = {
        trial_period_days: 14,
      };
      console.log("Adding 14-day trial to checkout session");
    } else {
      console.log("User not eligible for trial - creating immediate subscription");
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("checkout error", e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
}); 