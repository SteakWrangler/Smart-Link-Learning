-- Remove username field from profiles table since it's not being used
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS username; 