import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret);
  } catch (err) {
    console.error("Bad signature", err);
    return new Response("Bad signature", { status: 400, headers: cors });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { data: profile } = await admin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) {
          console.warn("No profile for customer", customerId);
          break;
        }

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

        const { error } = await admin.from("subscriptions").upsert(payload);
        if (error) console.error("Upsert subscription error", error);
        break;
      }
      case "invoice.payment_failed":
      case "invoice.payment_succeeded":
      case "customer.subscription.trial_will_end":
        // Optional: log/notify
        break;
      default:
        // Ignore other events
        break;
    }

    return new Response("OK", { status: 200, headers: cors });
  } catch (e) {
    console.error("webhook handler error", e);
    return new Response("Server error", { status: 500, headers: cors });
  }
}); 