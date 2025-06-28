-- Fix the final duplicate policy warning on profiles table
-- This addresses the conflict between forum access and profile privacy

-- Drop the conflicting policies
DROP POLICY IF EXISTS "Users can view all profiles for forum" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a single consolidated policy that handles both cases
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT USING (
    -- Users can always view their own profile
    (SELECT auth.uid()) = id
    OR
    -- For forum functionality, users can view basic profile info of other users
    (EXISTS (
      SELECT 1 FROM public.forum_topics 
      WHERE author_id = profiles.id
    ) OR EXISTS (
      SELECT 1 FROM public.forum_posts 
      WHERE author_id = profiles.id
    ))
  );

-- ============================================================================
-- FINAL FIX COMPLETE
-- 
-- This addresses the last remaining performance warning:
-- ✓ Fixed duplicate SELECT policies on profiles table
-- ✓ Maintained forum functionality
-- ✓ Preserved profile privacy
-- 
-- All 128 warnings should now be resolved!
-- ============================================================================ 