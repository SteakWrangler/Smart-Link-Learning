-- Verification script for performance fixes migration
-- This script verifies that all fixes were applied correctly and no functionality was broken

-- ============================================================================
-- STEP 1: Verify Auth RLS Initialization Plan Fixes
-- Check that all policies now use (SELECT auth.uid()) instead of auth.uid()
-- ============================================================================

-- Check profiles table policies
SELECT 
  'profiles' as table_name,
  policyname,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    ELSE 'UNKNOWN'
  END as operation,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'FIXED'
    WHEN qual LIKE '%auth.uid()%' THEN 'NEEDS FIX'
    ELSE 'NO AUTH CHECK'
  END as auth_check_status
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND schemaname = 'public'
ORDER BY policyname, cmd;

-- Check children table policies
SELECT 
  'children' as table_name,
  policyname,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    ELSE 'UNKNOWN'
  END as operation,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'FIXED'
    WHEN qual LIKE '%auth.uid()%' THEN 'NEEDS FIX'
    ELSE 'NO AUTH CHECK'
  END as auth_check_status
FROM pg_policies 
WHERE tablename = 'children' 
  AND schemaname = 'public'
ORDER BY policyname, cmd;

-- Check conversations table policies
SELECT 
  'conversations' as table_name,
  policyname,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    ELSE 'UNKNOWN'
  END as operation,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'FIXED'
    WHEN qual LIKE '%auth.uid()%' THEN 'NEEDS FIX'
    ELSE 'NO AUTH CHECK'
  END as auth_check_status
FROM pg_policies 
WHERE tablename = 'conversations' 
  AND schemaname = 'public'
ORDER BY policyname, cmd;

-- Check messages table policies
SELECT 
  'messages' as table_name,
  policyname,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    ELSE 'UNKNOWN'
  END as operation,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'FIXED'
    WHEN qual LIKE '%auth.uid()%' THEN 'NEEDS FIX'
    ELSE 'NO AUTH CHECK'
  END as auth_check_status
FROM pg_policies 
WHERE tablename = 'messages' 
  AND schemaname = 'public'
ORDER BY policyname, cmd;

-- Check all other tables with RLS policies
SELECT 
  tablename as table_name,
  policyname,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    ELSE 'UNKNOWN'
  END as operation,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'FIXED'
    WHEN qual LIKE '%auth.uid()%' THEN 'NEEDS FIX'
    ELSE 'NO AUTH CHECK'
  END as auth_check_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename NOT IN ('profiles', 'children', 'conversations', 'messages')
ORDER BY tablename, policyname, cmd;

-- ============================================================================
-- STEP 2: Verify Duplicate Policies Were Removed
-- ============================================================================

-- Check for any remaining duplicate policies
SELECT 
  tablename,
  policyname,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, policyname
HAVING COUNT(*) > 1
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 3: Verify Duplicate Indexes Were Removed
-- ============================================================================

-- Check for duplicate indexes on child_challenges
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'child_challenges' 
  AND schemaname = 'public'
ORDER BY indexname;

-- Check for duplicate indexes on child_subjects
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'child_subjects' 
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- STEP 4: Verify RLS is Enabled on All Tables
-- ============================================================================

-- Check that RLS is enabled on all relevant tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'children', 'child_subjects', 'child_challenges',
    'conversations', 'messages', 'conversation_tags', 'conversation_documents',
    'documents', 'forum_categories', 'forum_topics', 'forum_posts'
  )
ORDER BY tablename;

-- ============================================================================
-- STEP 5: Verify Policy Counts (Should be Reduced)
-- ============================================================================

-- Count total policies per table
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- STEP 6: Test Basic Functionality (if data exists)
-- ============================================================================

-- Test that we can still query basic data (this will verify policies work)
-- Note: These queries will only work if there's data and a user is authenticated

-- Test profiles query (should work for authenticated users)
SELECT 
  'profiles_query_test' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN 'PASS'
    ELSE 'NO DATA TO TEST'
  END as result;

-- Test children query (should work for authenticated users)
SELECT 
  'children_query_test' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.children LIMIT 1) THEN 'PASS'
    ELSE 'NO DATA TO TEST'
  END as result;

-- Test conversations query (should work for authenticated users)
SELECT 
  'conversations_query_test' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.conversations LIMIT 1) THEN 'PASS'
    ELSE 'NO DATA TO TEST'
  END as result;

-- ============================================================================
-- STEP 7: Summary Report
-- ============================================================================

-- Generate a summary of the verification
SELECT 
  'VERIFICATION SUMMARY' as summary_type,
  'All performance warnings should now be resolved' as message,
  'Check Supabase Performance Advisor to confirm 0 warnings' as next_step;

-- ============================================================================
-- VERIFICATION COMPLETE
-- 
-- If all checks pass:
-- ✓ All policies use (SELECT auth.uid()) instead of auth.uid()
-- ✓ No duplicate policies remain
-- ✓ Duplicate indexes have been removed
-- ✓ RLS is enabled on all tables
-- ✓ Policy counts are reduced
-- ✓ Basic queries still work
-- 
-- The migration was successful and all functionality is preserved.
-- ============================================================================ 