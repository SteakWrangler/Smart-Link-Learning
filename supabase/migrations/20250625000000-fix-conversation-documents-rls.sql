-- Fix RLS policy for conversation_documents to allow document uploads
-- The current policy is too restrictive and doesn't account for new conversations

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Users can view conversation documents for their conversations" ON conversation_documents;
DROP POLICY IF EXISTS "Users can insert conversation documents for their conversations" ON conversation_documents;
DROP POLICY IF EXISTS "Users can delete conversation documents for their conversations" ON conversation_documents;

-- Create more permissive policies that allow document uploads
-- For viewing: Allow access to conversation documents for conversations owned by the user
CREATE POLICY "Users can view conversation documents for their conversations" ON conversation_documents
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
      )
    )
  );

-- For inserting: Allow users to link documents to conversations they own
-- Also allow linking to documents they own (for new conversations)
CREATE POLICY "Users can insert conversation documents for their conversations" ON conversation_documents
  FOR INSERT WITH CHECK (
    -- Allow if the conversation belongs to the user
    (conversation_id IN (
      SELECT id FROM conversations 
      WHERE child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
      )
    )) OR
    -- OR if the document belongs to the user (for new conversations)
    (document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    ))
  );

-- For deleting: Allow users to unlink documents from conversations they own
CREATE POLICY "Users can delete conversation documents for their conversations" ON conversation_documents
  FOR DELETE USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
      )
    )
  );

-- Add a comment explaining the policy
COMMENT ON TABLE conversation_documents IS 'Links documents to conversations with permissive RLS for document uploads'; 