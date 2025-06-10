-- Create forum_categories table
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum_topics table
CREATE TABLE IF NOT EXISTS forum_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  last_post_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_post_author_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  parent_post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories (more specific ones)
INSERT INTO forum_categories (name, description, color, sort_order) VALUES
  ('Getting Started', 'New to learning support? Start here for basic guidance and introductions.', 'blue', 1),
  ('ADHD & Focus', 'Discussions about ADHD, attention issues, and focus strategies.', 'purple', 2),
  ('Dyslexia & Reading', 'Support for dyslexia, reading challenges, and literacy development.', 'rose', 3),
  ('Math & Numbers', 'Math anxiety, dyscalculia, and numerical learning support.', 'amber', 4),
  ('Processing & Learning Differences', 'Processing delays, sensory issues, and other learning differences.', 'cyan', 5),
  ('School & IEP Support', 'Navigating schools, IEPs, 504 plans, and educational advocacy.', 'green', 6),
  ('Managing Frustration', 'Dealing with learning challenges, stress, and emotional support.', 'orange', 7),
  ('Success Stories', 'Share wins, breakthroughs, and positive experiences.', 'emerald', 8),
  ('General Learning Support', 'All other learning support topics and general questions.', 'indigo', 9),
  ('Community Chat', 'General discussion, introductions, and community connection.', 'gray', 10); 