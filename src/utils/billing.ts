import { supabase } from "@/integrations/supabase/client";

export async function startCheckout(priceId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/functions/v1/stripe-create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
    body: JSON.stringify({ priceId }),
  });
  if (!res.ok) throw new Error("Failed to create checkout session");
  const { url } = await res.json();
  window.location.href = url;
}

export async function openBillingPortal() {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/functions/v1/stripe-create-portal-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
    body: JSON.stringify({ returnUrl: window.location.origin }),
  });
  if (!res.ok) throw new Error("Failed to create portal session");
  const { url } = await res.json();
  window.location.href = url;
} 