
-- Add performance indexes for common query patterns

-- Index for children lookup by parent (very common operation)
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);

-- Index for documents lookup by user and child
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_child_id ON public.documents(child_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_child ON public.documents(user_id, child_id);

-- Index for conversations by child and parent
CREATE INDEX IF NOT EXISTS idx_conversations_child_id ON public.conversations(child_id);
CREATE INDEX IF NOT EXISTS idx_conversations_parent_id ON public.conversations(parent_id);

-- Index for messages by conversation (for chat history)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at);

-- Index for conversation tags
CREATE INDEX IF NOT EXISTS idx_conversation_tags_conversation_id ON public.conversation_tags(conversation_id);

-- Index for child subjects and challenges
CREATE INDEX IF NOT EXISTS idx_child_subjects_child_id ON public.child_subjects(child_id);
CREATE INDEX IF NOT EXISTS idx_child_challenges_child_id ON public.child_challenges(child_id);

-- Index for forum performance (if users use the forum feature)
CREATE INDEX IF NOT EXISTS idx_forum_topics_category_id ON public.forum_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id ON public.forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON public.forum_posts(author_id);
