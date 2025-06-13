import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Star, Save, FileText } from 'lucide-react';
import { Child } from '../types';
import { StudentProfile, DocumentData } from '../types/database';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateChatResponse, ChatMessage } from '@/utils/openaiClient';
import { toast } from '@/components/ui/use-toast';

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

  const learnerName = selectedChild?.name || selectedStudentProfile?.name || 'Student';

  // Generate initial greeting with personalized examples
  const generateInitialGreeting = (): string => {
    const ageGroup = selectedChild?.ageGroup || selectedStudentProfile?.age_group || '';
    const subjects = selectedChild?.subjects || [];
    const challenges = selectedChild?.challenges || [];
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

  // Helper function to get age group labels (moved up to be accessible)
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
  }, [profile, selectedChild]);

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
  }, [selectedChild, selectedStudentProfile, documents]);

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
      
      // Type the documents properly to match DocumentData interface with null safety
      const typedDocuments: DocumentData[] = (data || []).map(doc => ({
        ...doc,
        document_type: doc.document_type as 'failed_test' | 'study_guide' | 'homework' | 'other',
        processing_status: doc.processing_status as 'pending' | 'processing' | 'completed' | 'failed' | null,
        child_id: doc.child_id as string | null,
        student_profile_id: doc.student_profile_id as string | null,
        description: doc.description as string | null,
        subject: doc.subject as string | null,
        extracted_content: doc.extracted_content as string | null,
        processing_error: doc.processing_error as string | null
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
    
    // Add child-specific context
    if (selectedChild) {
      const ageGroupLabel = getAgeGroupLabel(selectedChild.ageGroup);
      systemContext += `${learnerName} is ${ageGroupLabel.toLowerCase()}. `;
      
      if (selectedChild.subjects && selectedChild.subjects.length > 0) {
        systemContext += `Their focus subjects are: ${selectedChild.subjects.join(', ')}. `;
      }
      
      if (selectedChild.challenges && selectedChild.challenges.length > 0) {
        systemContext += `Important learning considerations: ${selectedChild.challenges.join(', ')}. `;
        
        // Provide specific guidance for learning differences
        if (selectedChild.challenges.some(challenge => challenge.toLowerCase().includes('dyslexia'))) {
          systemContext += `Since ${learnerName} has dyslexia, when relevant to the task, use clear fonts, avoid dense text, provide visual aids, and break down complex instructions into smaller steps. However, if the current task is purely mathematical and doesn't involve reading comprehension, the dyslexia may not be relevant to address. `;
        }
        
        if (selectedChild.challenges.some(challenge => challenge.toLowerCase().includes('adhd'))) {
          systemContext += `Since ${learnerName} has ADHD, when relevant, keep activities shorter, provide clear structure, use engaging themes, and include movement or hands-on elements when possible. `;
        }
        
        if (selectedChild.challenges.some(challenge => challenge.toLowerCase().includes('autism'))) {
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

  // Generate practice test with dynamic theming
  const generateLLMStylePracticeTest = (message: string): string => {
    const theme = extractThemeFromMessage(message);
    const now = new Date();
    const timeVariation = (now.getMinutes() * 60 + now.getSeconds()) % 100;
    
    const nums = {
      a: 3 + (timeVariation % 8),
      b: 2 + ((timeVariation * 3) % 7),
      c: 12 + (timeVariation % 12),
      d: 8 + ((timeVariation * 7) % 10)
    };

    let content = `🎯 **Practice Test for ${learnerName}**\n\n`;
    
    if (theme) {
      content += `All problems are themed around ${theme}!\n\n`;
      
      content += `**Addition Problems:**\n\n`;
      content += `1. You ordered ${nums.a} slices of ${theme} for lunch and ${nums.b} more slices for dinner. How many slices of ${theme} did you eat in total? ____\n\n`;
      content += `2. There are ${nums.c} pieces of ${theme} on one plate and ${nums.d} pieces on another plate. How many pieces are there altogether? ____\n\n`;
      
      content += `**Subtraction Problems:**\n\n`;
      const total1 = nums.c + nums.a;
      content += `3. You started with ${total1} pieces of ${theme}, but ate ${nums.a} pieces. How many pieces of ${theme} do you have left? ____\n\n`;
      const total2 = nums.d + nums.b;
      content += `4. There were ${total2} ${theme} slices, and ${nums.b} were eaten. How many slices remain? ____\n\n`;
    } else {
      content += `**Math Practice:**\n\n`;
      content += `1. ${nums.a} + ${nums.b} = ____\n\n`;
      content += `2. ${nums.c} + ${nums.d} = ____\n\n`;
      content += `3. ${nums.c + nums.a} - ${nums.a} = ____\n\n`;
      content += `4. ${nums.d + nums.b} - ${nums.b} = ____\n\n`;
    }
    
    content += `Great job working on these problems! 🌟`;
    
    return content;
  };

  // Extract theme from user message
  const extractThemeFromMessage = (message: string): string | null => {
    const text = message.toLowerCase();
    
    // Look for theme indicators
    const themePatterns = [
      /with (\w+)/,
      /about (\w+)/,
      /around (\w+)/,
      /context.*?(\w+)/,
      /theme.*?(\w+)/,
      /based on (\w+)/
    ];
    
    for (const pattern of themePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        return match[1];
      }
    }
    
    // Look for standalone interesting words
    const words = text.split(' ');
    const interestingWords = words.filter(word => 
      word.length > 3 && 
      !['practice', 'test', 'build', 'create', 'make', 'help'].includes(word) &&
      !['addition', 'subtraction', 'multiplication', 'division'].includes(word)
    );
    
    return interestingWords[0] || null;
  };

  // Generate themed response based on context
  const generateThemedResponse = (message: string, theme: string): string => {
    if (message.includes('practice test')) {
      return generateLLMStylePracticeTest(message);
    }
    
    return `I'd love to help create ${theme}-themed learning activities for ${learnerName}! What specific math concepts would you like to work on? I can create word problems, activities, or explanations that incorporate ${theme} to make learning more engaging.`;
  };

  // Generate contextual response based on conversation
  const generateContextualResponse = (message: string, conversationHistory: any[]): string => {
    const prevMessages = conversationHistory.slice(0, -1); // Exclude current message
    
    if (message.includes('help') && message.includes('test')) {
      return `I can help analyze test results and create practice materials for ${learnerName}. What specific areas would you like to focus on?`;
    }
    
    if (message.includes('activity') || message.includes('activities')) {
      return `I'd be happy to suggest learning activities for ${learnerName}! What math topics are you working on, and what makes learning fun for them?`;
    }
    
    return `I'm here to help ${learnerName} with personalized learning! I can create practice tests, explain concepts, suggest activities, or analyze uploaded documents. What would be most helpful?`;
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
      
      // Note: Context updates can be handled by the LLM naturally through conversation history
      
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

  const handleSaveConversation = async () => {
    try {
      if (!selectedChild && !selectedStudentProfile) {
        console.error('No child or student profile selected');
        toast({
          title: 'Error',
          description: 'Please select a student before saving.',
          variant: 'destructive'
        });
        return;
      }

      if (!profile?.id) {
        console.error('No profile ID found');
        toast({
          title: 'Error',
          description: 'User profile not found. Please try logging in again.',
          variant: 'destructive'
        });
        return;
      }

      // Create a title from the first user message
      const firstUserMessage = messages.find(m => m.type === 'user');
      const title = firstUserMessage?.content.slice(0, 50) + '...' || 'New Conversation';

      const conversationData = {
        child_id: selectedChild?.id || null,
        student_profile_id: selectedStudentProfile?.id || null,
        parent_id: profile.id,
        title,
        is_favorite: true
      };

      console.log('Saving conversation with data:', conversationData);

      // Save conversation to database
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      if (conversationError) {
        console.error('Error saving conversation:', conversationError);
        throw conversationError;
      }

      if (!conversation) {
        console.error('No conversation data returned after insert');
        throw new Error('No conversation data returned after insert');
      }

      console.log('Conversation saved successfully:', conversation);

      // Save messages
      const messageInserts = messages.map(msg => ({
        conversation_id: conversation.id,
        content: msg.content,
        type: msg.type,
        created_at: msg.timestamp.toISOString()
      }));

      console.log('Saving messages:', messageInserts);

      const { error: messagesError } = await supabase
        .from('messages')
        .insert(messageInserts);

      if (messagesError) {
        console.error('Error saving messages:', messagesError);
        throw messagesError;
      }

      console.log('Messages saved successfully');

      toast({
        title: 'Success',
        description: 'Conversation saved successfully!',
      });

      onSaveConversation(conversation);
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save conversation. Please try again.',
        variant: 'destructive'
      });
    }
  };

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
