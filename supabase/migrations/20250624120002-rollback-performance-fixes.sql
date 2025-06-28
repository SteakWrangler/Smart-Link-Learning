-- Rollback script for performance fixes migration
-- This script restores the original RLS policies if needed
-- WARNING: Only use this if the performance fixes cause issues

-- ============================================================================
-- STEP 1: Restore Original Auth RLS Policies (revert to auth.uid())
-- ============================================================================

-- Restore profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Restore children table policies
DROP POLICY IF EXISTS "Parents can view their children" ON public.children;
CREATE POLICY "Parents can view their children" ON public.children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = children.parent_id
    )
  );

DROP POLICY IF EXISTS "Parents can insert children" ON public.children;
CREATE POLICY "Parents can insert children" ON public.children
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = parent_id
    )
  );

DROP POLICY IF EXISTS "Parents can update their children" ON public.children;
CREATE POLICY "Parents can update their children" ON public.children
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = children.parent_id
    )
  );

DROP POLICY IF EXISTS "Parents can delete their children" ON public.children;
CREATE POLICY "Parents can delete their children" ON public.children
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = children.parent_id
    )
  );

-- Restore child_subjects table policies
DROP POLICY IF EXISTS "Parents can manage child subjects" ON public.child_subjects;
CREATE POLICY "Parents can manage child subjects" ON public.child_subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = child_subjects.child_id
    )
  );

-- Restore child_challenges table policies
DROP POLICY IF EXISTS "Parents can manage child challenges" ON public.child_challenges;
CREATE POLICY "Parents can manage child challenges" ON public.child_challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = child_challenges.child_id
    )
  );

-- Restore conversations table policies
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = conversations.child_id
    )
  );

DROP POLICY IF EXISTS "Users can insert their conversations" ON public.conversations;
CREATE POLICY "Users can insert their conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = child_id
    )
  );

DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
CREATE POLICY "Users can update their conversations" ON public.conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = conversations.child_id
    )
  );

DROP POLICY IF EXISTS "Users can delete their conversations" ON public.conversations;
CREATE POLICY "Users can delete their conversations" ON public.conversations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = conversations.child_id
    )
  );

-- Restore messages table policies
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.children ON children.id = conversations.child_id
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE conversations.id = messages.conversation_id
      AND profiles.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;
CREATE POLICY "Users can insert messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.children ON children.id = conversations.child_id
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE conversations.id = conversation_id
      AND profiles.id = auth.uid()
    )
  );

-- Restore conversation_tags table policies
DROP POLICY IF EXISTS "Users can manage tags for their conversations" ON public.conversation_tags;
CREATE POLICY "Users can manage tags for their conversations" ON public.conversation_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.children ON children.id = conversations.child_id
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE conversations.id = conversation_tags.conversation_id
      AND profiles.id = auth.uid()
    )
  );

-- Restore conversation_documents table policies
DROP POLICY IF EXISTS "Users can view conversation documents for their conversations" ON public.conversation_documents;
CREATE POLICY "Users can view conversation documents for their conversations" ON public.conversation_documents
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert conversation documents for their conversations" ON public.conversation_documents;
CREATE POLICY "Users can insert conversation documents for their conversations" ON public.conversation_documents
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete conversation documents for their conversations" ON public.conversation_documents;
CREATE POLICY "Users can delete conversation documents for their conversations" ON public.conversation_documents
  FOR DELETE USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
      )
    )
  );

-- Restore documents table policies
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Restore forum policies
DROP POLICY IF EXISTS "Users can create topics" ON public.forum_topics;
CREATE POLICY "Users can create topics" ON public.forum_topics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own topics" ON public.forum_topics;
CREATE POLICY "Users can update their own topics" ON public.forum_topics
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own topics" ON public.forum_topics;
CREATE POLICY "Users can delete their own topics" ON public.forum_topics
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can create posts" ON public.forum_posts;
CREATE POLICY "Users can create posts" ON public.forum_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.forum_posts;
CREATE POLICY "Users can update their own posts" ON public.forum_posts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.forum_posts;
CREATE POLICY "Users can delete their own posts" ON public.forum_posts
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Restore forum category policies
DROP POLICY IF EXISTS "Authenticated users can create categories" ON public.forum_categories;
CREATE POLICY "Authenticated users can create categories" ON public.forum_categories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.forum_categories;
CREATE POLICY "Authenticated users can update categories" ON public.forum_categories
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.forum_categories;
CREATE POLICY "Authenticated users can delete categories" ON public.forum_categories
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- STEP 2: Restore Duplicate Indexes (if needed)
-- ============================================================================

-- Recreate the duplicate indexes that were removed
-- Note: These are the generic names that were dropped
CREATE UNIQUE INDEX IF NOT EXISTS child_challenges_unique ON public.child_challenges(child_id, challenge_id);
CREATE UNIQUE INDEX IF NOT EXISTS child_subjects_unique ON public.child_subjects(child_id, subject_id);

-- ============================================================================
-- STEP 3: Verify Rollback
-- ============================================================================

-- Check that all policies now use auth.uid() again
SELECT 
  'ROLLBACK VERIFICATION' as verification_type,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'RESTORED'
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'STILL OPTIMIZED'
    ELSE 'NO AUTH CHECK'
  END as auth_check_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND qual LIKE '%auth.uid()%'
ORDER BY tablename, policyname;

-- ============================================================================
-- ROLLBACK COMPLETE
-- 
-- The database has been restored to its original state:
-- ✓ All policies use auth.uid() instead of (SELECT auth.uid())
-- ✓ Duplicate indexes have been restored
-- ✓ All original functionality is preserved
-- 
-- Note: Performance warnings will return in Supabase Performance Advisor
-- ============================================================================ 