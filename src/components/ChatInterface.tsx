
import React, { useState, useRef, useEffect } from 'react';
import { Send, Save, ArrowLeft, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

interface SavedConversation {
  id: string;
  title: string;
  childId: string;
  childName: string;
  messages: ChatMessage[];
  createdAt: Date;
  isFavorite: boolean;
}

interface Child {
  id: string;
  name: string;
  ageGroup: string;
  subjects: string[];
  challenges: string[];
  createdAt: Date;
}

interface ChatInterfaceProps {
  selectedCategories: {
    subject: string;
    ageGroup: string;
    challenge: string;
  };
  onBack: () => void;
  selectedChild: Child;
  onSaveConversation: (conversation: SavedConversation) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedCategories,
  onBack,
  selectedChild,
  onSaveConversation
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();

  useEffect(() => {
    // Scroll to bottom on message change
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveConversation = async () => {
    if (!selectedChild || !profile || messages.length === 0) {
      toast({
        title: 'Cannot save conversation',
        description: 'No messages to save or missing profile information',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      
      const title = conversationTitle.trim() || 
        (messages.find(m => m.type === 'user')?.content.slice(0, 50) + '...' || 'New Conversation');

      // Create the conversation record
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          child_id: selectedChild.id,
          title,
          is_favorite: isFavorite,
          is_saved: true
        })
        .select()
        .single();

      if (conversationError) {
        throw conversationError;
      }

      // Insert all messages
      const messageInserts = messages.map(message => ({
        conversation_id: conversationData.id,
        type: message.type,
        content: message.content
      }));

      const { error: messagesError } = await supabase
        .from('messages')
        .insert(messageInserts);

      if (messagesError) {
        throw messagesError;
      }

      // Save conversation tags if any exist
      if (tags.length > 0) {
        const tagInserts = tags.map(tag => ({
          conversation_id: conversationData.id,
          tag
        }));

        const { error: tagsError } = await supabase
          .from('conversation_tags')
          .insert(tagInserts);

        if (tagsError) {
          console.error('Error saving tags:', tagsError);
          // Don't throw here as the conversation is already saved
        }
      }

      toast({
        title: 'Success',
        description: 'Conversation saved successfully!'
      });

      if (onSaveConversation) {
        onSaveConversation({
          id: conversationData.id,
          title,
          childId: selectedChild.id,
          childName: selectedChild.name,
          messages: messages.map(msg => ({
            id: crypto.randomUUID(),
            content: msg.content,
            type: msg.type,
            timestamp: new Date()
          })),
          createdAt: new Date(),
          isFavorite
        });
      }

    } catch (error) {
      console.error('Error saving conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save conversation. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const sendMessage = () => {
    if (input.trim() === '') return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: input,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInput('');

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: crypto.randomUUID(),
        content: `This is a simulated AI response to: "${input}".`,
        type: 'ai',
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);
    }, 1000);
  };

  const addTag = (tag: string) => {
    if (tag.trim() !== '' && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
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
            <h1 className="text-2xl font-bold text-gray-800">Learning Session</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Card className="mb-4">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Session Details</h2>
            <p>
              <span className="font-medium">Subject:</span> {selectedCategories.subject}
            </p>
            <p>
              <span className="font-medium">Age Group:</span> {selectedCategories.ageGroup}
            </p>
            <p>
              <span className="font-medium">Challenge:</span> {selectedCategories.challenge}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Chat Messages */}
          <div className="space-y-2">
            {messages.map(message => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${message.type === 'user' ? 'bg-blue-100 text-blue-800 ml-auto w-fit max-w-[80%]' : 'bg-gray-100 text-gray-800 mr-auto w-fit max-w-[80%]'}`}
              >
                {message.content}
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} /> {/* Scroll anchor */}
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
            />
            <Button onClick={sendMessage}>
              <Send size={16} />
            </Button>
          </div>

          {/* Save Conversation Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Save Conversation</h3>
            <Input
              type="text"
              placeholder="Conversation Title"
              value={conversationTitle}
              onChange={e => setConversationTitle(e.target.value)}
              className="mb-2"
            />
            <div className="flex items-center gap-2 mb-2">
              <Input
                type="text"
                placeholder="Add tags..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    addTag(target.value);
                    target.value = ''; // Clear the input
                  }
                }}
              />
              {/* Tag List */}
              <div>
                {tags.map(tag => (
                  <Button
                    key={tag}
                    variant="secondary"
                    size="sm"
                    onClick={() => removeTag(tag)}
                    className="mr-1"
                  >
                    {tag} x
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button
                onClick={handleSaveConversation}
                disabled={saving}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                {saving ? 'Saving...' : <><Save size={16} className="mr-2" /> Save Conversation</>}
              </Button>
              <button
                onClick={toggleFavorite}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isFavorite
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Star size={16} className={isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                {isFavorite ? 'Favorite' : 'Add to Favorites'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
