import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Clock, Search, Filter, User } from 'lucide-react';
import { SavedConversation, Child } from '../types';
import { supabase } from '@/integrations/supabase/client';

interface ConversationHistoryProps {
  children: Child[];
  onLoadConversation: (conversation: SavedConversation) => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  children,
  onLoadConversation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChild, setFilterChild] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      
      // Get all conversations for the current user's children
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          messages:messages(*)
        `)
        .in('child_id', children.map(child => child.id))
        .order('created_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Transform the data to match our SavedConversation type
      const transformedConversations: SavedConversation[] = conversationsData.map(conv => ({
        id: conv.id,
        childId: conv.child_id,
        studentProfileId: conv.student_profile_id,
        title: conv.title,
        isFavorite: conv.is_favorite,
        createdAt: new Date(conv.created_at),
        tags: [], // We can add tags later if needed
        messages: conv.messages.map((msg: any) => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: new Date(msg.created_at)
        }))
      }));

      setConversations(transformedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Conversation History</h2>
        <div className="flex items-center gap-4">
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={filterChild}
              onChange={(e) => setFilterChild(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Students</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No conversations found</h3>
          <p className="text-gray-600">
            {conversations.length === 0 
              ? "Start a learning session to see your conversation history here"
              : "Try adjusting your search or filters"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map(conversation => (
            <div
              key={conversation.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onLoadConversation(conversation)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{conversation.title}</h3>
                    {conversation.isFavorite && (
                      <Star size={16} className="text-yellow-500 fill-current" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      {getStudentName(conversation.childId!)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(conversation.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={14} />
                      {conversation.messages.length} messages
                    </div>
                  </div>
                </div>
              </div>
              
              {conversation.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {conversation.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-gray-600 text-sm line-clamp-2">
                {conversation.messages[0]?.content || 'No content'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationHistory;
