-- Add deleted_at field to profiles table to track deleted accounts
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries on deleted accounts
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);

-- Update the handle_new_user function to handle existing deleted users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's an existing deleted profile for this email
  UPDATE public.profiles 
  SET 
    deleted_at = NULL,
    first_name = COALESCE(new.raw_user_meta_data->>'first_name', ''),
    last_name = COALESCE(new.raw_user_meta_data->>'last_name', ''),
    user_type = COALESCE(new.raw_user_meta_data->>'user_type', 'parent'),
    updated_at = now()
  WHERE email = new.email AND deleted_at IS NOT NULL;
  
  -- If no existing profile was updated, create a new one
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, email, first_name, last_name, user_type)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'first_name', ''),
      COALESCE(new.raw_user_meta_data->>'last_name', ''),
      COALESCE(new.raw_user_meta_data->>'user_type', 'parent')
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
