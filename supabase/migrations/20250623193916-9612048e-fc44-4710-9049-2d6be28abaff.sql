
-- Phase 5: Add remaining database constraints (only what's missing)

-- Add check constraints that don't already exist
DO $$
BEGIN
    -- Check if children_age_group_check exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'children_age_group_check'
    ) THEN
        ALTER TABLE public.children 
        ADD CONSTRAINT children_age_group_check 
        CHECK (age_group IN ('early-elementary', 'elementary', 'middle-school', 'high-school', 'college'));
    END IF;
    
    -- Check if conversations_child_id_required_check exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'conversations_child_id_required_check'
    ) THEN
        ALTER TABLE public.conversations 
        ADD CONSTRAINT conversations_child_id_required_check 
        CHECK (child_id IS NOT NULL);
    END IF;
    
    -- Check if messages_type_check exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'messages_type_check'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_type_check 
        CHECK (type IN ('user', 'ai'));
    END IF;
    
    -- Check if documents_type_check exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'documents_type_check'
    ) THEN
        ALTER TABLE public.documents 
        ADD CONSTRAINT documents_type_check 
        CHECK (document_type IN ('failed_test', 'study_guide', 'homework', 'other'));
    END IF;
    
    -- Check if documents_processing_status_check exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'documents_processing_status_check'
    ) THEN
        ALTER TABLE public.documents 
        ADD CONSTRAINT documents_processing_status_check 
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;
END $$;

-- Add indexes for better performance (using IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_child_id ON public.conversations(child_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_child_id ON public.documents(child_id);
CREATE INDEX IF NOT EXISTS idx_child_subjects_child_id ON public.child_subjects(child_id);
CREATE INDEX IF NOT EXISTS idx_child_challenges_child_id ON public.child_challenges(child_id);

-- Add unique constraints where appropriate (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'child_subjects_unique' 
        AND table_name = 'child_subjects'
    ) THEN
        ALTER TABLE public.child_subjects 
        ADD CONSTRAINT child_subjects_unique 
        UNIQUE (child_id, subject_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'child_challenges_unique' 
        AND table_name = 'child_challenges'
    ) THEN
        ALTER TABLE public.child_challenges 
        ADD CONSTRAINT child_challenges_unique 
        UNIQUE (child_id, challenge_id);
    END IF;
END $$;
