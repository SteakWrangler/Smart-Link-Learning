
-- Remove student_profiles related tables and dependencies
-- These are no longer needed since we unified everything under the children table

-- Drop junction tables first (due to foreign key constraints)
DROP TABLE IF EXISTS public.student_subjects;
DROP TABLE IF EXISTS public.student_challenges;

-- Drop the main student_profiles table
DROP TABLE IF EXISTS public.student_profiles;

-- Clean up any references in conversations table
-- Update conversations to remove student_profile_id column and related constraint
ALTER TABLE public.conversations 
DROP COLUMN IF EXISTS student_profile_id;

-- Remove the check constraint that required either child_id or student_profile_id
ALTER TABLE public.conversations 
DROP CONSTRAINT IF EXISTS conversations_check;

-- Update RLS policies for conversations to only reference child_id
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON public.conversations;

-- Recreate simplified RLS policies for conversations (only child_id path)
CREATE POLICY "Users can view their conversations" ON public.conversations
FOR SELECT USING (
  child_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.children 
    JOIN public.profiles ON profiles.id = children.parent_id
    WHERE profiles.id = auth.uid() 
    AND children.id = conversations.child_id
  )
);

CREATE POLICY "Users can insert their conversations" ON public.conversations
FOR INSERT WITH CHECK (
  child_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.children 
    JOIN public.profiles ON profiles.id = children.parent_id
    WHERE profiles.id = auth.uid() 
    AND children.id = child_id
  )
);

CREATE POLICY "Users can update their conversations" ON public.conversations
FOR UPDATE USING (
  child_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.children 
    JOIN public.profiles ON profiles.id = children.parent_id
    WHERE profiles.id = auth.uid() 
    AND children.id = conversations.child_id
  )
);

CREATE POLICY "Users can delete their conversations" ON public.conversations
FOR DELETE USING (
  child_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.children 
    JOIN public.profiles ON profiles.id = children.parent_id
    WHERE profiles.id = auth.uid() 
    AND children.id = conversations.child_id
  )
);

-- Update RLS policies for messages to only use child_id path
DROP POLICY IF EXISTS "Users can view messages for their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages for their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages for their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages for their conversations" ON public.messages;

-- Recreate simplified RLS policies for messages
CREATE POLICY "Users can view messages for their conversations" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.child_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.children 
      WHERE children.id = conversations.child_id
      AND children.parent_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert messages for their conversations" ON public.messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = conversation_id
    AND conversations.child_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.children 
      WHERE children.id = conversations.child_id
      AND children.parent_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update messages for their conversations" ON public.messages
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.child_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.children 
      WHERE children.id = conversations.child_id
      AND children.parent_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete messages for their conversations" ON public.messages
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.child_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.children 
      WHERE children.id = conversations.child_id
      AND children.parent_id = auth.uid()
    )
  )
);

-- Update conversation_tags RLS policy
DROP POLICY IF EXISTS "Users can manage tags for their conversations" ON public.conversation_tags;

CREATE POLICY "Users can manage tags for their conversations" ON public.conversation_tags
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = conversation_tags.conversation_id
    AND conversations.child_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = conversations.child_id
    )
  )
);

-- Remove any remaining references to student_profile_id in documents table
ALTER TABLE public.documents 
DROP COLUMN IF EXISTS student_profile_id;
