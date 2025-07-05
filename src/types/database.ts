export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  user_type: string;
  is_anonymous_in_forum?: boolean;
  email_notifications?: boolean;
  forum_notifications?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  setting_key: string;
  setting_value?: string;
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

export interface Conversation {
  id: string;
  child_id: string; // Now required, no longer nullable
  title: string;
  is_favorite: boolean;
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

export interface ConversationDocument {
  id: string;
  conversation_id: string;
  document_id: string;
  created_at: string | null;
}
