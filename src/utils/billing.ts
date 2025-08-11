import { supabase } from "@/integrations/supabase/client";

export async function startCheckout(priceId: string) {
  const { data, error } = await supabase.functions.invoke('stripe-create-checkout-session', {
    body: { priceId },
  });
  if (error || !data?.url) throw new Error("Failed to create checkout session");
  window.location.href = data.url as string;
}

export async function openBillingPortal() {
  const { data, error } = await supabase.functions.invoke('stripe-create-portal-session', {
    body: { returnUrl: window.location.origin },
  });
  if (error || !data?.url) throw new Error("Failed to create portal session");
  window.location.href = data.url as string;
} 