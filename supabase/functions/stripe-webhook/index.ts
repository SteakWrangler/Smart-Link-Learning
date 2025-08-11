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

  console.log("Webhook received:", req.method);
  
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret);
      console.log("Event verified:", event.type);
    } catch (err) {
      console.error("Bad signature", err);
      return new Response("Bad signature", { status: 400, headers: cors });
    }

    // For now, just return success to test if webhook is reachable
    console.log("Webhook processing event:", event.type);
    return new Response("OK", { status: 200, headers: cors });
    
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Server error", { status: 500, headers: cors });
  }
}); 