export interface Child {
  id: string;
  name: string;
  subjects: string[];
  ageGroup: string;
  challenges: string[];
  createdAt: Date;
}

export interface SavedConversation {
  id: string;
  title: string;
  childId: string;
  childName: string;
  messages: Message[];
  documents: ConversationDocument[];
  createdAt: Date;
  isFavorite: boolean;
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface ConversationDocument {
  id: string;
  documentId: string;
  fileName: string;
  fileType: string;
  documentType: string;
  description?: string;
  subject?: string;
  extractedContent?: string;
  aiAnalysis?: any;
  createdAt: Date;
}
