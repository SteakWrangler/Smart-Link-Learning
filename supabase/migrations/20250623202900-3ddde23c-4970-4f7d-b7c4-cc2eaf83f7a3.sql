
-- First, let's check what tables and columns exist in the published database
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'documents', 'children', 'student_profiles')
ORDER BY table_name, ordinal_position;

-- Check if old tables still exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('student_profiles', 'student_subjects', 'student_challenges', 'students');

-- Check current RLS policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'children', 'child_subjects', 'child_challenges');
