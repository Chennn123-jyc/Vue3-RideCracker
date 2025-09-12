// src/types.ts
export interface User {
    id: number;
    username: string;
    avatar?: string;
  }
  
  export interface Comment {
    id: number;
    user: User;
    content: string;
    timestamp: string;
  }
  
  export interface Share {
    id: number;
    user: User;
    content: string;
    image?: string;
    location?: string;
    timestamp: string;
    likes: number;
    liked: boolean;
    comments: Comment[];
    category: string;
    isPublic?: boolean;
  }