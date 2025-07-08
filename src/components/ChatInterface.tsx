import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Star, FileText, Upload, X, Download } from 'lucide-react';
import { Child, SavedConversation, ConversationDocument } from '../types';
import { DocumentData } from '../types/database';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateChatResponse, ChatMessage } from '@/utils/openaiClient';
import { toast } from '@/components/ui/use-toast';
import ConversationDocumentUpload from '@/components/ConversationDocumentUpload';
import DocumentListModal from '@/components/DocumentListModal';
import type { Tables } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';
import DownloadOptions from '@/components/DownloadOptions';
import { fileGenerationService } from '@/services/fileGenerationService';
import DownloadableContent from '@/components/DownloadableContent';

interface ChatInterfaceProps {
  selectedCategories: {
    subject: string;
    ageGroup: string;
    challenge: string;
  } | null;
  onBack: () => void;
  selectedChild: Child | null;
  onSaveConversation: (conversation: any) => void;
  loadedConversation?: SavedConversation | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedCategories,
  onBack,
  selectedChild,
  onSaveConversation,
  loadedConversation
}) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Array<{ id: string; type: 'user' | 'ai'; content: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [conversationDocuments, setConversationDocuments] = useState<Tables<'documents'>[]>([]);
  const [isLoadedConversation, setIsLoadedConversation] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showDocumentList, setShowDocumentList] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialGreetingAdded = useRef(false);

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

  const learnerName = selectedChild?.name || 'Student';

  // Load conversation messages if a loaded conversation is provided
  useEffect(() => {
    console.log('ChatInterface: loadedConversation prop changed:', loadedConversation);
    
    if (loadedConversation && loadedConversation.messages) {
      console.log('Loading conversation messages:', loadedConversation.messages);
      console.log('Setting messages to:', loadedConversation.messages.length, 'messages');
      setIsLoadingConversation(true);
      setMessages(loadedConversation.messages);
      setConversationTitle(loadedConversation.title);
      setIsFavorite(loadedConversation.isFavorite || false);
      setIsLoadedConversation(true);
      setCurrentConversationId(loadedConversation.id);
      setHasUnsavedChanges(false);
      initialGreetingAdded.current = true; // Don't add greeting for loaded conversations
      console.log('Conversation loaded successfully');
      // Small delay to ensure state is set before allowing auto-save
      setTimeout(() => setIsLoadingConversation(false), 100);
    } else if (!loadedConversation) {
      // Reset to new conversation state
      console.log('Resetting to new conversation');
      setIsLoadingConversation(true);
      setMessages([]);
      setConversationTitle('');
      setIsFavorite(false);
      setIsLoadedConversation(false);
      setCurrentConversationId(null);
      setHasUnsavedChanges(false);
      initialGreetingAdded.current = false; // Reset for new conversations
      setTimeout(() => setIsLoadingConversation(false), 100);
    }
  }, [loadedConversation]);

  useEffect(() => {
    if (profile) {
      fetchDocuments();
    }
  }, [profile, selectedChild]);



  // Fetch documents from Supabase
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

      const { data, error } = await query;

      if (error) throw error;

      console.log('Fetched documents for chat:', data);
      
      // Type the documents properly to match DocumentData interface with null safety
      const typedDocuments: DocumentData[] = (data || []).map(doc => ({
        ...doc,
        document_type: doc.document_type as 'failed_test' | 'study_guide' | 'homework' | 'other',
        processing_status: doc.processing_status as 'pending' | 'processing' | 'completed' | 'failed' | null,
        child_id: doc.child_id as string | null,
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

  // Fetch conversation-specific documents
  const fetchConversationDocuments = async () => {
    if (!currentConversationId) return;

    try {
      const { data, error } = await supabase
        .from('conversation_documents')
        .select(`
          *,
          documents (*)
        `)
        .eq('conversation_id', currentConversationId);

      if (error) throw error;

      console.log('Fetched conversation documents:', data);
      
      const typedConversationDocuments: Tables<'documents'>[] = (data || []).map(cd => {
        const doc = cd.documents as any;
        return {
          id: doc.id,
          user_id: doc.user_id,
          child_id: doc.child_id,
          file_name: doc.file_name,
          file_path: doc.file_path,
          file_size: doc.file_size,
          file_type: doc.file_type,
          document_type: doc.document_type,
          description: doc.description,
          subject: doc.subject,
          extracted_content: doc.extracted_content,
          ai_analysis: doc.ai_analysis,
          processing_status: doc.processing_status,
          processing_error: doc.processing_error,
          created_at: doc.created_at,
          updated_at: doc.updated_at
        };
      });
      
      setConversationDocuments(typedConversationDocuments);
    } catch (error) {
      console.error('Error fetching conversation documents:', error);
      setConversationDocuments([]);
    }
  };

  // Load conversation documents when conversation changes
  useEffect(() => {
    console.log('Conversation ID changed:', currentConversationId);
    if (currentConversationId) {
      console.log('Fetching documents for conversation:', currentConversationId);
      fetchConversationDocuments();
    } else if (!isLoadedConversation) {
      // Only clear documents if we're not in a loaded conversation
      // This prevents clearing documents during auto-save operations
      console.log('Clearing conversation documents - no conversation ID and not loaded conversation');
      setConversationDocuments([]);
    }
  }, [currentConversationId, isLoadedConversation]);

  // Handle document upload to conversation
  const handleDocumentUpload = async (documents: Tables<'documents'>[]) => {
    console.log('Document upload handler called with:', documents.length, 'documents');
    console.log('Current conversation documents before:', conversationDocuments.length);
    
    setConversationDocuments(prev => {
      const newDocs = [...prev, ...documents];
      console.log('New conversation documents count:', newDocs.length);
      return newDocs;
    });
    setHasUnsavedChanges(true);

    // Temporarily disable auto-save during document upload processing
    setIsLoadingConversation(true);

    // Add user message showing the upload
    const uploadMessage = documents.length === 1 
      ? `Uploaded: ${documents[0].file_name}`
      : `Uploaded ${documents.length} documents: ${documents.map(doc => doc.file_name).join(', ')}`;

    const userMessageObj = {
      id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user' as const,
      content: uploadMessage,
      timestamp: new Date()
    };

    setMessages(prev => {
      console.log('Adding upload message, current messages:', prev.length);
      return [...prev, userMessageObj];
    });
    setHasUnsavedChanges(true);

    // Generate automatic response for uploaded documents
    try {
      const response = await generateDocumentUploadResponse(documents);
      
      const aiMessageObj = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai' as const,
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => {
        console.log('Adding AI response message, current messages:', prev.length);
        return [...prev, aiMessageObj];
      });
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error generating document upload response:', error);
    } finally {
      // Re-enable auto-save after document upload processing is complete
      setTimeout(() => setIsLoadingConversation(false), 500);
    }
  };

  // Generate response for uploaded documents
  const generateDocumentUploadResponse = async (documents: Tables<'documents'>[]): Promise<string> => {
    // Build document context
    const documentContext = documents.map(doc => {
      const content = doc.extracted_content || '';
      const analysis = doc.ai_analysis ? JSON.stringify(doc.ai_analysis) : '';
      return `Document: ${doc.file_name}\nContent: ${content}\nAnalysis: ${analysis}`;
    }).join('\n\n');

    const systemPrompt = `You are ${learnerName}'s AI learning assistant. The user has uploaded documents.

Uploaded documents:
${documentContext}

Provide a helpful response that:
1. Acknowledges each uploaded document by name
2. Confirms that you have received the documents
3. Briefly summarizes what you can see in the documents (if content is available)
4. Gives 3-4 specific examples of what you can help with, such as:
   - "I can analyze this test and identify areas for improvement"
   - "I can create practice problems based on this content"
   - "I can explain any concepts that need clarification"
   - "I can generate additional worksheets or activities"
5. Ask what they'd like to do with the documents

Keep the response friendly and encouraging. If the document content isn't available yet, acknowledge the upload and ask what they'd like to do with it.`;

    return await callLLMAPI(systemPrompt, []);
  };

  // Auto-save conversation when messages change
  useEffect(() => {
    console.log('Auto-save effect triggered:', {
      messagesLength: messages.length,
      hasSelectedChild: !!selectedChild,
      hasProfile: !!profile?.id,
      hasUnsavedChanges,
      currentConversationId,
      isLoadedConversation,
      isLoadingConversation
    });
    
    if (messages.length > 1 && selectedChild && profile?.id && hasUnsavedChanges && !isLoadingConversation) {
      const autoSaveConversation = async () => {
        try {
          // If this is a loaded conversation, update it
          if (isLoadedConversation && currentConversationId) {
            // Update existing conversation
            const { error: conversationError } = await supabase
              .from('conversations')
              .update({
                title: conversationTitle.trim() || loadedConversation?.title || 'Updated Conversation',
                is_favorite: isFavorite,
                updated_at: new Date().toISOString()
              })
              .eq('id', currentConversationId);

            if (conversationError) {
              console.error('Error updating conversation:', conversationError);
              return;
            }

            // Delete existing messages
            const { error: deleteError } = await supabase
              .from('messages')
              .delete()
              .eq('conversation_id', currentConversationId);

            if (deleteError) {
              console.error('Error deleting old messages:', deleteError);
              return;
            }

            // Insert updated messages
            const messageInserts = messages.map(msg => ({
              conversation_id: currentConversationId,
              content: msg.content,
              type: msg.type,
              created_at: msg.timestamp.toISOString()
            }));

            const { error: messagesError } = await supabase
              .from('messages')
              .insert(messageInserts);

            if (messagesError) {
              console.error('Error saving updated messages:', messagesError);
              return;
            }

            console.log('Conversation auto-saved successfully');
            setHasUnsavedChanges(false);
          } else {
            // Create new conversation
            const title = conversationTitle.trim() || 
              (messages.find(m => m.type === 'user')?.content.slice(0, 50) + '...' || 'New Conversation');

            const conversationData = {
              child_id: selectedChild.id,
              title,
              is_favorite: isFavorite,
              is_saved: true
            };

            const { data: conversation, error: conversationError } = await supabase
              .from('conversations')
              .insert(conversationData)
              .select()
              .single();

            if (conversationError) {
              console.error('Error saving conversation:', conversationError);
              return;
            }

            if (!conversation) {
              console.error('No conversation data returned after insert');
              return;
            }

            const messageInserts = messages.map(msg => ({
              conversation_id: conversation.id,
              content: msg.content,
              type: msg.type,
              created_at: msg.timestamp.toISOString()
            }));

            const { error: messagesError } = await supabase
              .from('messages')
              .insert(messageInserts);

            if (messagesError) {
              console.error('Error saving messages:', messagesError);
              return;
            }

            console.log('New conversation auto-saved successfully with ID:', conversation.id);
            setCurrentConversationId(conversation.id);
            setIsLoadedConversation(true);
            setHasUnsavedChanges(false);
          }
        } catch (error) {
          console.error('Error auto-saving conversation:', error);
        }
      };

      // Debounce auto-save to avoid too many database calls
      const timeoutId = setTimeout(autoSaveConversation, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, selectedChild, profile?.id, isLoadedConversation, conversationTitle, isFavorite, loadedConversation?.title, hasUnsavedChanges, isLoadingConversation]);

  // Handle back button - no save prompt needed
  const handleBack = () => {
    onBack();
  };

  // Generate initial greeting with personalized examples
  const generateInitialGreeting = (): string => {
    const ageGroup = selectedChild?.ageGroup || '';
    const subjects = selectedChild?.subjects || [];
    const challenges = selectedChild?.challenges || [];
    
    let greeting = `👋 **Hi there! I'm ${learnerName}'s AI learning assistant.**\n\n`;
    
    // Add contextual information based on learner profile
    if (ageGroup) {
      const ageLabel = getAgeGroupLabel(ageGroup);
      greeting += `I'm here to help with ${ageLabel.toLowerCase()} learning. `;
    }
    
    if (subjects.length > 0) {
      greeting += `I see we're focusing on ${subjects.join(', ').toLowerCase()}. `;
    }
    
    // Only mention challenges the student actually has
    const challengeLower = challenges.map(c => c.toLowerCase());
    
    if (challengeLower.some(c => c.includes('dyslexia'))) {
      greeting += `I'll make sure to provide clear, visual explanations that work well for dyslexic learners. `;
    }
    
    if (challengeLower.some(c => c.includes('adhd') || c.includes('focus'))) {
      greeting += `I'll keep things engaging and structured for ADHD-friendly learning. `;
    }
    
    if (challengeLower.some(c => c.includes('processing'))) {
      greeting += `I'll provide extra time and break down complex concepts to support processing needs. `;
    }
    
    if (challengeLower.some(c => c.includes('math anxiety'))) {
      greeting += `I'll create a supportive, low-pressure environment to help build math confidence. `;
    }
    
    if (challengeLower.some(c => c.includes('general learning support'))) {
      greeting += `I'll use multiple teaching approaches and provide positive reinforcement to support learning. `;
    }
    
    greeting += `\n\n**Here are some examples of the type of things I can help with:**\n\n`;
    
    // Add document upload capability
    greeting += `📄 **Upload and Analyze Documents**\n`;
    greeting += `• Upload a test or document using the upload button below\n`;
    greeting += `• "Look at the test I uploaded and tell me what ${learnerName} got wrong"\n`;
    greeting += `• "Create practice problems based on the uploaded test"\n\n`;
    
    greeting += `📥 **Download Content**\n`;
    greeting += `• "Create a worksheet for ${learnerName} to practice"\n`;
    greeting += `• "Make a practice test about dinosaurs"\n`;
    greeting += `• "Generate an activity sheet about space"\n`;
    greeting += `• When I create educational content (worksheets, tests, activities), you'll see a download button to save as PDF!\n\n`;
    
    // Age-appropriate examples with specific subjects and themes
    if (ageGroup === 'early-elementary' || ageGroup === 'elementary') {
      const primarySubject = subjects.length > 0 ? subjects[0] : 'math';
      greeting += `🧮 **Subject Practice & Games**\n`;
      greeting += `• "Create a dinosaur-themed ${primarySubject} practice test"\n`;
      greeting += `• "Help me practice ${primarySubject} with space exploration"\n`;
      greeting += `• "Make a fun ${primarySubject} activity with underwater creatures"\n\n`;
      
      greeting += `📚 **Learning Activities**\n`;
      greeting += `• "What's a fun way to learn ${primarySubject} using building blocks?"\n`;
      greeting += `• "Create a 5-minute ${primarySubject} game about animals"\n\n`;
    } else if (ageGroup === 'middle-school') {
      const primarySubject = subjects.length > 0 ? subjects[0] : 'math';
      greeting += `📊 **Subject & Science Help**\n`;
      greeting += `• "Explain ${primarySubject} concepts using video game examples"\n`;
      greeting += `• "Create ${primarySubject} problems about basketball statistics"\n`;
      greeting += `• "Help me understand ${primarySubject} using cooking measurements"\n\n`;
      
      greeting += `🎯 **Study Strategies**\n`;
      greeting += `• "Make a practice test for my upcoming ${primarySubject} exam"\n`;
      greeting += `• "What's the best way to study for ${primarySubject} tests?"\n\n`;
    } else if (ageGroup === 'high-school' || ageGroup === 'college') {
      const primarySubject = subjects.length > 0 ? subjects[0] : 'math';
      greeting += `📈 **Advanced Subject & Concepts**\n`;
      greeting += `• "Help me understand advanced ${primarySubject} concepts"\n`;
      greeting += `• "Create practice problems for ${primarySubject}"\n`;
      greeting += `• "Explain ${primarySubject} concepts with real-world examples"\n\n`;
      
      greeting += `🎓 **Test Prep & Study Skills**\n`;
      greeting += `• "Build a comprehensive practice test for ${primarySubject} finals"\n`;
      greeting += `• "Help me break down complex ${primarySubject} problems step-by-step"\n\n`;
    } else {
      const primarySubject = subjects.length > 0 ? subjects[0] : 'math';
      greeting += `🧮 **Subject Practice**\n`;
      greeting += `• "Create practice problems for ${primarySubject} topics"\n`;
      greeting += `• "Help explain difficult ${primarySubject} concepts step-by-step"\n`;
      greeting += `• "Make learning fun with themed ${primarySubject} activities"\n\n`;
    }
    
    greeting += `💡 **Teaching Support**\n`;
    const primarySubject = subjects.length > 0 ? subjects[0] : 'math';
    greeting += `• "How should I explain ${primarySubject} concepts to ${learnerName}?"\n`;
    greeting += `• "What are some hands-on activities for learning ${primarySubject}?"\n\n`;
    
    greeting += `🎭 **Themed Learning**\n`;
    greeting += `• "Create space exploration ${primarySubject} problems where astronauts use math to navigate"\n`;
    greeting += `• "Make dinosaur ${primarySubject} problems that use actual dinosaur facts and measurements"\n`;
    greeting += `• "Design ocean ${primarySubject} activities that incorporate real marine biology concepts"\n\n`;
    
    greeting += `🎮 **Immersive Activities & Games**\n`;
    greeting += `• "Create a space station game where ${learnerName} is an astronaut using ${primarySubject} to solve problems"\n`;
    greeting += `• "Design a dinosaur park simulation where ${learnerName} manages resources using ${primarySubject} skills"\n`;
    greeting += `• "Make an underwater adventure where ${learnerName} uses ${primarySubject} knowledge to explore the ocean"\n`;
    greeting += `• "Create a robot workshop where ${learnerName} builds machines using ${primarySubject} concepts"\n`;
    greeting += `• "Design a superhero challenge where ${learnerName} uses ${primarySubject} thinking to save the day"\n\n`;
    
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

  // Add initial AI greeting when chat loads (only for new conversations)
  useEffect(() => {
    if (messages.length === 0 && !loadedConversation && !initialGreetingAdded.current) {
      const greeting = generateInitialGreeting();
      const initialMessage = {
        id: 'initial-greeting',
        type: 'ai' as const,
        content: greeting,
        timestamp: new Date()
      };
      setMessages([initialMessage]);
      initialGreetingAdded.current = true;
    }
  }, [selectedChild, documents.length, loadedConversation]);

  // Generate context-aware response using OpenAI API
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
    let systemContext = `You are an AI tutor helping ${learnerName} with personalized learning. 

IMPORTANT DOWNLOAD INSTRUCTIONS:
When you create actual educational content that should be downloadable (worksheets, practice tests, activities, etc.), include the special marker "DOWNLOADABLE_CONTENT_START" at the beginning and "DOWNLOADABLE_CONTENT_END" at the end of your response. This tells the system to show a download button.

Examples of content that should be downloadable:
- Worksheets with problems and answer spaces
- Practice tests with questions and answer keys
- Activities with instructions and materials lists
- Educational games with rules and printables
- Structured learning materials meant to be printed

Examples of content that should NOT be downloadable:
- General explanations or advice
- Conversational responses
- Brief acknowledgments
- Prompts or requests

When creating downloadable content:
1. ALWAYS include blank spaces for answers (using ___, [ ], or similar patterns)
2. ALWAYS include an answer key section at the bottom with the format:
   [ANSWER_KEY_START]
   1. [answer]
   2. [answer]
   etc.
   [ANSWER_KEY_END]
3. Structure it clearly for printing

CRITICAL: NEVER create download links or URLs in your responses. The download functionality is handled automatically by the system when you use the DOWNLOADABLE_CONTENT markers. Do not include phrases like "you can download the PDF below" or create any links. Simply provide the educational content with the markers and the system will automatically show the download option.`;
    
    // Add child-specific context
    if (selectedChild) {
      const ageGroupLabel = getAgeGroupLabel(selectedChild.ageGroup);
      systemContext += `${learnerName} is ${ageGroupLabel.toLowerCase()}. `;
      
      if (selectedChild.subjects && selectedChild.subjects.length > 0) {
        systemContext += `Their focus subjects are: ${selectedChild.subjects.join(', ')}. `;
      }
      
      // Only include challenges that the student actually has
      if (selectedChild.challenges && selectedChild.challenges.length > 0) {
        systemContext += `Important learning considerations: ${selectedChild.challenges.join(', ')}. `;
        
        // Provide specific guidance only for challenges the student actually has
        const challenges = selectedChild.challenges.map(c => c.toLowerCase());
        
        if (challenges.some(c => c.includes('dyslexia'))) {
          systemContext += `Since ${learnerName} has dyslexia, when relevant to the task, use clear fonts, avoid dense text, provide visual aids, and break down complex instructions into smaller steps. However, if the current task is purely mathematical and doesn't involve reading comprehension, the dyslexia may not be relevant to address. `;
        }
        
        if (challenges.some(c => c.includes('adhd') || c.includes('focus'))) {
          systemContext += `Since ${learnerName} has ADHD/focus issues, when relevant, keep activities shorter, provide clear structure, use engaging themes, and include movement or hands-on elements when possible. `;
        }
        
        if (challenges.some(c => c.includes('processing'))) {
          systemContext += `Since ${learnerName} has processing delays, when relevant, provide extra time for responses, break down complex concepts into smaller parts, and use visual aids to support understanding. `;
        }
        
        if (challenges.some(c => c.includes('math anxiety'))) {
          systemContext += `Since ${learnerName} experiences math anxiety, when relevant, create a supportive, low-pressure environment, emphasize progress over perfection, and use encouraging language. Focus on building confidence through gradual success. `;
        }
        
        if (challenges.some(c => c.includes('general learning support'))) {
          systemContext += `Since ${learnerName} benefits from general learning support, when relevant, provide clear explanations, use multiple teaching approaches, and offer positive reinforcement to maintain engagement and motivation. `;
        }
      }
    }
    
    // Add document context if available - prioritize conversation-specific documents
    const availableDocuments = conversationDocuments.length > 0 ? conversationDocuments : documents;
    const pdfDocs = availableDocuments.filter(doc => {
      if ('fileType' in doc) {
        return doc.fileType === 'application/pdf';
      } else {
        return doc.file_type === 'application/pdf';
      }
    });
    
    if (pdfDocs.length > 0) {
      systemContext += `You have access to ${pdfDocs.length} document${pdfDocs.length > 1 ? 's' : ''} uploaded to this conversation:\n\n`;
      
      pdfDocs.forEach((doc, index) => {
        systemContext += `Document ${index + 1}: "${doc.file_name}"\n`;
        
        // Add document analysis if available
        if (doc.ai_analysis && typeof doc.ai_analysis === 'object' && 'accuracy' in doc.ai_analysis) {
          const analysis = doc.ai_analysis as any;
          systemContext += `- Analysis shows ${learnerName} got ${analysis.accuracy}% accuracy with problem areas in: ${analysis.problemAreas?.join(', ')}\n`;
        }
        
        // Add document content if available
        if (doc.extracted_content) {
          const contentPreview = doc.extracted_content.length > 300 
            ? doc.extracted_content.substring(0, 300) + '...' 
            : doc.extracted_content;
          systemContext += `- Content: ${contentPreview}\n`;
        }
        
        systemContext += '\n';
      });
    }
    
    // Add conversation-specific document context for non-PDF documents
    const nonPdfDocs = conversationDocuments.filter(doc => {
      if ('fileType' in doc) {
        return doc.fileType !== 'application/pdf';
      } else {
        return doc.file_type !== 'application/pdf';
      }
    });
    
    if (nonPdfDocs.length > 0) {
      systemContext += `Additional documents uploaded to this conversation:\n`;
      nonPdfDocs.forEach(doc => {
        systemContext += `- "${doc.file_name}" (${doc.file_type})\n`;
      });
      systemContext += '\n';
    }
    
    systemContext += `Generate helpful, engaging responses that incorporate any themes, time constraints, difficulty preferences, or other requirements the user mentions. Be natural and conversational while providing practical educational content. Only address learning differences when they are relevant to the current task.

IMPORTANT: When creating themed problems or activities, make them genuinely thematic rather than just adding theme words to basic problems. For example:
- GOOD: "Detective Justin is investigating a case. He found 12 clues and needs to organize them into 4 evidence categories. How many clues per category?"
- BAD: "Detective Justin buys 12 doughnuts for 4 friends. How many does each get?"

The theme should be integral to the problem's context and logic, not just decorative.

CRITICAL FOR ACTIVITIES/GAMES: When creating themed activities or games, the theme must be central to the gameplay mechanics, not just a superficial wrapper. 

STEP-BY-STEP PROCESS FOR CREATING IMMERSIVE GAMES WITH ANY THEME:
1. SETTING: Create a detailed, immersive world based on the student's chosen theme
2. ROLE: Give the student a specific, meaningful role within that theme's world
3. MECHANICS: Design game mechanics that naturally use the theme's tools, objects, or concepts
4. LEARNING: Integrate the relevant subject concepts naturally within those theme-specific mechanics
5. PROGRESSION: Build complexity within the theme's context

HOW TO MAKE ANY THEME IMMERSIVE FOR ANY SUBJECT (examples showing the process, not specific themes):

EXAMPLE 1 - DETECTIVE THEME:
EXCELLENT: "Welcome to Detective [Student]'s Investigation Office! You have a magnifying glass and case files. Each case file contains word problems with hidden clues. Use your magnifying glass to find keywords like 'less than' (subtraction), 'more than' (addition), 'each' (division), 'total' (addition), 'difference' (subtraction). Highlight these clues in red. Once you find all the clues, solve the case by doing the math."
BAD: "You're a detective. Solve: 24 - (6 × 3) = ?"

EXAMPLE 2 - PIZZERIA THEME:
EXCELLENT: "Welcome to [Student]'s Pizzeria! You're the head chef today. Customers will place orders, and you need to: 1) Read the order form (reading comprehension), 2) Calculate ingredient costs (addition), 3) Figure out how many pizzas to make (multiplication), 4) Calculate change from payments (subtraction), 5) Update your inventory (problem solving)."
BAD: "You're a pizza chef. Solve: (2 × 12) + 8 = ?, then 40 - ? = ?"

EXAMPLE 3 - SPACE THEME:
EXCELLENT: "Commander [Student], welcome to Mission Control! You're piloting a spaceship to Mars. Your mission: 1) Calculate fuel consumption (multiplication/division), 2) Navigate using coordinates (graphing), 3) Manage oxygen levels (subtraction), 4) Plan food rations (division)."
BAD: "You're an astronaut. Solve: 1000 - (50 × 15) = ?"

EXAMPLE 4 - DINOSAUR THEME:
EXCELLENT: "Welcome to Paleontologist [Student]'s Dinosaur Dig Site! You're excavating fossils and need to: 1) Measure bone lengths (measurement), 2) Categorize fossils by dinosaur type (classification), 3) Calculate excavation time (multiplication), 4) Organize findings in the museum (problem solving)."
BAD: "You're a paleontologist. Solve: (12 + 15 + 18) ÷ 3 = ?"

GENERAL PRINCIPLES FOR ANY THEME AND ANY SUBJECT:
- The student should have a specific role within the theme's world
- The theme should provide tools, objects, or concepts that naturally involve the subject being studied
- Subject learning should happen through the theme's activities, not separate from them
- The activity should feel like playing within the theme, not doing subject work with theme words added
- Adapt the activity to focus on the specific subject(s) the student needs help with (math, reading, science, etc.)

The activity should immerse the student in the theme's world and make the learning content feel natural within that context. Avoid any activity that just adds theme words to basic subject problems.`;
    
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

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to chat
    const userMessageObj = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user' as const,
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessageObj]);
    setHasUnsavedChanges(true);

    try {
      // Generate AI response
      const aiResponse = await generateContextAwareResponse(userMessage);
      
      // Add AI response to chat
      const aiMessageObj = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai' as const,
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessageObj]);
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Add error message
      const errorMessageObj = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai' as const,
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate AI context from documents
  const generateDocumentContext = (): string => {
    const allDocuments = [...conversationDocuments, ...documents];
    
    if (allDocuments.length === 0) return '';
    
    const documentContexts = allDocuments.map(doc => {
      const content = doc.extracted_content || '';
      const analysis = doc.ai_analysis ? JSON.stringify(doc.ai_analysis) : '';
      return `Document: ${doc.file_name}\nContent: ${content}\nAnalysis: ${analysis}`;
    }).join('\n\n');
    
    return `\n\nRelevant Documents:\n${documentContexts}`;
  };

  // Check if a message contains downloadable content based on AI markers
  const isDownloadableContent = (content: string, messageIndex?: number): boolean => {
    // First, check if this is the initial greeting message (should never be downloadable)
    if (messageIndex === 0 || content.includes('Let\'s start learning together') || content.includes('I\'m here to help')) {
      return false;
    }
    
    // Check if the AI has marked this content as downloadable using the special markers
    const hasDownloadableMarkers = content.includes('DOWNLOADABLE_CONTENT_START') && content.includes('DOWNLOADABLE_CONTENT_END');
    
    if (hasDownloadableMarkers) {
      console.log('Download detected: AI marked content as downloadable');
      return true;
    }
    
    // If no markers are found, the content is not downloadable
    return false;
  };

  // Generate a title for the downloadable content
  const generateDownloadTitle = (content: string, learnerName: string): string => {
    const detectedType = fileGenerationService.detectFileType(content);
    const detectedMetadata = fileGenerationService.extractMetadata(content);
    
    // Start with a simple title and capitalize properly
    let title = `${detectedType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} for ${learnerName}`;
    
    // Only add subject if it's explicitly mentioned in the content
    if (detectedMetadata.subject && content.toLowerCase().includes(detectedMetadata.subject.toLowerCase())) {
      const capitalizedSubject = detectedMetadata.subject.charAt(0).toUpperCase() + detectedMetadata.subject.slice(1);
      title = `${capitalizedSubject} ${title}`;
    }
    
    // Only add theme if it's explicitly mentioned in the content and not just a random word
    if (detectedMetadata.theme && content.toLowerCase().includes(detectedMetadata.theme.toLowerCase())) {
      // Check if the theme is actually part of the content structure, not just a random word
      const themePattern = new RegExp(`\\b${detectedMetadata.theme}\\b`, 'i');
      if (themePattern.test(content)) {
        const capitalizedTheme = detectedMetadata.theme.charAt(0).toUpperCase() + detectedMetadata.theme.slice(1);
        title = `${capitalizedTheme} ${title}`;
      }
    }
    
    return title;
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                {isLoadedConversation ? `Conversation: ${loadedConversation?.title}` : `Learning with ${learnerName}`}
              </h1>
              {/* Hide categories display to avoid cluttered UI - data still passed to AI for context */}
              {/* {!isLoadedConversation && (
                <p className="text-sm text-gray-600">
                  {selectedCategories?.subject} • {selectedCategories?.ageGroup} • {selectedCategories?.challenge}
                </p>
              )} */}
              {conversationDocuments.length > 0 && (
                <button 
                  onClick={() => setShowDocumentList(true)}
                  className="text-xs text-blue-600 flex items-center gap-1 mt-1 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  <FileText size={12} />
                  <span className="hidden sm:inline">
                    {conversationDocuments.length} document{conversationDocuments.length !== 1 ? 's' : ''} in this conversation (click to view)
                  </span>
                  <span className="sm:hidden">
                    {conversationDocuments.length} doc{conversationDocuments.length !== 1 ? 's' : ''}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden flex flex-col">
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8 sm:mt-12">
                <p className="text-base sm:text-lg mb-2">Let's start learning together! 🌟</p>
                <p className="text-sm sm:text-base">I'm here to help {learnerName} with personalized lessons and activities.</p>
                {(documents.length > 0 || conversationDocuments.length > 0) && (
                  <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      📁 I can see you have {conversationDocuments.length > 0 ? conversationDocuments.length : documents.length} document{(conversationDocuments.length > 0 ? conversationDocuments.length : documents.length) !== 1 ? 's' : ''} {conversationDocuments.length > 0 ? 'in this conversation' : 'uploaded'}
                    </p>
                    <p className="text-xs text-blue-600">
                      Ask me to analyze them or create activities based on the content!
                    </p>
                  </div>
                )}
                <div className="mt-4 text-xs sm:text-sm text-gray-400">
                  <p>Try saying something like:</p>
                  <p className="text-xs">"Check out the failed test I uploaded" or "Look at the test and see what he got wrong"</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <DownloadableContent
                      content={message.content
                        .replace('DOWNLOADABLE_CONTENT_START', '')
                        .replace('DOWNLOADABLE_CONTENT_END', '')
                        .trim()}
                    />
                    
                    {/* Download button for AI messages with downloadable content */}
                    {message.type === 'ai' && (() => {
                      const messageIndex = messages.findIndex(m => m.id === message.id);
                      const isDownloadable = isDownloadableContent(message.content, messageIndex);
                      if (isDownloadable) {
                        console.log('Showing download options for message:', message.content.substring(0, 100) + '...');
                      }
                      return isDownloadable;
                    })() && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <DownloadOptions
                          content={message.content
                            .replace('DOWNLOADABLE_CONTENT_START', '')
                            .replace('DOWNLOADABLE_CONTENT_END', '')
                            .trim()}
                          title={generateDownloadTitle(message.content
                            .replace('DOWNLOADABLE_CONTENT_START', '')
                            .replace('DOWNLOADABLE_CONTENT_END', '')
                            .trim(), learnerName)}
                          subject={selectedCategories?.subject}
                          grade={selectedCategories?.ageGroup}
                          className="w-full"
                        />
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 sm:p-4 max-w-[85%] sm:max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-gray-600 text-sm sm:text-base">Processing documents and analyzing content...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-3 sm:p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setShowDocumentUpload(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 flex-shrink-0"
                title="Upload document to this conversation"
              >
                <Upload size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline text-sm">Upload</span>
              </button>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors flex-shrink-0"
              >
                <Send size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Dialog */}
      {showDocumentUpload && (
        <ConversationDocumentUpload 
          conversationId={currentConversationId}
          selectedChild={selectedChild}
          onDocumentUploaded={handleDocumentUpload}
          onClose={() => setShowDocumentUpload(false)}
        />
      )}

      {/* Document List Modal */}
      {showDocumentList && (
        <DocumentListModal
          documents={conversationDocuments}
          onClose={() => setShowDocumentList(false)}
        />
      )}
    </div>
  );
};

export default ChatInterface;
