
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
  createdAt: string;
  parent_id: string;
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
