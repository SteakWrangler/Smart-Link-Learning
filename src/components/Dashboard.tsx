import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle, FileText, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AddChildForm from './AddChildForm';
import ChildProfile from './ChildProfile';
import CategorySelector from './CategorySelector';
import ChatInterface from './ChatInterface';
import ConversationHistory from './ConversationHistory';
import type { Child, Conversation } from '@/types/database';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showConversationHistory, setShowConversationHistory] = useState(false);

  useEffect(() => {
    fetchChildren();
    fetchConversations();
  }, [profile]);

  const fetchChildren = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchConversations = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          children (name),
          student_profiles (name)
        `)
        .or(`child_id.in.(${children.map(c => c.id).join(',')}),student_profile_id.eq.${profile.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleChildAdded = () => {
    setShowAddChild(false);
    fetchChildren();
  };

  const handleStartChat = (child: Child) => {
    setSelectedChild(child);
    setShowCategorySelector(true);
  };

  const handleCategoriesSelected = (categories: any) => {
    setSelectedCategories(categories);
    setShowCategorySelector(false);
    setShowChat(true);
  };

  const handleBackToCategories = () => {
    setShowChat(false);
    setShowCategorySelector(true);
  };

  const handleBackToDashboard = () => {
    setShowChat(false);
    setShowCategorySelector(false);
    setSelectedChild(null);
    setSelectedCategories(null);
  };

  const handleSaveConversation = async (conversationData: any) => {
    try {
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          child_id: conversationData.childId,
          title: conversationData.title,
          is_favorite: conversationData.isFavorite,
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      const messages = conversationData.messages.map((msg: any) => ({
        conversation_id: conversation.id,
        type: msg.type,
        content: msg.content,
        created_at: msg.timestamp.toISOString(),
      }));

      const { error: messagesError } = await supabase
        .from('messages')
        .insert(messages);

      if (messagesError) throw messagesError;

      if (conversationData.tags && conversationData.tags.length > 0) {
        const tags = conversationData.tags.map((tag: string) => ({
          conversation_id: conversation.id,
          tag,
        }));

        const { error: tagsError } = await supabase
          .from('conversation_tags')
          .insert(tags);

        if (tagsError) throw tagsError;
      }

      fetchConversations();
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  if (showChat && selectedChild && selectedCategories) {
    return (
      <ChatInterface
        selectedCategories={selectedCategories}
        onBack={handleBackToCategories}
        selectedChild={selectedChild}
        onSaveConversation={handleSaveConversation}
      />
    );
  }

  if (showCategorySelector && selectedChild) {
    return (
      <CategorySelector
        onCategoriesSelected={handleCategoriesSelected}
        onBack={handleBackToDashboard}
        selectedChild={selectedChild}
      />
    );
  }

  if (showConversationHistory) {
    return (
      <ConversationHistory
        conversations={conversations}
        onBack={() => setShowConversationHistory(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Parent Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your children's learning journey</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowConversationHistory(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageCircle size={16} />
              View Conversations
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <ChildProfile
              key={child.id}
              child={child}
              onStartChat={() => handleStartChat(child)}
            />
          ))}

          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center h-48 text-center">
              <Plus size={32} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Add New Child</h3>
              <p className="text-sm text-gray-500 mb-4">Create a profile for your child to start their learning journey</p>
              <Button onClick={() => setShowAddChild(true)}>Add Child</Button>
            </CardContent>
          </Card>
        </div>

        {showAddChild && (
          <AddChildForm
            onChildAdded={handleChildAdded}
            onCancel={() => setShowAddChild(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
