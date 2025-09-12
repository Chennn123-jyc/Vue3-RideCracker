export interface ShareItem {
    id: string;
    userId?: string;
    content: string;
    sportData?: SportData;
    musicData?: MusicData;
    images?: string[];
    createdAt: number;
    likes?: number;
    comments?: Comment[];
  }
  
  export interface SportData {
    type: string;
    distance: number;
    duration: string;
    avgSpeed: number;
    calories?: number;
  }
  
  export interface MusicData {
    title: string;
    artist: string;
    album: string;
    coverUrl: string;
    duration?: number;
  }
  
  export interface Comment {
    id: string;
    userId: string;
    username: string;
    content: string;
    createdAt: number;
  }