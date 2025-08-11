import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
        const { data, error } = await (supabase as any)
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!cancelled) {
          if (error || !data) {
            setIsActive(false);
          } else {
            const active = ["active", "trialing"].includes((data as any).status) && new Date((data as any).current_period_end) > new Date();
            setIsActive(active);
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

  return { loading, isActive };
} 