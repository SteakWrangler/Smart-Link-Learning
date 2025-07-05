import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MessageSquare, Users, Clock, Pin, Lock, Eye, X, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CommunityForumProps {
  onClose: () => void;
  initialCategory?: string;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  sort_order: number;
  topic_count?: number;
  last_post_at?: string;
}

interface ForumTopic {
  id: string;
  title: string;
  description?: string;
  author_id: string;
  author_name?: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  post_count: number;
  last_post_at: string;
  last_post_author_name?: string;
  created_at: string;
}

interface ForumPost {
  id: string;
  content: string;
  author_id: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
}

type ViewMode = 'categories' | 'topics' | 'topic';

const CommunityForum: React.FC<CommunityForumProps> = ({ onClose, initialCategory }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<ViewMode>(initialCategory ? 'topics' : 'categories');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{topicId: string, title: string} | null>(null);

  useEffect(() => {
    if (initialCategory) {
      // If we have an initial category, find it and go directly to topics
      findAndOpenCategory(initialCategory);
    } else {
      fetchCategories();
    }
  }, [initialCategory]);

  const ensureForumTables = async () => {
    try {
      // Try to execute raw SQL to create tables
      const { error } = await (supabase as any).rpc('exec_sql', {
        sql: `
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

          -- Insert default categories
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
            ('Community Chat', 'General discussion, introductions, and community connection.', 'gray', 10)
          ON CONFLICT (name) DO NOTHING;
        `
      });
      if (error) {
        console.log('SQL execution not available, tables may need manual creation');
      }
    } catch (error) {
      console.log('Tables setup error (may already exist):', error);
    }
  };

  const findAndOpenCategory = async (categoryName: string) => {
    try {
      setLoading(true);
      
      // First ensure tables exist and load categories from database
      await ensureForumTables();
      await fetchCategories();
      
      // Wait for categories to be loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Map topic names from Dashboard to category names
      const categoryMapping: Record<string, string> = {
        'guide': 'Getting Started',
        'frustration': 'Managing Frustration',
        'adhd/focus issues': 'ADHD & Focus Issues',
        'dyslexia': 'Dyslexia',
        'processing delays': 'Processing Delays',
        'math anxiety': 'Math Anxiety',
        'general learning support': 'General Learning Support',
        'community': 'General Chat'
      };
      
      const targetCategoryName = categoryMapping[categoryName.toLowerCase()] || 'General Discussion';
      
      // Get fresh categories and find the target (handle duplicates)
      const { data: categoriesData, error: queryError } = await (supabase as any)
        .from('forum_categories')
        .select('*')
        .eq('name', targetCategoryName)
        .limit(1);
      
      if (categoriesData && categoriesData.length > 0) {
        const categoryData = categoriesData[0];
        const targetCategory: ForumCategory = {
          id: categoryData.id,
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color,
          sort_order: categoryData.sort_order,
          topic_count: 0,
          last_post_at: new Date().toISOString()
        };
        
        setSelectedCategory(targetCategory);
        setViewMode('topics');
        await fetchTopics(targetCategory.id);
      } else {
        // Fallback to categories view
        setViewMode('categories');
      }
    } catch (error) {
      console.error('Error finding category:', error);
      // Fallback to regular categories view
      await fetchCategories();
      setViewMode('categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Fetch categories from database
      const { data: categories, error } = await (supabase as any)
        .from('forum_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        // Fallback to empty array if tables don't exist yet
        setCategories([]);
        return;
      }

      // Format the categories data
      const formattedCategories: ForumCategory[] = categories?.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        sort_order: category.sort_order,
        topic_count: 0, // We'll update this with real counts later
        last_post_at: new Date().toISOString()
      })) || [];

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load forum categories",
        variant: "destructive",
      });
      setCategories([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (categoryId: string) => {
    try {
      setLoading(true);
      
      // First ensure the forum tables exist
      await ensureForumTables();
      
      // Try to fetch topics from database using raw query
      const { data: topics, error } = await (supabase as any)
        .from('forum_topics')
        .select(`
          *,
          profiles!forum_topics_author_id_fkey(first_name, last_name)
        `)
        .eq('category_id', categoryId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching topics:', error);
        setTopics([]);
        return;
      }

      // Format the topics data with proper author names
      const formattedTopics: ForumTopic[] = topics?.map((topic: any) => {
        const authorName = topic.profiles 
          ? `${topic.profiles.first_name || ''} ${topic.profiles.last_name || ''}`.trim()
          : 'Unknown User';
        
        return {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          author_id: topic.author_id,
          author_name: authorName || 'Unknown User',
          is_pinned: topic.is_pinned,
          is_locked: topic.is_locked,
          view_count: topic.view_count,
          post_count: topic.post_count,
          last_post_at: topic.last_post_at,
          last_post_author_name: topic.last_post_author_name || 'Unknown User',
          created_at: topic.created_at
        };
      }) || [];

      setTopics(formattedTopics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast({
        title: "Error",
        description: "Failed to load forum topics",
        variant: "destructive",
      });
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (topicId: string) => {
    try {
      setLoading(true);
      const { data: posts, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:author_id (
            first_name,
            last_name
          )
        `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedPosts = posts.map(post => {
        const authorName = post.profiles 
          ? `${post.profiles.first_name || ''} ${post.profiles.last_name || ''}`.trim()
          : 'Unknown User';
        
        return {
          ...post,
          author_name: authorName || 'Unknown User'
        };
      });

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: ForumCategory) => {
    setSelectedCategory(category);
    setViewMode('topics');
    fetchTopics(category.id);
  };

  const handleTopicSelect = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    setViewMode('topic');
    fetchPosts(topic.id);
    
    // Increment view count when topic is viewed
    try {
      await (supabase as any)
        .from('forum_topics')
        .update({ 
          view_count: topic.view_count + 1
        })
        .eq('id', topic.id);
      
      // Update the local state to reflect the new view count
      setTopics(prevTopics => 
        prevTopics.map(t => 
          t.id === topic.id 
            ? { ...t, view_count: t.view_count + 1 }
            : t
        )
      );
      
      // Update the selected topic's view count as well
      setSelectedTopic(prev => prev ? { ...prev, view_count: prev.view_count + 1 } : null);
      
    } catch (error) {
      console.error('Error updating view count:', error);
      // Don't show error to user as this is not critical functionality
    }
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategory(null);
    setSelectedTopic(null);
  };

  const handleBackToTopics = () => {
    setViewMode('topics');
    setSelectedTopic(null);
  };

  const handleSubmitPost = async () => {
    if (!newPostContent.trim() || !selectedTopic || !profile) return;
    
    try {
      const authorName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User';
      
      // Save the post to the database
      const { data: newPost, error } = await (supabase as any)
        .from('forum_posts')
        .insert({
          topic_id: selectedTopic.id,
          content: newPostContent.trim(),
          author_id: profile.id,
          is_edited: false
        })
        .select(`
          *,
          profiles!forum_posts_author_id_fkey(first_name, last_name)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Format and add the new post to the current list
      const formattedPost: ForumPost = {
        id: newPost.id,
        content: newPost.content,
        author_id: newPost.author_id,
        author_name: authorName,
        created_at: newPost.created_at,
        updated_at: newPost.updated_at,
        is_edited: newPost.is_edited
      };
      
      // Add the post to the current posts list
      setPosts(prevPosts => [...prevPosts, formattedPost]);
      
      // Get the actual post count from database
      const { count: postCount, error: countError } = await (supabase as any)
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', selectedTopic.id);

      if (countError) {
        console.error('Error getting post count:', countError);
      }

      // Update topic post count with actual database count
      await (supabase as any)
        .from('forum_topics')
        .update({ 
          post_count: postCount || 0,
          last_post_at: new Date().toISOString(),
          last_post_author_name: authorName
        })
        .eq('id', selectedTopic.id);
      
      // Refresh the topics list to show updated counts
      if (selectedCategory) {
        await fetchTopics(selectedCategory.id);
      }
      
      // Clear the form
      setNewPostContent('');
      
      // Show success message
      toast({
        title: "Success",
        description: "Your post has been added!",
      });
      
    } catch (error) {
      console.error('Error submitting post:', error);
      toast({
        title: "Error",
        description: "Failed to post your message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !selectedCategory || !profile) return;
    
    try {
      const authorName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User';
      
      // Save the topic to the database
      const { data: newTopic, error } = await (supabase as any)
        .from('forum_topics')
        .insert({
          category_id: selectedCategory.id,
          title: newTopicTitle.trim(),
          description: newTopicDescription.trim() || null,
          author_id: profile.id,
          is_pinned: false,
          is_locked: false,
          view_count: 0,
          post_count: 0,
          last_post_at: new Date().toISOString(),
          last_post_author_name: authorName
        })
        .select(`
          *,
          profiles!forum_topics_author_id_fkey(first_name, last_name)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Format and add the new topic to the current list
      const formattedTopic: ForumTopic = {
        id: newTopic.id,
        title: newTopic.title,
        description: newTopic.description,
        author_id: newTopic.author_id,
        author_name: authorName,
        is_pinned: newTopic.is_pinned,
        is_locked: newTopic.is_locked,
        view_count: newTopic.view_count,
        post_count: newTopic.post_count,
        last_post_at: newTopic.last_post_at,
        last_post_author_name: newTopic.last_post_author_name,
        created_at: newTopic.created_at
      };
      
      // Add the topic to the current topics list
      setTopics(prevTopics => [formattedTopic, ...prevTopics]);
      
      // Clear the form
      setNewTopicTitle('');
      setNewTopicDescription('');
      setShowNewTopicForm(false);
      
      // Show success message
      toast({
        title: "Success",
        description: "Your topic has been created!",
      });
      
    } catch (error) {
      console.error('Error creating topic:', error);
      toast({
        title: "Error",
        description: "Failed to create your topic. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!profile) return;
    
    try {
      // Check if user owns this topic
      const topicToDelete = topics.find(t => t.id === topicId);
      if (!topicToDelete || topicToDelete.author_id !== profile.id) {
        toast({
          title: "Error",
          description: "You can only delete your own topics.",
          variant: "destructive",
        });
        return;
      }

      // Delete from database (will cascade delete all posts in this topic)
      const { error } = await (supabase as any)
        .from('forum_topics')
        .delete()
        .eq('id', topicId);

      if (error) {
        throw error;
      }

      // Remove from local state
      setTopics(prevTopics => prevTopics.filter(t => t.id !== topicId));
      
      toast({
        title: "Success",
        description: "Topic and all its posts have been deleted.",
      });
      
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({
        title: "Error",
        description: "Failed to delete topic. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!profile) return;
    
    try {
      // Check if user owns this post
      const postToDelete = posts.find(p => p.id === postId);
      if (!postToDelete || postToDelete.author_id !== profile.id) {
        toast({
          title: "Error",
          description: "You can only delete your own posts.",
          variant: "destructive",
        });
        return;
      }

      // Delete from database
      const { error } = await (supabase as any)
        .from('forum_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        throw error;
      }

      // Remove from local state
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      
      // Get the actual post count from database after deletion
      const { count: postCount, error: countError } = await (supabase as any)
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', selectedTopic?.id);

      if (countError) {
        console.error('Error getting post count:', countError);
      }

      // Update topic post count with actual database count
      if (selectedTopic) {
        await (supabase as any)
          .from('forum_topics')
          .update({ 
            post_count: postCount || 0
          })
          .eq('id', selectedTopic.id);
        
        // Refresh the topics list to show updated counts
        if (selectedCategory) {
          await fetchTopics(selectedCategory.id);
        }
      }
      
      toast({
        title: "Success",
        description: "Post has been deleted.",
      });
      
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      rose: 'bg-rose-50 text-rose-700 border-rose-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      pink: 'bg-pink-50 text-pink-700 border-pink-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colorMap[color] || colorMap.gray;
  };

  if (loading || (initialCategory && !selectedCategory)) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading community forum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {viewMode !== 'categories' && !initialCategory && (
              <button
                onClick={viewMode === 'topics' ? handleBackToCategories : handleBackToTopics}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            {viewMode === 'topic' && initialCategory && (
              <button
                onClick={handleBackToTopics}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Users className="text-blue-500" size={24} />
                Community Forum
              </h2>
              {selectedCategory && (
                <div className="text-sm text-gray-600">
                  {viewMode === 'topics' && (
                    <div className="font-medium text-lg text-gray-700 mt-1">
                      {selectedCategory.name} Discussion
                    </div>
                  )}
                  {viewMode === 'topic' && selectedTopic && (
                    <div>
                      <span className="font-medium">{selectedCategory.name}</span> &gt; {selectedTopic.title}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'categories' && !initialCategory && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Discussion Categories</h3>
                <p className="text-gray-600">
                  Connect with other parents and share experiences in our supportive community.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`p-4 rounded-lg border-2 text-left hover:shadow-md transition-all ${getColorClasses(category.color)}`}
                  >
                    <h4 className="font-semibold mb-2">{category.name}</h4>
                    <p className="text-sm mb-3 opacity-90">{category.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span>{category.topic_count} topics</span>
                      <span>Last post {formatTimeAgo(category.last_post_at!)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'topics' && selectedCategory && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedCategory.name}</h3>
                  <p className="text-gray-600">{selectedCategory.description}</p>
                </div>
                <button
                  onClick={() => setShowNewTopicForm(true)}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} />
                  New Topic
                </button>
              </div>

              <div className="space-y-3">
                {topics.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No topics yet</h3>
                    <p className="text-gray-500 mb-4">
                      Be the first to start a discussion in this category!
                    </p>
                  </div>
                ) : (
                  topics.map(topic => (
                  <div
                    key={topic.id}
                    className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <button 
                        onClick={() => handleTopicSelect(topic)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {topic.is_pinned && <Pin size={16} className="text-blue-500" />}
                          {topic.is_locked && <Lock size={16} className="text-gray-500" />}
                          <h4 className="font-semibold text-gray-800">{topic.title}</h4>
                        </div>
                        {topic.description && (
                          <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>By {topic.author_name}</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={12} />
                            {topic.post_count} replies
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {topic.view_count} views
                          </span>
                        </div>
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right text-xs text-gray-500">
                          <div>Last post by {topic.last_post_author_name}</div>
                          <div>{formatTimeAgo(topic.last_post_at)}</div>
                        </div>
                        
                        {/* Delete button - only show for topic author */}
                        {profile && topic.author_id === profile.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmation({topicId: topic.id, title: topic.title});
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete topic"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>

              {/* New Topic Form */}
              {showNewTopicForm && (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">Create New Topic</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Topic Title *
                      </label>
                      <input
                        type="text"
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        placeholder="What would you like to discuss?"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        value={newTopicDescription}
                        onChange={(e) => setNewTopicDescription(e.target.value)}
                        placeholder="Provide more details about your topic..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCreateTopic}
                        disabled={!newTopicTitle.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Create Topic
                      </button>
                      <button
                        onClick={() => {
                          setShowNewTopicForm(false);
                          setNewTopicTitle('');
                          setNewTopicDescription('');
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewMode === 'topic' && selectedTopic && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedTopic.title}</h3>
                {selectedTopic.description && (
                  <p className="text-gray-600">{selectedTopic.description}</p>
                )}
              </div>

              <div className="space-y-4 mb-6">
                {posts.map(post => (
                  <div key={post.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {post.author_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{post.author_name}</div>
                          <div className="text-xs text-gray-500">
                            {formatTimeAgo(post.created_at)}
                            {post.is_edited && ' (edited)'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete button - only show for post author */}
                      {profile && post.author_id === profile.id && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this post?')) {
                              handleDeletePost(post.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete post"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply form */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Reply to this topic</h4>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleSubmitPost}
                    disabled={!newPostContent.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Delete Topic
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deleteConfirmation.title}"? This will also delete all posts in this topic. This action cannot be undone.
            </p>
            <div className="flex gap-3">
                             <button
                 onClick={() => {
                   handleDeleteTopic(deleteConfirmation.topicId);
                   setDeleteConfirmation(null);
                 }}
                 className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
               >
                 Delete Topic
               </button>
               <button
                 onClick={() => setDeleteConfirmation(null)}
                 className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
               >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityForum;
