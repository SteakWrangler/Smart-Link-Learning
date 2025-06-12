-- Add a column to store extracted text content from PDFs
ALTER TABLE public.documents 
ADD COLUMN extracted_content TEXT;

-- Add a column to store AI analysis of the document
ALTER TABLE public.documents 
ADD COLUMN ai_analysis JSONB;

-- Add an index on extracted_content for better search performance
CREATE INDEX IF NOT EXISTS idx_documents_extracted_content 
ON public.documents USING gin(to_tsvector('english', extracted_content));

-- Migrate data from old schema to new schema
-- 1. Create new students table
CREATE TABLE public.students_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Migrate data from children and student_profiles to students_new
INSERT INTO public.students_new (id, user_id, name, age_group, created_at, updated_at)
SELECT id, parent_id, name, age_group, created_at, updated_at
FROM public.children;

INSERT INTO public.students_new (id, user_id, name, age_group, created_at, updated_at)
SELECT id, user_id, name, age_group, created_at, updated_at
FROM public.student_profiles;

-- 3. Create new junction tables
CREATE TABLE public.student_subjects_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students_new(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  UNIQUE(student_id, subject_id)
);

CREATE TABLE public.student_challenges_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students_new(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  UNIQUE(student_id, challenge_id)
);

-- 4. Migrate data from old junction tables to new ones
INSERT INTO public.student_subjects_new (student_id, subject_id)
SELECT child_id, subject_id
FROM public.child_subjects;

INSERT INTO public.student_subjects_new (student_id, subject_id)
SELECT student_profile_id, subject_id
FROM public.student_subjects;

INSERT INTO public.student_challenges_new (student_id, challenge_id)
SELECT child_id, challenge_id
FROM public.child_challenges;

INSERT INTO public.student_challenges_new (student_id, challenge_id)
SELECT student_profile_id, challenge_id
FROM public.student_challenges;

-- 5. Create new conversations table
CREATE TABLE public.conversations_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students_new(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Migrate conversations data
INSERT INTO public.conversations_new (id, student_id, title, is_favorite, created_at, updated_at)
SELECT c.id, c.child_id, c.title, c.is_favorite, c.created_at, c.updated_at
FROM public.conversations c
WHERE c.child_id IS NOT NULL;

INSERT INTO public.conversations_new (id, student_id, title, is_favorite, created_at, updated_at)
SELECT c.id, c.student_profile_id, c.title, c.is_favorite, c.created_at, c.updated_at
FROM public.conversations c
WHERE c.student_profile_id IS NOT NULL;

-- 7. Update documents table
ALTER TABLE public.documents
ADD COLUMN student_id UUID REFERENCES public.students_new(id) ON DELETE CASCADE;

UPDATE public.documents d
SET student_id = d.child_id
WHERE d.child_id IS NOT NULL;

UPDATE public.documents d
SET student_id = d.student_profile_id
WHERE d.student_profile_id IS NOT NULL;

-- 8. Drop old tables and columns
ALTER TABLE public.documents
DROP COLUMN child_id,
DROP COLUMN student_profile_id;

DROP TABLE public.child_challenges;
DROP TABLE public.child_subjects;
DROP TABLE public.children;
DROP TABLE public.student_challenges;
DROP TABLE public.student_subjects;
DROP TABLE public.student_profiles;
DROP TABLE public.conversations;

-- 9. Rename new tables to final names
ALTER TABLE public.students_new RENAME TO students;
ALTER TABLE public.student_subjects_new RENAME TO student_subjects;
ALTER TABLE public.student_challenges_new RENAME TO student_challenges;
ALTER TABLE public.conversations_new RENAME TO conversations;

-- 10. Update RLS policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own students" ON public.students
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students" ON public.students
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students" ON public.students
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students" ON public.students
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own student subjects" ON public.student_subjects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = student_subjects.student_id
    AND students.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own student subjects" ON public.student_subjects
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = student_subjects.student_id
    AND students.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own student challenges" ON public.student_challenges
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = student_challenges.student_id
    AND students.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own student challenges" ON public.student_challenges
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = student_challenges.student_id
    AND students.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own conversations" ON public.conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = conversations.student_id
    AND students.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own conversations" ON public.conversations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = conversations.student_id
    AND students.user_id = auth.uid()
  )
);
