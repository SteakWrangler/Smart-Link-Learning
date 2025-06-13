
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: string;
}

export interface Child {
  id: string;
  name: string;
  subjects: string[];
  ageGroup: string;
  challenges: string[];
  createdAt: Date;
  parent_id: string;
}

export interface SavedConversation {
  id: string;
  title: string;
  childId: string;
  childName: string;
  messages: Message[];
  createdAt: Date;
  isFavorite: boolean;
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: string;
  created_at: string;
  updated_at: string;
}
