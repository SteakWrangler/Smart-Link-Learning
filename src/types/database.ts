
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

export interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  age_group: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  child_id?: string;
  student_profile_id?: string;
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
