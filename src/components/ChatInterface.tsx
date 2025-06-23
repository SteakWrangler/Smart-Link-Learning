
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Save, Heart, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { Child } from '@/types';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  created_at: string;
}

interface ChatInterfaceProps {
  selectedCategories: {
    subject: string;
    ageGroup: string;
    challenge: string;
  };
  onBack: () => void;
  selectedChild: Child;
  onSaveConversation?: (conversation: any) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedCategories,
  onBack,
  selectedChild,
  onSaveConversation
}) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedChild) {
      initializeChat();
    }
  }, [selectedChild]);

  const initializeChat = async () => {
    if (!profile || !selectedChild) return;

    // Create initial conversation
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          title: `Learning Session with ${selectedChild.name}`,
          child_id: selectedChild.id,
          parent_id: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      setConversationId(conversation.id);

      // Add initial AI greeting
      const greetingMessage = `Hi ${selectedChild.name}! I'm here to help you learn about ${selectedCategories.subject}. What would you like to explore today?`;
      
      const aiMessage: Message = {
        id: 'greeting',
        type: 'ai',
        content: greetingMessage,
        created_at: new Date().toISOString()
      };

      setMessages([aiMessage]);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast({
        title: "Error",
        description: "Failed to start learning session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !profile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Save user message to database
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        type: 'user',
        content: userMessage.content
      });

      // Get AI response
      const response = await fetch(`https://pvkrrwxgezxtmnxgpxhw.supabase.co/functions/v1/chat-with-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2a3Jyd3hnZXp4dG1ueGdweGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0ODg1OTEsImV4cCI6MjA2NTA2NDU5MX0.uoQZYi7zlMXY6QIAZ8FKvYCHV5uIzzOODUl2YKXf75E`
        },
        body: JSON.stringify({
          message: userMessage.content,
          child: selectedChild,
          categories: selectedCategories,
          conversationHistory: messages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiResponseData = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponseData.response,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to database
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        type: 'ai',
        content: aiMessage.content
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConversation = async () => {
    if (!conversationId || messages.length === 0) return;

    setIsSaving(true);
    try {
      // Update conversation as saved
      const { error } = await supabase
        .from('conversations')
        .update({ 
          is_saved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Conversation saved successfully.",
      });

      if (onSaveConversation) {
        onSaveConversation({
          id: conversationId,
          title: `Learning Session with ${selectedChild.name}`,
          child_id: selectedChild.id,
          child_name: selectedChild.name,
          messages: messages,
          created_at: new Date().toISOString(),
          is_saved: true,
          is_favorite: false
        });
      }

    } catch (error) {
      console.error('Error saving conversation:', error);
      toast({
        title: "Error",
        description: "Failed to save conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!selectedChild) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No student selected</h2>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Learning Session with {selectedChild.name}
              </h1>
              <p className="text-sm text-gray-600">
                {selectedCategories.subject} • Age: {selectedCategories.ageGroup} • Focus: {selectedCategories.challenge}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveConversation}
              disabled={isSaving || messages.length <= 1}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.id}-${index}`}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-75 mt-2 block">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 shadow-sm border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question or share what you'd like to learn..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
