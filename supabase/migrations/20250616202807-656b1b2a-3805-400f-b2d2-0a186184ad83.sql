
-- Enable RLS on forum tables if not already enabled
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for forum_categories (public read access)
DROP POLICY IF EXISTS "Anyone can view forum categories" ON forum_categories;
CREATE POLICY "Anyone can view forum categories" 
ON forum_categories FOR SELECT 
TO authenticated 
USING (true);

-- Create policies for forum_topics
DROP POLICY IF EXISTS "Anyone can view forum topics" ON forum_topics;
CREATE POLICY "Anyone can view forum topics" 
ON forum_topics FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Users can create topics" ON forum_topics;
CREATE POLICY "Users can create topics" 
ON forum_topics FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own topics" ON forum_topics;
CREATE POLICY "Users can update their own topics" 
ON forum_topics FOR UPDATE 
TO authenticated 
USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own topics" ON forum_topics;
CREATE POLICY "Users can delete their own topics" 
ON forum_topics FOR DELETE 
TO authenticated 
USING (auth.uid() = author_id);

-- Create policies for forum_posts
DROP POLICY IF EXISTS "Anyone can view forum posts" ON forum_posts;
CREATE POLICY "Anyone can view forum posts" 
ON forum_posts FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON forum_posts;
CREATE POLICY "Users can create posts" 
ON forum_posts FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON forum_posts;
CREATE POLICY "Users can update their own posts" 
ON forum_posts FOR UPDATE 
TO authenticated 
USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON forum_posts;
CREATE POLICY "Users can delete their own posts" 
ON forum_posts FOR DELETE 
TO authenticated 
USING (auth.uid() = author_id);

-- Ensure profiles table has proper RLS policies for forum access
DROP POLICY IF EXISTS "Users can view all profiles for forum" ON profiles;
CREATE POLICY "Users can view all profiles for forum" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);
