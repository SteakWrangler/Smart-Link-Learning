
// Main application types
export interface Child {
  id: string;
  parent_id: string;
  name: string;
  age_group: string;
  subjects: string[];
  challenges: string[];
  created_at: string;
  updated_at: string;
}

export interface SavedConversation {
  id: string;
  title: string;
  child_id: string;
  child_name: string;
  messages: ConversationMessage[];
  created_at: string;
  is_favorite: boolean;
  is_saved: boolean;
}

export interface ConversationMessage {
  id: string;
  content: string;
  type: 'user' | 'ai';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

export interface SelectedCategories {
  subject: string;
  ageGroup: string;
  challenge: string;
}

// Re-export database types for convenience
export type { 
  Profile, 
  Subject, 
  Challenge, 
  Conversation, 
  Message,
  DocumentData,
  ForumCategory,
  ForumTopic,
  ForumPost
} from './database';
