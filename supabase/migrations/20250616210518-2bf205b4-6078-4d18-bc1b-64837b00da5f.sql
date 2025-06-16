
-- Enable RLS on tables that don't have it yet (safe operation)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_challenges ENABLE ROW LEVEL SECURITY;

-- Only create policies that don't already exist
DO $$
BEGIN
    -- Children table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'children' 
        AND policyname = 'Parents can manage their children'
    ) THEN
        CREATE POLICY "Parents can manage their children" ON public.children
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.id = children.parent_id
            )
        );
    END IF;

    -- Conversations table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'conversations' 
        AND policyname = 'Users can manage conversations for their children'
    ) THEN
        CREATE POLICY "Users can manage conversations for their children" ON public.conversations
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM children 
                JOIN profiles ON profiles.id = children.parent_id
                WHERE profiles.id = auth.uid() 
                AND children.id = conversations.child_id
            )
        );
    END IF;

    -- Messages table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'messages' 
        AND policyname = 'Users can manage messages in their conversations'
    ) THEN
        CREATE POLICY "Users can manage messages in their conversations" ON public.messages
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM conversations
                JOIN children ON children.id = conversations.child_id
                JOIN profiles ON profiles.id = children.parent_id
                WHERE conversations.id = messages.conversation_id
                AND profiles.id = auth.uid()
            )
        );
    END IF;

    -- Conversation tags table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'conversation_tags' 
        AND policyname = 'Users can manage tags for their conversations'
    ) THEN
        CREATE POLICY "Users can manage tags for their conversations" ON public.conversation_tags
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM conversations
                JOIN children ON children.id = conversations.child_id
                JOIN profiles ON profiles.id = children.parent_id
                WHERE conversations.id = conversation_tags.conversation_id
                AND profiles.id = auth.uid()
            )
        );
    END IF;

    -- Child subjects table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'child_subjects' 
        AND policyname = 'Parents can manage their children subjects'
    ) THEN
        CREATE POLICY "Parents can manage their children subjects" ON public.child_subjects
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM children 
                JOIN profiles ON profiles.id = children.parent_id
                WHERE profiles.id = auth.uid() 
                AND children.id = child_subjects.child_id
            )
        );
    END IF;

    -- Child challenges table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'child_challenges' 
        AND policyname = 'Parents can manage their children challenges'
    ) THEN
        CREATE POLICY "Parents can manage their children challenges" ON public.child_challenges
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM children 
                JOIN profiles ON profiles.id = children.parent_id
                WHERE profiles.id = auth.uid() 
                AND children.id = child_challenges.child_id
            )
        );
    END IF;
END $$;
