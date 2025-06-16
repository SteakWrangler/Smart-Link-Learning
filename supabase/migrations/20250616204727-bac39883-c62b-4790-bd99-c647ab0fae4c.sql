
-- Step 1.1: Analyze current data distribution
-- Check what data exists in each table

-- Check student_profiles table
SELECT 'student_profiles' as table_name, count(*) as record_count FROM student_profiles
UNION ALL
-- Check children table  
SELECT 'children' as table_name, count(*) as record_count FROM children
UNION ALL
-- Check student_subjects table
SELECT 'student_subjects' as table_name, count(*) as record_count FROM student_subjects
UNION ALL
-- Check child_subjects table
SELECT 'child_subjects' as table_name, count(*) as record_count FROM child_subjects
UNION ALL
-- Check student_challenges table
SELECT 'student_challenges' as table_name, count(*) as record_count FROM student_challenges
UNION ALL
-- Check child_challenges table
SELECT 'child_challenges' as table_name, count(*) as record_count FROM child_challenges
UNION ALL
-- Check students table (should be unused)
SELECT 'students' as table_name, count(*) as record_count FROM students
UNION ALL
-- Check conversations with student_profile_id
SELECT 'conversations_with_student_profile_id' as table_name, count(*) as record_count FROM conversations WHERE student_profile_id IS NOT NULL
UNION ALL
-- Check conversations with child_id
SELECT 'conversations_with_child_id' as table_name, count(*) as record_count FROM conversations WHERE child_id IS NOT NULL
UNION ALL
-- Check documents with student_profile_id
SELECT 'documents_with_student_profile_id' as table_name, count(*) as record_count FROM documents WHERE student_profile_id IS NOT NULL
UNION ALL
-- Check documents with child_id
SELECT 'documents_with_child_id' as table_name, count(*) as record_count FROM documents WHERE child_id IS NOT NULL;

-- Also check the structure differences between student_profiles and children
SELECT 'student_profiles_sample' as info, id, user_id, name, age_group, created_at FROM student_profiles LIMIT 3;
SELECT 'children_sample' as info, id, parent_id, name, age_group, created_at FROM children LIMIT 3;
