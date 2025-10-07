// 统一响应类型
export interface ApiResponse<T = any> {
    code: number;
    message: string;
    data: T;
    timestamp: number;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  // 用户相关类型
  export interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    created_at: Date;
    updated_at: Date;
  }
  
  export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    avatar?: string;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  // 音乐相关类型
  export interface Music {
    id: number;
    title: string;
    artist: string;
    album: string;
    duration: number;
    file_path: string;
    cover_image?: string;
    uploader_id: number;
    created_at: Date;
  }
  
  export interface Playlist {
    id: number;
    name: string;
    user_id: number;
    is_public: boolean;
    created_at: Date;
  }
  
  export interface UploadMusicRequest {
    title: string;
    artist: string;
    album: string;
    cover_image?: string;
  }
  
  // 运动相关类型
  export interface SportSession {
    id: number;
    user_id: number;
    sport_type: string;
    start_time: Date;
    end_time?: Date;
    duration?: number;
    calories?: number;
    distance?: number;
    steps?: number;
    created_at: Date;
  }
  
  export interface GPSPoint {
    lat: number;
    lng: number;
    timestamp: Date;
  }
  
  export interface StartSessionRequest {
    sport_type: string;
    start_time: Date;
  }
  
  export interface EndSessionRequest {
    end_time: Date;
    calories: number;
    distance: number;
    steps: number;
  }
  
  // 分享相关类型
  export interface Share {
    id: number;
    user_id: number;
    content: string;
    images?: string[];
    category: string;
    is_public: boolean;
    like_count: number;
    comment_count: number;
    view_count: number;
    created_at: Date;
    updated_at: Date;
    username?: string;
    avatar?: string;
    is_liked?: boolean;
  }
  
  export interface CreateShareRequest {
    content: string;
    images?: string[];
    category: string;
    is_public: boolean;
  }
  
  export interface Comment {
    id: number;
    share_id: number;
    user_id: number;
    content: string;
    parent_id?: number;
    created_at: Date;
    username?: string;
    avatar?: string;
  }
  
  // JWT Payload
  export interface JWTPayload {
    id: number;
    email: string;
    username: string;
  }

  export interface PlaylistWithMusic extends Playlist {
    music?: Music[];
  }
  
  export interface ShareWithDetail extends Share {
    comments?: Comment[];
    is_liked?: boolean;
  }
  
  export interface SportSessionWithTracks extends SportSession {
    tracks?: GPSPoint[];
  }