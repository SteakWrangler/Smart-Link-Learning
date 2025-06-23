
export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: 'parent' | 'student';
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  age_group: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface ChildSubject {
  id: string;
  child_id: string;
  subject_id: string;
}

export interface ChildChallenge {
  id: string;
  child_id: string;
  challenge_id: string;
}

export interface Conversation {
  id: string;
  child_id: string;
  parent_id?: string;
  title: string;
  is_favorite?: boolean;
  is_saved?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  type: 'user' | 'ai';
  content: string;
  created_at: string;
}

export interface ConversationTag {
  id: string;
  conversation_id: string;
  tag: string;
}

export interface DocumentData {
  id: string;
  user_id: string;
  child_id?: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_type: 'failed_test' | 'study_guide' | 'homework' | 'other';
  description?: string | null;
  subject?: string | null;
  extracted_content?: string | null;
  ai_analysis?: any;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
  processing_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sort_order?: number;
  created_at: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  description?: string;
  category_id: string;
  author_id: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  view_count?: number;
  post_count?: number;
  last_post_at?: string;
  last_post_author_name?: string;
  created_at: string;
}

export interface ForumPost {
  id: string;
  topic_id: string;
  parent_post_id?: string;
  author_id: string;
  content: string;
  is_edited?: boolean;
  created_at: string;
  updated_at: string;
}

// Helper types for database operations
export type UserType = 'parent' | 'student';
export type DocumentType = 'failed_test' | 'study_guide' | 'homework' | 'other';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type MessageType = 'user' | 'ai';

// Database insert types (for creating new records)
export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'> & {
  id: string; // Required for profiles as it comes from auth
};

export type ChildInsert = Omit<Child, 'id' | 'created_at' | 'updated_at'>;

export type ConversationInsert = Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;

export type MessageInsert = Omit<Message, 'id' | 'created_at'>;

export type DocumentInsert = Omit<DocumentData, 'id' | 'created_at' | 'updated_at'>;
