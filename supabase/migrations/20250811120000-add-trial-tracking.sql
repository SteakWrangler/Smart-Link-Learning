-- Add trial tracking to prevent multiple free trials per customer

-- Add has_used_trial field to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_used_trial boolean DEFAULT false;

-- Create index for efficient trial eligibility lookups
CREATE INDEX IF NOT EXISTS idx_profiles_has_used_trial
  ON public.profiles(has_used_trial);

-- Update existing users who have stripe_customer_id to have used trial = true
-- (assuming they've already gone through checkout at some point)
UPDATE public.profiles 
SET has_used_trial = true 
WHERE stripe_customer_id IS NOT NULL;

-- Note: New users will default to has_used_trial = false and get the trial
-- Once they start a trial, the webhook will set has_used_trial = true