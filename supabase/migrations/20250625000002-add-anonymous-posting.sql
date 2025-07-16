-- Add is_anonymous field to forum_posts table for anonymous posting
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Create index for efficient queries on anonymous posts
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_anonymous ON public.forum_posts(is_anonymous);

-- Update the forum post trigger function to handle anonymous posts
CREATE OR REPLACE FUNCTION update_topic_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update post count and last post info for the topic
  UPDATE public.forum_topics 
  SET 
    post_count = (SELECT COUNT(*) FROM public.forum_posts WHERE topic_id = NEW.topic_id),
    last_post_at = NEW.created_at,
    last_post_author_name = CASE 
      WHEN NEW.is_anonymous THEN 'Anonymous User'
      ELSE (SELECT CONCAT(first_name, ' ', last_name) FROM public.profiles WHERE id = NEW.author_id)
    END,
    updated_at = NOW()
  WHERE id = NEW.topic_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 