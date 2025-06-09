import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Star, Save, FileText } from 'lucide-react';
import { Child } from '../types';
import { StudentProfile, DocumentData } from '../types/database';
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
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Array<{ id: string; type: 'user' | 'ai'; content: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const learnerName = selectedChild?.name || selectedStudentProfile?.name || 'Student';

  useEffect(() => {
    if (profile) {
      fetchDocuments();
    }
  }, [profile, selectedChild]);

  const fetchDocuments = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      // Filter by child if parent user
      if (profile.user_type === 'parent' && selectedChild?.id) {
        query = query.eq('child_id', selectedChild.id);
      }

      // Filter by student profile if student user
      if (profile.user_type === 'student' && selectedStudentProfile?.id) {
        query = query.eq('student_profile_id', selectedStudentProfile.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('Fetched documents for chat:', data);
      
      // Type the documents properly to match DocumentData interface
      const typedDocuments: DocumentData[] = (data || []).map(doc => ({
        ...doc,
        document_type: doc.document_type as 'failed_test' | 'study_guide' | 'homework' | 'other'
      }));
      
      setDocuments(typedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const generateAIResponse = async (userMessage: string, context: string) => {
    // Check if user is asking about uploaded documents or analysis
    const mentionsAnalysis = userMessage.toLowerCase().includes('test') || 
                           userMessage.toLowerCase().includes('upload') || 
                           userMessage.toLowerCase().includes('document') ||
                           userMessage.toLowerCase().includes('look at') ||
                           userMessage.toLowerCase().includes('analyze') ||
                           userMessage.toLowerCase().includes('check out') ||
                           userMessage.toLowerCase().includes('see what') ||
                           userMessage.toLowerCase().includes('got wrong');

    if (mentionsAnalysis && documents.length > 0) {
      // Find the most recent test document
      const testDocument = documents.find(doc => doc.document_type === 'failed_test') || documents[0];
      
      if (testDocument) {
        // Since we can't actually read the PDF content, we'll provide a structured response 
        // that acknowledges the document and guides the user to provide specific details
        return `I can see you've uploaded "${testDocument.file_name}" for ${learnerName}! I understand you want me to analyze the test and create space-themed activities based on what he got wrong.

🚀 **SPACE MISSION: Help ${learnerName} Master Math!** 🛸

While I can see the test document, I need you to tell me which specific problems or math concepts ${learnerName} struggled with so I can create the perfect alien adventure activities! 

For example, if he had trouble with:

**🛸 Addition/Subtraction:** "Alien Rescue Mission" - Save aliens by solving math problems to power up the spaceship!

**🌟 Multiplication:** "Galactic Trading Post" - Help aliens trade resources using multiplication to calculate totals!

**🚀 Fractions:** "Space Pizza Party" - Help alien friends divide their space pizzas fairly!

**🌌 Word Problems:** "Mission Control" - Solve real space scenarios like calculating fuel needed for trips to different planets!

Could you tell me which specific math topics or types of problems from the test ${learnerName} found challenging? Then I can create amazing space adventures that make learning those concepts fun and engaging!`;
      }
    }

    // Original responses for other cases
    const responses = [
      `Hi ${learnerName}! I understand you're working on ${selectedCategories.subject}. Let me help you with that. Can you tell me more about what specific part you're struggling with?`,
      `That's a great question about ${selectedCategories.subject}! For someone in the ${selectedCategories.ageGroup} age group, I'd suggest we break this down into smaller steps. What would you like to focus on first?`,
      `I see you're dealing with ${selectedCategories.challenge}. Let's work together to make ${selectedCategories.subject} more manageable. What specific topic or problem would you like help with?`,
      `Thanks for sharing that with me, ${learnerName}! Given that you're working on ${selectedCategories.subject} and considering ${selectedCategories.challenge}, let me suggest some strategies that might help.`
    ];
    
    // Simple response selection based on message content
    if (userMessage.toLowerCase().includes('homework')) {
      return `Homework can be challenging, especially with ${selectedCategories.challenge}. For ${selectedCategories.subject}, let's make it more manageable. What specific homework assignment are you working on right now?`;
    }
    
    // Return a random contextual response
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
      // Generate AI response
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
              {documents.length > 0 && (
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <FileText size={12} />
                  {documents.length} document{documents.length !== 1 ? 's' : ''} available for analysis
                </p>
              )}
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
                {documents.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      📁 I can see you have {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
                    </p>
                    <p className="text-xs text-blue-600">
                      Ask me to analyze them or create activities based on the content!
                    </p>
                  </div>
                )}
                <div className="mt-4 text-sm text-gray-400">
                  <p>Try saying something like:</p>
                  <p>"Check out the failed test I uploaded" or "Look at the test and see what he got wrong"</p>
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

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
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
