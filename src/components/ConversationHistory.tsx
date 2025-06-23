
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Heart, Star, MessageSquare, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Child, SavedConversation } from '@/types';
import type { Profile } from '@/types/database';

interface ConversationHistoryProps {
  children: Child[];
  onLoadConversation: (conversation: SavedConversation) => void;
  onBack: () => void;
  profile: Profile;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  children,
  onLoadConversation,
  onBack,
  profile
}) => {
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [profile]);

  const loadConversations = async () => {
    try {
      console.log('Loading conversations for user:', profile.id);
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          child:child_id (
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

      if (error) throw error;

      console.log('Loaded conversations data:', data);

      const formattedConversations = data.map(conv => ({
        id: conv.id,
        title: conv.title,
        child_id: conv.child_id,
        child_name: conv.child ? conv.child.name : 'Unknown',
        messages: conv.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          type: msg.type,
          created_at: msg.created_at
        })),
        created_at: conv.created_at,
        is_favorite: conv.is_favorite || false,
        is_saved: conv.is_saved || false
      }));

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const { error } = await supabase
        .from('conversations')
        .update({ 
          is_favorite: !conversation.is_favorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_favorite: !conv.is_favorite }
            : conv
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.child_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChild = selectedChild === 'all' || conversation.child_id === selectedChild;
    const matchesFavorites = !showFavoritesOnly || conversation.is_favorite;

    return matchesSearch && matchesChild && matchesFavorites;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Conversation History</h1>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Students</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFavoritesOnly
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Star size={16} className={showFavoritesOnly ? 'fill-current' : ''} />
              Favorites
            </button>
          </div>
        </div>
      </div>

      {/* Conversations */}
      <div className="max-w-6xl mx-auto p-6">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchTerm || selectedChild !== 'all' || showFavoritesOnly
                ? 'No conversations found'
                : 'No conversations yet'
              }
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedChild !== 'all' || showFavoritesOnly
                ? 'Try adjusting your filters or search terms.'
                : 'Start a learning session to create your first conversation.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConversations.map(conversation => (
              <div
                key={conversation.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden cursor-pointer"
                onClick={() => onLoadConversation(conversation)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 line-clamp-2 flex-1">
                      {conversation.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(conversation.id);
                      }}
                      className={`ml-2 p-1 rounded transition-colors ${
                        conversation.is_favorite
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    >
                      <Heart size={16} className={conversation.is_favorite ? 'fill-current' : ''} />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">{conversation.child_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>{new Date(conversation.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                  </div>

                  {conversation.messages.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {conversation.messages[0]?.content || 'No preview available'}
                      </p>
                    </div>
                  )}
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
