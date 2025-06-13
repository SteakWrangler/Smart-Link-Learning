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
  childId: string;
  childName: string;
  title: string;
  messages: {
    content: string;
    role: string;
    timestamp: Date;
  }[];
  createdAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}
