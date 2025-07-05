-- Add view_count and reply_count fields to forum_posts table
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Update existing posts to have default values
UPDATE public.forum_posts 
SET 
  view_count = COALESCE(view_count, 0),
  reply_count = COALESCE(reply_count, 0)
WHERE view_count IS NULL OR reply_count IS NULL; 