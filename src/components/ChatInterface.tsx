import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Star, Save, Upload, File, X } from 'lucide-react';
import { Child } from '../types';
import { StudentProfile, Subject } from '../types/database';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChatInterfaceProps {
  selectedCategories: {
    subject: string;
    ageGroup: string;
    challenge: string;
  };
  onBack: () => void;
  selectedChild: Child | null;
  selectedStudentProfile?: StudentProfile | null;
  onSaveConversation: (conversation: any) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedCategories,
  onBack,
  selectedChild,
  selectedStudentProfile,
  onSaveConversation
}) => {
  const [messages, setMessages] = useState<Array<{ id: string; type: 'user' | 'ai'; content: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { profile } = useAuth();
  const { toast } = useToast();

  const learnerName = selectedChild?.name || selectedStudentProfile?.name || 'Student';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image, PDF, or document file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !profile) return;

    setUploading(true);

    try {
      // Create file path with user folder structure
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Insert document metadata into database
      const documentData = {
        user_id: profile.id,
        child_id: selectedChild?.id || null,
        student_profile_id: selectedStudentProfile?.id || null,
        file_name: selectedFile.name,
        file_path: filePath,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        document_type: 'other' as const,
        description: `Uploaded during chat with ${learnerName}`,
        subject: selectedCategories.subject || null,
      };

      const { error: dbError } = await supabase
        .from('documents')
        .insert(documentData);

      if (dbError) throw dbError;

      // Add message about the uploaded file
      const fileMessage = {
        id: Date.now().toString(),
        type: 'user' as const,
        content: `📎 Uploaded file: ${selectedFile.name}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fileMessage]);

      // Generate AI response about the file
      const aiResponse = `I can see you've uploaded "${selectedFile.name}". I'll help ${learnerName} analyze this document and provide personalized learning support based on what's in it. What specific questions do you have about this material, or what would you like me to help ${learnerName} with regarding this document?`;
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);

      toast({
        title: "File uploaded successfully",
        description: "I can now help analyze this document with your child",
      });

      setSelectedFile(null);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const generateAIResponse = async (userMessage: string, context: string) => {
    const responses = [
      `Hi ${learnerName}! I understand you're working on ${selectedCategories.subject}. Let me help you with that. Can you tell me more about what specific part you're struggling with?`,
      `That's a great question about ${selectedCategories.subject}! For someone in the ${selectedCategories.ageGroup} age group, I'd suggest we break this down into smaller steps. What would you like to focus on first?`,
      `I see you're dealing with ${selectedCategories.challenge}. Let's work together to make ${selectedCategories.subject} more manageable. What specific topic or problem would you like help with?`,
      `Thanks for sharing that with me, ${learnerName}! Given that you're working on ${selectedCategories.subject} and considering ${selectedCategories.challenge}, let me suggest some strategies that might help.`
    ];
    
    if (userMessage.toLowerCase().includes('test') || userMessage.toLowerCase().includes('failed')) {
      return `I understand that ${learnerName} had some challenges with a recent test. That's completely normal and we can work together to improve! For ${selectedCategories.subject}, let's identify the specific areas that need more practice. Can you tell me which topics or problems were the most difficult?`;
    }
    
    if (userMessage.toLowerCase().includes('homework')) {
      return `Homework can be challenging, especially with ${selectedCategories.challenge}. For ${selectedCategories.subject}, let's make it more manageable. What specific homework assignment are you working on right now?`;
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const context = `Student: ${learnerName}, Subject: ${selectedCategories.subject}, Age Group: ${selectedCategories.ageGroup}, Challenge: ${selectedCategories.challenge}`;
      const aiResponse = await generateAIResponse(currentMessage, context);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  function handleSaveConversation() {
    if (!conversationTitle.trim()) return;

    const conversation = {
      childId: selectedChild?.id || null,
      studentProfileId: selectedStudentProfile?.id || null,
      title: conversationTitle.trim(),
      messages,
      isFavorite,
      tags
    };

    onSaveConversation(conversation);
    setShowSaveDialog(false);
    setConversationTitle('');
    setIsFavorite(false);
    setTags([]);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 flex-shrink-0">
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
                Learning with {learnerName}
              </h1>
              <p className="text-sm text-gray-600">
                {selectedCategories.subject} • {selectedCategories.ageGroup} • {selectedCategories.challenge}
              </p>
            </div>
          </div>
          
          {messages.length > 0 && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Save size={16} />
              Save Conversation
            </button>
          )}
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <p className="text-lg mb-2">Let's start learning together! 🌟</p>
                <p>I'm here to help {learnerName} with personalized lessons and activities.</p>
                <div className="mt-4 text-sm text-gray-400">
                  <p>Try saying something like:</p>
                  <p>"My child failed a math test" or "We need help with reading comprehension"</p>
                  <p className="mt-2">💡 You can also upload documents like tests or homework for analysis!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File Upload Area */}
          {selectedFile && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <File size={16} />
                  <span className="text-sm text-gray-700">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleFileUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload & Analyze'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Upload size={20} className="text-gray-500" />
              </label>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Conversation</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={conversationTitle}
                  onChange={(e) => setConversationTitle(e.target.value)}
                  placeholder="Enter conversation title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="favorite"
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="favorite" className="flex items-center gap-2 text-sm text-gray-700">
                  <Star size={16} />
                  Mark as favorite
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConversation}
                  disabled={!conversationTitle.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
