
import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Plus, Pin, Lock, Eye, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  color?: string;
  sort_order: number;
}

interface ForumTopic {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  description?: string;
  created_at?: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  view_count?: number;
  last_post_at?: string;
  last_post_author_name?: string;
  post_count?: number;
}

interface ForumPost {
  id: string;
  topic_id: string;
  author_id: string;
  content: string;
  created_at?: string;
  is_edited?: boolean;
}

interface CommunityForumProps {
  onClose: () => void;
  initialCategory?: string;
}

const CommunityForum: React.FC<CommunityForumProps> = ({ onClose, initialCategory }) => {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load forum categories',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopics = async (categoryId: string) => {
    try {
      setIsLoading(true);
      
      // First get the topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('forum_topics')
        .select(`
          *,
          profiles!forum_topics_author_id_fkey(first_name, last_name)
        `)
        .eq('category_id', categoryId)
        .order('is_pinned', { ascending: false })
        .order('last_post_at', { ascending: false });

      if (topicsError) throw topicsError;

      // Now get post counts for each topic
      const topicsWithCounts = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { count, error: countError } = await supabase
            .from('forum_posts')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id);

          if (countError) {
            console.error('Error counting posts for topic:', topic.id, countError);
            return { ...topic, post_count: count || 0 };
          }

          return { ...topic, post_count: count || 0 };
        })
      );

      setTopics(topicsWithCounts);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load forum topics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async (topicId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles!forum_posts_author_id_fkey(first_name, last_name)
        `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load forum posts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTopic = async () => {
    if (!newTopicTitle.trim() || !selectedCategory || !profile) return;

    try {
      const { data: topic, error: topicError } = await supabase
        .from('forum_topics')
        .insert({
          title: newTopicTitle.trim(),
          description: newTopicDescription.trim() || null,
          category_id: selectedCategory.id,
          author_id: profile.id,
          last_post_author_name: `${profile.first_name} ${profile.last_name}`.trim()
        })
        .select()
        .single();

      if (topicError) throw topicError;

      // Create the initial post if there's content
      if (newTopicDescription.trim()) {
        const { error: postError } = await supabase
          .from('forum_posts')
          .insert({
            topic_id: topic.id,
            author_id: profile.id,
            content: newTopicDescription.trim()
          });

        if (postError) throw postError;
      }

      toast({
        title: 'Success',
        description: 'Topic created successfully!'
      });

      setNewTopicTitle('');
      setNewTopicDescription('');
      setShowNewTopicForm(false);
      fetchTopics(selectedCategory.id);
    } catch (error) {
      console.error('Error creating topic:', error);
      toast({
        title: 'Error',
        description: 'Failed to create topic',
        variant: 'destructive'
      });
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim() || !selectedTopic || !profile) return;

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          topic_id: selectedTopic.id,
          author_id: profile.id,
          content: newPostContent.trim()
        });

      if (error) throw error;

      // Update topic's last post info
      await supabase
        .from('forum_topics')
        .update({
          last_post_at: new Date().toISOString(),
          last_post_author_name: `${profile.first_name} ${profile.last_name}`.trim()
        })
        .eq('id', selectedTopic.id);

      toast({
        title: 'Success',
        description: 'Post created successfully!'
      });

      setNewPostContent('');
      fetchPosts(selectedTopic.id);
      // Refresh topics to update post count
      if (selectedCategory) {
        fetchTopics(selectedCategory.id);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive'
      });
    }
  };

  const selectCategory = (category: ForumCategory) => {
    setSelectedCategory(category);
    setSelectedTopic(null);
    setPosts([]);
    fetchTopics(category.id);
  };

  const selectTopic = (topic: ForumTopic) => {
    setSelectedTopic(topic);
    fetchPosts(topic.id);
  };

  const goBack = () => {
    if (selectedTopic) {
      setSelectedTopic(null);
      setPosts([]);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setTopics([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuthorName = (post: ForumPost) => {
    const profile = (post as any).profiles;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return 'Anonymous';
  };

  const getTopicAuthorName = (topic: ForumTopic) => {
    const profile = (topic as any).profiles;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return 'Anonymous';
  };

  if (isLoading && !selectedCategory && !selectedTopic) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-blue-100 transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-4">
            {(selectedCategory || selectedTopic) && (
              <button
                onClick={goBack}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {selectedTopic ? selectedTopic.title : selectedCategory ? selectedCategory.name : 'Community Forum'}
              </h1>
              <p className="text-blue-100 mt-1">
                {selectedTopic ? 'Discussion' : selectedCategory ? selectedCategory.description : 'Connect with other parents and educators'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!selectedCategory ? (
            // Categories View
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => selectCategory(category)}
                  className="text-left p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-lg bg-${category.color || 'blue'}-100 flex items-center justify-center mb-4`}>
                    <MessageSquare className={`text-${category.color || 'blue'}-600`} size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </button>
              ))}
            </div>
          ) : !selectedTopic ? (
            // Topics View
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Topics</h2>
                <button
                  onClick={() => setShowNewTopicForm(!showNewTopicForm)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} />
                  New Topic
                </button>
              </div>

              {showNewTopicForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <input
                    type="text"
                    placeholder="Topic title"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Topic description (optional)"
                    value={newTopicDescription}
                    onChange={(e) => setNewTopicDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={createTopic}
                      disabled={!newTopicTitle.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Create Topic
                    </button>
                    <button
                      onClick={() => {
                        setShowNewTopicForm(false);
                        setNewTopicTitle('');
                        setNewTopicDescription('');
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {topics.map((topic) => (
                    <div
                      key={topic.id}
                      onClick={() => selectTopic(topic)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {topic.is_pinned && (
                              <Pin className="text-blue-500" size={16} />
                            )}
                            <h3 className="font-semibold text-gray-800">{topic.title}</h3>
                            {topic.is_locked && (
                              <Lock className="text-gray-400" size={16} />
                            )}
                          </div>
                          {topic.description && (
                            <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>By {getTopicAuthorName(topic)}</span>
                            <span>{formatDate(topic.created_at || '')}</span>
                            {topic.last_post_at && topic.last_post_at !== topic.created_at && (
                              <span>Last: {formatDate(topic.last_post_at)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MessageSquare size={16} />
                            <span>{topic.post_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye size={16} />
                            <span>{topic.view_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {topics.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No topics yet. Be the first to start a discussion!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Posts View
            <div>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post, index) => (
                    <div
                      key={post.id}
                      className={`p-4 rounded-lg border ${
                        index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {getAuthorName(post).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-800">{getAuthorName(post)}</span>
                            <span className="text-sm text-gray-500">{formatDate(post.created_at || '')}</span>
                            {post.is_edited && (
                              <span className="text-xs text-gray-400">(edited)</span>
                            )}
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{post.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {posts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No posts yet. Be the first to comment!</p>
                    </div>
                  )}

                  {/* Reply Form */}
                  {profile && !selectedTopic?.is_locked && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <textarea
                        placeholder="Write your reply..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={createPost}
                          disabled={!newPostContent.trim()}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Send size={16} />
                          Post Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityForum;
