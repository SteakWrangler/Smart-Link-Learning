
import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Clock, Search, Filter, User, ArrowLeft } from 'lucide-react';
import { SavedConversation, Child } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface ConversationHistoryProps {
  children: Child[];
  onLoadConversation: (conversation: SavedConversation) => void;
  onBack: () => void;
  profile: any;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  children,
  onLoadConversation,
  onBack,
  profile
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChild, setFilterChild] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'saved'>('recent');
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, [activeTab]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('conversations')
        .select(`
          *,
          child:child_id (
            id,
            name
          ),
          student:student_profile_id (
            id,
            name
          ),
          messages (
            id,
            content,
            type,
            created_at
          )
        `)
        .eq('parent_id', profile.id)
        .order('created_at', { ascending: false });

      // Filter based on tab
      if (activeTab === 'saved') {
        query = query.eq('is_saved', true);
      }
      // For recent, we could add additional logic here if needed

      const { data: conversations, error } = await query;

      if (error) {
        console.error('Error loading conversations:', error);
        throw error;
      }

      // Transform the data to match our SavedConversation type
      const formattedConversations = conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        childId: conv.child_id || conv.student_profile_id,
        childName: conv.child ? conv.child.name : 
                   conv.student ? conv.student.name : 'Unknown',
        messages: conv.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          type: msg.type,
          timestamp: new Date(msg.created_at)
        })),
        createdAt: new Date(conv.created_at),
        isFavorite: conv.is_favorite || false
      }));

      setConversations(formattedConversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const newFavoriteStatus = !conversation.isFavorite;

      const { error } = await supabase
        .from('conversations')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', conversationId);

      if (error) throw error;

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, isFavorite: newFavoriteStatus }
            : conv
        )
      );

      toast({
        title: 'Success',
        description: `Conversation ${newFavoriteStatus ? 'added to' : 'removed from'} favorites`,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorite status',
        variant: 'destructive'
      });
    }
  };

  const getStudentName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.name || 'Unknown Student';
  };

  const filteredConversations = conversations.filter(conversation => {
    if (searchTerm && !conversation.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterChild !== 'all' && conversation.childId !== filterChild) {
      return false;
    }
    if (showFavoritesOnly && !conversation.isFavorite) {
      return false;
    }
    return true;
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === 'saved' ? 'Saved Conversations' : 'Recent Conversations'}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterChild}
              onChange={(e) => setFilterChild(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Students</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                showFavoritesOnly
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Star size={16} />
              Favorites Only
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'recent'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'saved'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Saved
          </button>
        </div>

        {/* Conversation List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {activeTab === 'recent' 
              ? 'No recent conversations'
              : 'No saved conversations yet. Click the save button in a conversation to save it.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConversations.map(conversation => (
              <div
                key={conversation.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 
                    className="font-medium text-gray-800 line-clamp-1 flex-1 mr-2"
                    onClick={() => onLoadConversation(conversation)}
                  >
                    {conversation.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(conversation.id);
                    }}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Star 
                      size={16} 
                      className={conversation.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} 
                    />
                  </button>
                </div>
                <div onClick={() => onLoadConversation(conversation)}>
                  <p className="text-sm text-gray-500 mb-2">{conversation.childName}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {conversation.messages[conversation.messages.length - 1]?.content || 'No messages'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Clock size={14} />
                    <span>{formatDate(conversation.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistory;
