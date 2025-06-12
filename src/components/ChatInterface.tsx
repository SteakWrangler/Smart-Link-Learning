import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Star, Save, FileText } from 'lucide-react';
import { Student } from '../types/database';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateChatResponse, ChatMessage } from '@/utils/openaiClient';

interface DocumentData {
  id: string;
  user_id: string;
  student_id: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_type: 'failed_test' | 'study_guide' | 'homework' | 'other';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | null;
  description: string | null;
  subject: string | null;
  extracted_content: string | null;
  processing_error: string | null;
  ai_analysis: any;
  created_at: string;
  updated_at: string;
}

interface ChatInterfaceProps {
  selectedCategories: {
    subject: string;
    ageGroup: string;
    challenge: string;
  };
  onBack: () => void;
  selectedStudent: Student;
  selectedStudentProfile?: Student | null;
  onSaveConversation: (conversation: any) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedCategories,
  onBack,
  selectedStudent,
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

  // Conversation context tracking
  const [conversationContext, setConversationContext] = useState({
    mathTopics: [] as string[],
    interests: [] as string[],
    currentGoal: '' as string,
    hasAnalyzedDocument: false,
    documentAnalysis: null as any,
    informationGathered: {
      mathTopic: false,
      interest: false,
      goal: false
    }
  });

  const learnerName = selectedStudent?.name || selectedStudentProfile?.name || 'Student';

  // Generate initial greeting with personalized examples
  const generateInitialGreeting = (): string => {
    const ageGroup = selectedStudent?.age_group || selectedStudentProfile?.age_group || '';
    const subjects = selectedStudent?.subjects || [];
    const challenges = selectedStudent?.challenges || [];
    const hasDocuments = documents.length > 0;
    
    let greeting = `👋 **Hi there! I'm ${learnerName}'s AI learning assistant.**\n\n`;
    
    // Add contextual information based on learner profile
    if (ageGroup) {
      const ageLabel = getAgeGroupLabel(ageGroup);
      greeting += `I'm here to help with ${ageLabel.toLowerCase()} learning. `;
    }
    
    if (subjects.length > 0) {
      greeting += `I see we're focusing on ${subjects.join(', ').toLowerCase()}. `;
    }
    
    if (challenges.some(c => c.toLowerCase().includes('dyslexia'))) {
      greeting += `I'll make sure to provide clear, visual explanations that work well for dyslexic learners. `;
    }
    
    if (challenges.some(c => c.toLowerCase().includes('adhd'))) {
      greeting += `I'll keep things engaging and structured for ADHD-friendly learning. `;
    }
    
    greeting += `\n\n**Here are some examples of the type of things I can help with:**\n\n`;
    
    // Add document-specific examples if documents are available
    if (hasDocuments) {
      greeting += `📄 **Analyze uploaded tests or documents**\n`;
      greeting += `• "Look at the test I uploaded and tell me what ${learnerName} got wrong"\n`;
      greeting += `• "Create practice problems based on the uploaded test"\n\n`;
    }
    
    // Age-appropriate examples
    if (ageGroup === 'early-elementary' || ageGroup === 'elementary') {
      greeting += `🧮 **Math Practice & Games**\n`;
      greeting += `• "Create a superhero-themed addition practice test"\n`;
      greeting += `• "Help me practice subtraction with dinosaurs"\n`;
      greeting += `• "Make a fun counting activity with pizza"\n\n`;
      
      greeting += `📚 **Learning Activities**\n`;
      greeting += `• "What's a fun way to learn multiplication tables?"\n`;
      greeting += `• "Create a 5-minute math game for rainy days"\n\n`;
    } else if (ageGroup === 'middle-school') {
      greeting += `📊 **Math & Science Help**\n`;
      greeting += `• "Explain fractions using real-world examples"\n`;
      greeting += `• "Create word problems about sports statistics"\n`;
      greeting += `• "Help me understand pre-algebra concepts"\n\n`;
      
      greeting += `🎯 **Study Strategies**\n`;
      greeting += `• "Make a practice test for my upcoming exam"\n`;
      greeting += `• "What's the best way to study for math tests?"\n\n`;
    } else if (ageGroup === 'high-school' || ageGroup === 'college') {
      greeting += `📈 **Advanced Math & Concepts**\n`;
      greeting += `• "Help me understand calculus derivatives"\n`;
      greeting += `• "Create practice problems for algebra II"\n`;
      greeting += `• "Explain statistics concepts with examples"\n\n`;
      
      greeting += `🎓 **Test Prep & Study Skills**\n`;
      greeting += `• "Build a comprehensive practice test for finals"\n`;
      greeting += `• "Help me break down complex problems step-by-step"\n\n`;
    } else {
      greeting += `🧮 **Math Practice**\n`;
      greeting += `• "Create practice problems for any math topic"\n`;
      greeting += `• "Help explain difficult concepts step-by-step"\n`;
      greeting += `• "Make learning fun with themed activities"\n\n`;
    }
    
    greeting += `💡 **Teaching Support**\n`;
    greeting += `• "How should I explain division to ${learnerName}?"\n`;
    greeting += `• "What are some hands-on activities for learning fractions?"\n\n`;
    
    greeting += `Just tell me what you'd like to work on, and I'll create personalized content that makes learning engaging and effective! 🌟`;
    
    return greeting;
  };

  // Helper function to get age group labels
  const getAgeGroupLabel = (ageGroupId: string): string => {
    const ageGroups = [
      { id: 'early-elementary', label: 'Early Elementary (5-7)' },
      { id: 'elementary', label: 'Elementary (8-10)' },
      { id: 'middle-school', label: 'Middle School (11-13)' },
      { id: 'high-school', label: 'High School (14-18)' },
      { id: 'college', label: 'College (18+)' }
    ];
    return ageGroups.find(a => a.id === ageGroupId)?.label || ageGroupId;
  };

  useEffect(() => {
    if (profile) {
      fetchDocuments();
    }
  }, [profile, selectedStudent]);

  // Add initial AI greeting when chat loads
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = generateInitialGreeting();
      const initialMessage = {
        id: 'initial-greeting',
        type: 'ai' as const,
        content: greeting,
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [selectedStudent, selectedStudentProfile, documents]);

  const fetchDocuments = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      // Filter by student if student user
      if (selectedStudent?.id) {
        query = query.eq('student_id', selectedStudent.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('Fetched documents for chat:', data);
      
      // Type the documents properly to match DocumentData interface with null safety
      const typedDocuments: DocumentData[] = (data || []).map(doc => ({
        id: doc.id,
        user_id: doc.user_id,
        student_id: doc.student_id,
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size,
        file_type: doc.file_type,
        document_type: doc.document_type as 'failed_test' | 'study_guide' | 'homework' | 'other',
        processing_status: doc.processing_status as 'pending' | 'processing' | 'completed' | 'failed' | null,
        description: doc.description,
        subject: doc.subject,
        extracted_content: doc.extracted_content,
        processing_error: doc.processing_error,
        ai_analysis: doc.ai_analysis,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      }));
      
      setDocuments(typedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  // Intelligent response generation using context
  const generateContextAwareResponse = async (userMessage: string): Promise<string> => {
    // Build conversation context for the LLM
    const conversationHistory = messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Add the current user message
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });
    
    // Build comprehensive context about the learner
    let systemContext = `You are an AI tutor helping ${learnerName} with personalized learning. `;
    
    // Add student-specific context
    if (selectedStudent) {
      const ageGroupLabel = getAgeGroupLabel(selectedStudent.age_group);
      systemContext += `${learnerName} is ${ageGroupLabel.toLowerCase()}. `;
      
      if (selectedStudent.subjects && selectedStudent.subjects.length > 0) {
        systemContext += `Their focus subjects are: ${selectedStudent.subjects.join(', ')}. `;
      }
      
      if (selectedStudent.challenges && selectedStudent.challenges.length > 0) {
        systemContext += `Important learning considerations: ${selectedStudent.challenges.join(', ')}. `;
        
        if (selectedStudent.challenges.some(challenge => challenge.toLowerCase().includes('dyslexia'))) {
          systemContext += `Since ${learnerName} has dyslexia, when relevant to the task, use clear fonts, avoid dense text, provide visual aids, and break down complex instructions into smaller steps. However, if the current task is purely mathematical and doesn't involve reading comprehension, the dyslexia may not be relevant to address. `;
        }
        
        if (selectedStudent.challenges.some(challenge => challenge.toLowerCase().includes('adhd'))) {
          systemContext += `Since ${learnerName} has ADHD, when relevant, keep activities shorter, provide clear structure, use engaging themes, and include movement or hands-on elements when possible. `;
        }
        
        if (selectedStudent.challenges.some(challenge => challenge.toLowerCase().includes('autism'))) {
          systemContext += `Since ${learnerName} has autism, when relevant, provide clear expectations, consistent structure, and consider sensory preferences. `;
        }
      }
    } else if (selectedStudentProfile) {
      const ageGroupLabel = getAgeGroupLabel(selectedStudentProfile.age_group);
      systemContext += `${learnerName} is ${ageGroupLabel.toLowerCase()}. `;
    }
    
    // Add document context if available
    const pdfDocs = documents.filter(doc => doc.file_type === 'application/pdf');
    if (pdfDocs.length > 0 && pdfDocs[0].ai_analysis) {
      const analysis = pdfDocs[0].ai_analysis as any;
      systemContext += `You have access to a test analysis showing ${learnerName} got ${analysis.accuracy}% accuracy with problem areas in: ${analysis.problemAreas?.join(', ')}. `;
    }
    
    systemContext += `Generate helpful, engaging responses that incorporate any themes, time constraints, difficulty preferences, or other requirements the user mentions. Be natural and conversational while providing practical educational content. Only address learning differences when they are relevant to the current task.`;
    
    // Call the LLM API with full conversation context
    return await callLLMAPI(systemContext, conversationHistory);
  };

  // Call OpenAI API with conversation context
  const callLLMAPI = async (systemPrompt: string, conversationHistory: any[]): Promise<string> => {
    try {
      // Prepare messages for OpenAI
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory
      ];
      
      // Call OpenAI API
      return await generateChatResponse(messages);
      
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return "I'm having trouble connecting to the AI service right now. Please check your API key configuration and try again.";
    }
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
      // Generate AI response using context
      const aiResponse = await generateContextAwareResponse(currentMessage);
      
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
      studentId: selectedStudent?.id || null,
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
                  <p>"Check out the failed test I uploaded" or "Look at the test and see what they got wrong"</p>
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
                    <span className="text-gray-600">Processing documents and analyzing content...</span>
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
