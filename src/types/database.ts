export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  name: string;
  age_group: string;
  subjects: string[];
  challenges: string[];
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
  student_id: string;
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
  student_id: string;
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
