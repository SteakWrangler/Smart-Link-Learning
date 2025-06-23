
// Unified type definitions for the application
// All student-related functionality now uses the Child interface

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
  messages: Message[];
  created_at: string;
  is_favorite: boolean;
  is_saved: boolean;
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  created_at: string;
}

// Extended child interface with computed properties for UI
export interface ChildWithDetails extends Child {
  subject_names: string[];
  challenge_names: string[];
}

// For backward compatibility during transition
export type StudentProfile = Child;
