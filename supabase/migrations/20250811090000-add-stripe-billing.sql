-- Add Stripe billing support

-- 1) Customer linkage on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles(stripe_customer_id);

-- 2) Subscriptions table mirrors Stripe subscription state
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id text PRIMARY KEY, -- Stripe subscription id (sub_...)
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id text NOT NULL, -- Stripe customer id (cus_...)
  price_id text NOT NULL, -- Stripe price id (price_...)
  product_id text NOT NULL, -- Stripe product id (prod_...)
  status text NOT NULL, -- active | trialing | past_due | canceled | unpaid | incomplete | incomplete_expired | paused
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 3) RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscriptions'
      AND policyname = 'Users can select their own subscriptions'
  ) THEN
    CREATE POLICY "Users can select their own subscriptions" ON public.subscriptions
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- Note: writes (INSERT/UPDATE/DELETE) are performed by the service role in webhooks. 