-- Community Forum Tables

-- Forum Categories (different support areas)
CREATE TABLE public.forum_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Topics (discussion threads)
CREATE TABLE public.forum_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  last_post_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_post_author_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Posts (messages within topics)
CREATE TABLE public.forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default forum categories
INSERT INTO public.forum_categories (name, description, color, sort_order) VALUES 
('Getting Started', 'New to learning support? Start here for basic guidance and introductions.', 'blue', 1),
('ADHD & Focus', 'Discussions about ADHD, attention issues, and focus strategies.', 'purple', 2),
('Dyslexia & Reading', 'Support for dyslexia, reading challenges, and literacy development.', 'rose', 3),
('Math & Numbers', 'Math anxiety, dyscalculia, and numerical learning support.', 'amber', 4),
('Processing & Learning Differences', 'Processing delays, sensory issues, and other learning differences.', 'cyan', 5),
('School & IEP Support', 'Navigating schools, IEPs, 504 plans, and educational advocacy.', 'green', 6),
('Parent Self-Care', 'Supporting yourself while supporting your child.', 'pink', 7),
('Success Stories', 'Share wins, breakthroughs, and positive experiences.', 'emerald', 8),
('General Discussion', 'Everything else - questions, chat, and community connection.', 'gray', 9);

-- Enable Row Level Security
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_categories (read-only for authenticated users)
CREATE POLICY "Authenticated users can view categories" ON public.forum_categories
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for forum_topics
CREATE POLICY "Authenticated users can view topics" ON public.forum_topics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create topics" ON public.forum_topics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their topics" ON public.forum_topics
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their topics" ON public.forum_topics
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- RLS Policies for forum_posts
CREATE POLICY "Authenticated users can view posts" ON public.forum_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create posts" ON public.forum_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their posts" ON public.forum_posts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their posts" ON public.forum_posts
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Create indexes for performance
CREATE INDEX idx_forum_topics_category_id ON public.forum_topics(category_id);
CREATE INDEX idx_forum_topics_last_post_at ON public.forum_topics(last_post_at DESC);
CREATE INDEX idx_forum_posts_topic_id ON public.forum_posts(topic_id);
CREATE INDEX idx_forum_posts_created_at ON public.forum_posts(created_at DESC);

-- Create functions to update post counts and last post info
CREATE OR REPLACE FUNCTION update_topic_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update post count and last post info for the topic
  UPDATE public.forum_topics 
  SET 
    post_count = (SELECT COUNT(*) FROM public.forum_posts WHERE topic_id = NEW.topic_id),
    last_post_at = NEW.created_at,
    last_post_author_id = NEW.author_id,
    updated_at = NOW()
  WHERE id = NEW.topic_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update topic stats when posts are added
CREATE TRIGGER trigger_update_topic_stats
  AFTER INSERT ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_stats();

-- Function to handle post deletion
CREATE OR REPLACE FUNCTION handle_post_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update post count for the topic
  UPDATE public.forum_topics 
  SET 
    post_count = (SELECT COUNT(*) FROM public.forum_posts WHERE topic_id = OLD.topic_id),
    updated_at = NOW()
  WHERE id = OLD.topic_id;
  
  -- Update last post info if this was the last post
  UPDATE public.forum_topics 
  SET 
    last_post_at = COALESCE(
      (SELECT created_at FROM public.forum_posts WHERE topic_id = OLD.topic_id ORDER BY created_at DESC LIMIT 1),
      created_at
    ),
    last_post_author_id = COALESCE(
      (SELECT author_id FROM public.forum_posts WHERE topic_id = OLD.topic_id ORDER BY created_at DESC LIMIT 1),
      author_id
    )
  WHERE id = OLD.topic_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post deletion
CREATE TRIGGER trigger_handle_post_deletion
  AFTER DELETE ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_deletion(); 