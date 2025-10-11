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

// ------------------------------
// 用户相关类型
// ------------------------------
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string; // 可选：用户头像
  created_at: Date; // 数据库创建时间（后端自动生成）
  updated_at: Date; // 数据库更新时间（后端自动生成）
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string; // 前端需加密传输（如md5/sha256）
  avatar?: string; // 可选：注册时上传头像
}

export interface LoginRequest {
  email: string;
  password: string; // 同注册，需加密
}

// JWT 解析后的用户信息（ auth 中间件挂载到 req.user ）
export interface JWTPayload {
  id: number; // 用户ID（核心，用于数据隔离）
  email: string; // 用于校验用户唯一性
  username: string; // 用于前端显示
  exp?: number; // 可选：Token过期时间戳（JWT自带）
}

// ------------------------------
// 音乐相关类型
// ------------------------------
export interface Music {
  id: number;
  title: string; // 音乐标题
  artist: string; // 歌手/创作者
  album: string; // 专辑名
  duration: number; // 时长（秒）
  file_path: string; // 音乐文件路径（后端存储地址）
  cover_image?: string; // 可选：专辑封面
  uploader_id: number; // 关联上传者ID（数据隔离）
  created_at: Date; // 上传时间
}

export interface Playlist {
  id: number;
  name: string; // 歌单名称
  user_id: number; // 关联创建者ID（数据隔离）
  is_public: boolean; // 是否公开（true=所有人可见，false=仅自己可见）
  created_at: Date;
}

// 歌单详情（包含关联的音乐列表）
export interface PlaylistWithMusic extends Playlist {
  music?: Music[]; // 可选：歌单中的音乐（为空表示歌单无内容）
}

export interface UploadMusicRequest {
  title: string;
  artist: string;
  album: string;
  cover_image?: string; // 可选：封面图片（Base64或URL）
  // 注意：音乐文件本身不放在该类型中，需通过 multipart/form-data 单独上传
}

// ------------------------------
// 运动相关类型（核心修改区）
// ------------------------------
// 1. 新增：合法运动类型枚举（避免无效值）
export enum SportType {
  RUNNING = "running", // 跑步
  CYCLING = "cycling", // 骑行
  SWIMMING = "swimming", // 游泳
  WALKING = "walking", // 步行
  HIKING = "hiking" // 徒步（可按需扩展）
}

export interface SportSession {
  id: number;
  user_id: number;
  sport_type: SportType;
  start_time: Date;
  end_time?: Date;
  duration?: number;
  calories?: number;
  distance?: number;
  steps?: number;
  created_at: Date;
}

// 运动会话详情（包含GPS轨迹）
export interface SportSessionWithTracks extends SportSession {
  tracks?: GPSPoint[]; // 可选：GPS轨迹（为空表示未记录轨迹）
}

// GPS轨迹点（兼容前端字符串时间和后端Date）
export interface GPSPoint {
  lat: number; // 纬度（如：39.9042）
  lng: number; // 经度（如：116.4074）
  timestamp: string | Date; // 兼容：前端传字符串，后端存Date
}

// 开始运动请求（前端→后端）
export interface StartSessionRequest {
  sport_type: SportType; // 枚举类型，确保前端传合法值
  start_time: string | Date; // 兼容：前端传字符串时间（如"2024-05-20 14:30:00"）
}

// 结束运动请求（前端→后端）
// 🔴 核心修改：补充 userId 字段，用于服务层权限校验
export interface EndSessionRequest {
  userId: number; // 当前登录用户ID（从Token解析，前端无需传，后端补全）
  end_time: string | Date; // 结束时间
  calories: number; // 消耗卡路里（前端计算后传递）
  distance: number; // 运动距离（米，前端计算后传递）
  steps: number; // 步数（前端计算后传递，无效场景传0）
}

// 新增：记录GPS轨迹请求（统一参数类型）
export interface RecordGPSTrackRequest {
  sessionId: number; // 关联的运动会话ID
  tracks: GPSPoint[]; // GPS轨迹数组
  userId: number; // 关联用户ID（权限校验）
}

// ------------------------------
// 分享相关类型
// ------------------------------
export interface Share {
  id: number;
  user_id: number; // 关联分享者ID（数据隔离）
  content: string; // 分享内容（文字）
  images?: string[]; // 可选：分享图片（URL数组）
  category: string; // 分享分类（如"sport"=运动分享，"music"=音乐分享）
  is_public: boolean; // 是否公开
  like_count: number; // 点赞数（默认0）
  comment_count: number; // 评论数（默认0）
  view_count: number; // 浏览数（默认0）
  created_at: Date;
  updated_at: Date;
  // 以下字段为前端显示用（后端联表查询补充）
  username?: string; // 分享者昵称
  avatar?: string; // 分享者头像
  is_liked?: boolean; // 可选：当前登录用户是否已点赞（true=已赞，false=未赞）
}

// 分享详情（包含评论列表）
export interface ShareWithDetail extends Share {
  comments?: Comment[]; // 可选：分享下的评论
  is_liked?: boolean; // 同上，确保一致性
}

export interface CreateShareRequest {
  content: string;
  images?: string[]; // 可选：图片URL数组（前端上传后获取）
  category: string; // 需符合后端限定的分类（如"sport"/"music"）
  is_public: boolean;
}

export interface Comment {
  id: number;
  share_id: number; // 关联分享ID
  user_id: number; // 关联评论者ID
  content: string; // 评论内容
  parent_id?: number; // 可选：父评论ID（用于回复功能，null=一级评论）
  created_at: Date;
  // 前端显示用字段
  username?: string; // 评论者昵称
  avatar?: string; // 评论者头像
}