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
  createdAt: Date;
  isFavorite: boolean;
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}
