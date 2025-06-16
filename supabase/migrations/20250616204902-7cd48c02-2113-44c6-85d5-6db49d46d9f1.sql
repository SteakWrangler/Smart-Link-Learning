
-- Step 1.2 & 1.3: Data Migration and Table Cleanup (Corrected)
-- Handle dependent policies before dropping columns

-- First, drop all RLS policies that depend on student_profile_id
-- Drop policies on messages table
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON messages;

-- Drop policies on conversation_tags table  
DROP POLICY IF EXISTS "Users can manage tags for their conversations" ON conversation_tags;

-- Drop policies on conversations table that reference student_profile_id
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON conversations;

-- Now we can safely drop the student_profile_id columns
ALTER TABLE conversations DROP COLUMN IF EXISTS student_profile_id;
ALTER TABLE documents DROP COLUMN IF EXISTS student_profile_id;

-- Drop the redundant tables
DROP TABLE IF EXISTS student_challenges;
DROP TABLE IF EXISTS student_subjects;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS students;

-- Update the conversations table constraint to only check for child_id
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_check 
  CHECK (child_id IS NOT NULL);

-- Now recreate the RLS policies for the unified system
-- Enable RLS on tables if not already enabled
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_challenges ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for children table
DROP POLICY IF EXISTS "Parents can view their children" ON children;
CREATE POLICY "Parents can view their children" ON children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = children.parent_id
    )
  );

DROP POLICY IF EXISTS "Parents can insert children" ON children;
CREATE POLICY "Parents can insert children" ON children
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = parent_id
    )
  );

DROP POLICY IF EXISTS "Parents can update their children" ON children;
CREATE POLICY "Parents can update their children" ON children
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = children.parent_id
    )
  );

DROP POLICY IF EXISTS "Parents can delete their children" ON children;
CREATE POLICY "Parents can delete their children" ON children
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = children.parent_id
    )
  );

-- Create RLS policies for child_subjects
DROP POLICY IF EXISTS "Parents can manage child subjects" ON child_subjects;
CREATE POLICY "Parents can manage child subjects" ON child_subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children 
      JOIN profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = child_subjects.child_id
    )
  );

-- Create RLS policies for child_challenges
DROP POLICY IF EXISTS "Parents can manage child challenges" ON child_challenges;
CREATE POLICY "Parents can manage child challenges" ON child_challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children 
      JOIN profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = child_challenges.child_id
    )
  );

-- Recreate conversations policies (simplified for child_id only)
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      JOIN profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = conversations.child_id
    )
  );

CREATE POLICY "Users can insert their conversations" ON conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM children 
      JOIN profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = child_id
    )
  );

CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM children 
      JOIN profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = conversations.child_id
    )
  );

CREATE POLICY "Users can delete their conversations" ON conversations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM children 
      JOIN profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = conversations.child_id
    )
  );

-- Recreate messages policies (simplified for child_id only)
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN children ON children.id = conversations.child_id
      JOIN profiles ON profiles.id = children.parent_id
      WHERE conversations.id = messages.conversation_id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN children ON children.id = conversations.child_id
      JOIN profiles ON profiles.id = children.parent_id
      WHERE conversations.id = conversation_id
      AND profiles.id = auth.uid()
    )
  );

-- Recreate conversation_tags policies (simplified for child_id only)
CREATE POLICY "Users can manage tags for their conversations" ON conversation_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN children ON children.id = conversations.child_id
      JOIN profiles ON profiles.id = children.parent_id
      WHERE conversations.id = conversation_tags.conversation_id
      AND profiles.id = auth.uid()
    )
  );
