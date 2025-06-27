-- Create conversation_documents table to link documents to specific conversations
CREATE TABLE IF NOT EXISTS conversation_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, document_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_documents_conversation_id ON conversation_documents(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_documents_document_id ON conversation_documents(document_id);

-- Add RLS policies
ALTER TABLE conversation_documents ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see conversation documents for conversations they own
CREATE POLICY "Users can view conversation documents for their conversations" ON conversation_documents
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
      )
    )
  );

-- Policy to allow users to insert conversation documents for their conversations
CREATE POLICY "Users can insert conversation documents for their conversations" ON conversation_documents
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
      )
    )
  );

-- Policy to allow users to delete conversation documents for their conversations
CREATE POLICY "Users can delete conversation documents for their conversations" ON conversation_documents
  FOR DELETE USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
      )
    )
  ); 