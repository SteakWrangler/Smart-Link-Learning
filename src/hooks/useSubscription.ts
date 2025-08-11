import { useEffect, useState } from "react";
import { supabase, SUPABASE_FUNCTIONS_URL } from "@/integrations/supabase/client";

export function useSubscription() {
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState(false);

  // Wait for auth to be ready
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in subscription hook:', event, session?.user?.email);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return; // Wait for auth to be ready
    console.log('useSubscription effect running...');
    let cancelled = false;
    async function load() {
      try {
        console.log('Starting subscription check...');
        const { data: sessionRes } = await supabase.auth.getSession();
        const user = sessionRes?.session?.user;
        console.log('User from session:', user?.email || 'No user');
        
        if (!user) {
          console.log('No user found, setting inactive');
          if (!cancelled) { setIsActive(false); setLoading(false); }
          return;
        }

        // Call our check-subscription function that queries Stripe directly
        console.log('Calling check-subscription function...');
        const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/check-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionRes.session?.access_token ?? ''}`,
          },
        });

        console.log('Response status:', res.status);
        
        if (!cancelled) {
          if (res.ok) {
            const responseData = await res.json();
            console.log('Response data:', responseData);
            setIsActive(responseData.isActive);
          } else {
            console.error('Function call failed:', res.status, res.statusText);
            try {
              const errorData = await res.text();
              console.error('Error response:', errorData);
            } catch (e) {
              console.error('Could not read error response');
            }
            setIsActive(false);
          }
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setIsActive(false);
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [authReady]);

  // Function to refresh subscription status (call after successful payment)
  const refresh = async () => {
    setLoading(true);
    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const user = sessionRes?.session?.user;
      if (!user) {
        setIsActive(false);
        setLoading(false);
        return;
      }

      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/check-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionRes.session?.access_token ?? ''}`,
        },
      });

      if (res.ok) {
        const { isActive: active } = await res.json();
        setIsActive(active);
      } else {
        setIsActive(false);
      }
    } catch (e) {
      setIsActive(false);
    } finally {
      setLoading(false);
    }
  };

  return { loading, isActive, refresh };
} 