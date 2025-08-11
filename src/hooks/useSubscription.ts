import { useEffect, useState } from "react";
import { supabase, SUPABASE_FUNCTIONS_URL } from "@/integrations/supabase/client";

export function useSubscription() {
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: sessionRes } = await supabase.auth.getSession();
        const user = sessionRes?.session?.user;
        if (!user) {
          if (!cancelled) { setIsActive(false); setLoading(false); }
          return;
        }

        // Call our check-subscription function that queries Stripe directly
        const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/check-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionRes.session?.access_token ?? ''}`,
          },
        });

        if (!cancelled) {
          if (res.ok) {
            const { isActive: active } = await res.json();
            setIsActive(active);
          } else {
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
  }, []);

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