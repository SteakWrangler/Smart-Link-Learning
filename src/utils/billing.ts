import { supabase, SUPABASE_FUNCTIONS_URL } from "@/integrations/supabase/client";

const CHECKOUT_FUNCTION_NAME = 'checkout-session';
const PORTAL_FUNCTION_NAME = 'billing-portal';

export async function startCheckout(priceId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/${CHECKOUT_FUNCTION_NAME}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ 
      priceId,
      successUrl: `${window.location.origin}?checkout=success`,
      cancelUrl: `${window.location.origin}?checkout=cancel`
    }),
  });
  if (!res.ok) throw new Error('Failed to create checkout session');
  const { url } = await res.json();
  window.location.href = url as string;
}

export async function openBillingPortal() {
  console.log('BILLING PORTAL: Starting billing portal request...');
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('BILLING PORTAL: Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    if (!session?.access_token) {
      console.error('BILLING PORTAL: No session or access token');
      throw new Error('No active session found');
    }
    
    console.log('BILLING PORTAL: Session found, user:', session.user?.email);
    console.log('BILLING PORTAL: Making request to:', `${SUPABASE_FUNCTIONS_URL}/${PORTAL_FUNCTION_NAME}`);
    
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/${PORTAL_FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ returnUrl: window.location.origin }),
    });
    
    console.log('BILLING PORTAL: Response status:', res.status);
    console.log('BILLING PORTAL: Response ok:', res.ok);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('BILLING PORTAL: Error response:', errorText);
      throw new Error(`Failed to create portal session: ${res.status} - ${errorText}`);
    }
    
    const responseData = await res.json();
    console.log('BILLING PORTAL: Response data:', responseData);
    
    if (!responseData.url) {
      console.error('BILLING PORTAL: No URL in response');
      throw new Error('No portal URL received');
    }
    
    console.log('BILLING PORTAL: Redirecting to:', responseData.url);
    window.location.href = responseData.url;
    
  } catch (error) {
    console.error('BILLING PORTAL: Exception occurred:', error);
    throw error;
  }
} 