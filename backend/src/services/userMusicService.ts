
import { dbPool } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import path from 'path';
import fs from 'fs';

export interface UserMusic {
  id: number;
  user_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_format: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover_url: string;
  lyrics: string;
  upload_time: string;
  play_count: number;
  is_public: boolean;
  isLiked?: boolean;
}

export class UserMusicService {
  private uploadDir = './uploads/music';

  constructor() {
    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

// 上传音乐到用户个人网盘
async uploadMusic(
  file: Express.Multer.File,
  metadata: { title?: string; artist?: string; album?: string },
  userId: number
): Promise<{ id: number; filePath: string }> {
  console.log('开始处理用户音乐上传，用户ID:', userId);
  
  // 确保上传目录存在
  if (!fs.existsSync(this.uploadDir)) {
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }
  
  // 为用户创建个人文件夹
  const userFolder = path.join(this.uploadDir, userId.toString());
  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder, { recursive: true });
    console.log('创建用户文件夹:', userFolder);
  }

  // 使用优化的文件名生成
  const safeFileName = this.generateSafeFileName(file.originalname, metadata);
  const filePath = path.join(userFolder, safeFileName);

  console.log('移动文件从:', file.path, '到:', filePath);
  console.log('生成的文件名:', safeFileName);

  try {
    // 移动文件到用户目录
    if (fs.existsSync(file.path)) {
      fs.renameSync(file.path, filePath);
      console.log('文件移动成功');
    } else {
      throw new Error('临时文件不存在');
    }
  } catch (error) {
    console.error('文件移动失败:', error);
    // 如果移动失败，尝试复制
    fs.copyFileSync(file.path, filePath);
    // 删除临时文件
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }

  // 提取元数据
  const musicMetadata = this.extractMetadata(file.originalname, metadata);

  // 保存到数据库 - 存储相对路径（相对于上传目录）
  const relativePath = path.join(userId.toString(), safeFileName).replace(/\\/g, '/');
  
  console.log('保存到数据库的数据:', {
    userId,
    fileName: safeFileName,
    filePath: relativePath,
    metadata: musicMetadata
  });

  const [result] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO user_music 
     (user_id, file_name, file_path, file_size, file_format, title, artist, album, duration) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      safeFileName,
      relativePath, // 使用相对路径
      file.size,
      path.extname(file.originalname).toLowerCase().replace('.', ''),
      musicMetadata.title,
      musicMetadata.artist,
      musicMetadata.album || '未知专辑',
      musicMetadata.duration
    ]
  );

  console.log('数据库插入成功，ID:', result.insertId);

  return { id: result.insertId, filePath: relativePath };
}
// 获取用户个人音乐库
async getUserMusicLibrary(
  userId: number,
  keyword: string = '',
  page: number = 1,
  limit: number = 20,
  includeLikedStatus: boolean = true
): Promise<{ items: UserMusic[]; total: number }> {
  // 确保参数是数字类型
  const offset = Math.max(0, (page - 1) * limit);
  const limitNum = Math.max(1, limit);
  const userIdNum = Number(userId);
  
  console.log('🎵 查询参数（修复后）:', { 
    userId: userIdNum, 
    limit: limitNum, 
    offset: offset,
    types: {
      userId: typeof userIdNum,
      limit: typeof limitNum,
      offset: typeof offset
    }
  });
  
  let query = `
    SELECT um.* 
    FROM user_music um
    WHERE um.user_id = ?
  `;
  
  let countQuery = `SELECT COUNT(*) as total FROM user_music WHERE user_id = ?`;
  const params: any[] = [userIdNum];  // 使用转换后的数字
  const countParams: any[] = [userIdNum];

  if (keyword) {
    query += ` AND (um.title LIKE ? OR um.artist LIKE ? OR um.album LIKE ?)`;
    countQuery += ` AND (title LIKE ? OR artist LIKE ? OR album LIKE ?)`;
    const likeKeyword = `%${keyword}%`;
    params.push(likeKeyword, likeKeyword, likeKeyword);
    countParams.push(likeKeyword, likeKeyword, likeKeyword);
  }

  query += ` ORDER BY um.upload_time DESC LIMIT ${limitNum} OFFSET ${offset}`;
  

  console.log('🔍 修复后的查询:', query);
  console.log('🔍 修复后的参数:', params);
  console.log('🔍 参数类型:', params.map(p => typeof p));

  try {
    const [rows] = await dbPool.execute<RowDataPacket[]>(query, params);
    const [countRows] = await dbPool.execute<RowDataPacket[]>(countQuery, countParams);

    let items = rows as UserMusic[];

    // 如果需要包含喜欢状态
    if (includeLikedStatus) {
      items = await Promise.all(
        items.map(async (item) => {
          const [likeRows] = await dbPool.execute(
            `SELECT id FROM user_liked_music WHERE user_id = ? AND user_music_id = ?`,
            [userIdNum, item.id]  // 使用转换后的数字
          );
          return {
            ...item,
            isLiked: (likeRows as any[]).length > 0
          };
        })
      );
    }

    return {
      items,
      total: (countRows as any[])[0].total
    };
  } catch (error) {
    console.error('❌ 数据库查询失败:', error);
    console.error('❌ 查询:', query);
    console.error('❌ 参数:', params);
    throw error;
  }
}
// 获取用户喜欢的音乐（从个人网盘）

async getUserLikedMusic(
  userId: number,
  keyword: string = '',
  page: number = 1,
  limit: number = 20
): Promise<{ items: UserMusic[]; total: number }> {
  // 确保参数是数字类型
  const offset = Math.max(0, (page - 1) * limit);
  const limitNum = Math.max(1, limit);
  const userIdNum = Number(userId);
  
  console.log('🎵 喜欢音乐查询参数（修复后）:', { 
    userId: userIdNum, 
    limit: limitNum, 
    offset: offset 
  });
  
  // 修复查询：确保只查询个人音乐（user_music_id 不为空）
  let query = `
    SELECT um.* 
    FROM user_music um
    JOIN user_liked_music ulm ON um.id = ulm.user_music_id
    WHERE ulm.user_id = ? AND ulm.user_music_id IS NOT NULL
  `;
  
  let countQuery = `
    SELECT COUNT(*) as total 
    FROM user_liked_music ulm 
    JOIN user_music um ON ulm.user_music_id = um.id 
    WHERE ulm.user_id = ? AND ulm.user_music_id IS NOT NULL
  `;
  
  const params: any[] = [userIdNum];
  const countParams: any[] = [userIdNum];

  if (keyword) {
    query += ` AND (um.title LIKE ? OR um.artist LIKE ? OR um.album LIKE ?)`;
    countQuery += ` AND (um.title LIKE ? OR um.artist LIKE ? OR um.album LIKE ?)`;
    const likeKeyword = `%${keyword}%`;
    params.push(likeKeyword, likeKeyword, likeKeyword);
    countParams.push(likeKeyword, likeKeyword, likeKeyword);
  }

  // 🔥 关键修复：将 LIMIT 和 OFFSET 直接拼接到 SQL 中
  query += ` ORDER BY ulm.liked_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

  console.log('🔍 喜欢音乐修复后的查询:', query);
  console.log('🔍 喜欢音乐修复后的参数:', params);

  try {
    const [rows] = await dbPool.execute<RowDataPacket[]>(query, params);
    const [countRows] = await dbPool.execute<RowDataPacket[]>(countQuery, countParams);

    const items = (rows as UserMusic[]).map(item => ({
      ...item,
      isLiked: true  // 喜欢列表中的歌曲默认都是已喜欢状态
    }));

    return {
      items,
      total: (countRows as any[])[0].total
    };
  } catch (error) {
    console.error('❌ 获取喜欢音乐失败:', error);
    console.error('❌ 查询:', query);
    console.error('❌ 参数:', params);
    throw error;
  }
}

// 喜欢/取消喜欢个人音乐
async toggleLikeUserMusic(userId: number, userMusicId: number): Promise<{ liked: boolean }> {
  // 验证音乐是否存在且属于该用户
  const [musicRows] = await dbPool.execute(
    `SELECT id FROM user_music WHERE id = ? AND user_id = ?`,
    [userMusicId, userId]
  );

  if ((musicRows as any[]).length === 0) {
    throw new Error('音乐不存在或无权访问');
  }

  // 检查是否已经喜欢
  const [existing] = await dbPool.execute(
    `SELECT id FROM user_liked_music WHERE user_id = ? AND user_music_id = ?`,
    [userId, userMusicId]
  );

  if ((existing as any[]).length > 0) {
    // 取消喜欢
    await dbPool.execute(
      `DELETE FROM user_liked_music WHERE user_id = ? AND user_music_id = ?`,
      [userId, userMusicId]
    );
    return { liked: false };
  } else {
    // 添加喜欢 - 确保只设置 user_music_id，music_id 为 NULL
    await dbPool.execute(
      `INSERT INTO user_liked_music (user_id, user_music_id, music_id) VALUES (?, ?, NULL)`,
      [userId, userMusicId]
    );
    return { liked: true };
  }
}

  // 删除用户音乐
  async deleteUserMusic(userId: number, userMusicId: number): Promise<void> {
    // 获取文件路径
    const [musicRows] = await dbPool.execute(
      `SELECT file_path FROM user_music WHERE id = ? AND user_id = ?`,
      [userMusicId, userId]
    );

    if ((musicRows as any[]).length === 0) {
      throw new Error('音乐不存在或无权删除');
    }

    const filePath = (musicRows as any[])[0].file_path;

    // 从数据库中删除
    await dbPool.execute(
      `DELETE FROM user_music WHERE id = ? AND user_id = ?`,
      [userMusicId, userId]
    );

    // 删除物理文件
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      // 继续执行，因为数据库记录已经删除
    }
  }

  // 生成安全文件名
  private generateSafeFileName(originalName: string, metadata: { title?: string; artist?: string }): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    
    // 使用歌曲信息构建文件名
    let fileName = '';
    if (metadata.title && metadata.artist) {
      // 清理文件名中的非法字符
      const cleanTitle = metadata.title.replace(/[<>:"/\\|?*]/g, '_');
      const cleanArtist = metadata.artist.replace(/[<>:"/\\|?*]/g, '_');
      fileName = `${cleanArtist} - ${cleanTitle}`;
    } else {
      // 如果元数据不完整，使用原文件名（清理后）
      const nameWithoutExt = path.basename(originalName, extension);
      fileName = nameWithoutExt.replace(/[<>:"/\\|?*]/g, '_');
    }
    
    // 添加时间戳和随机字符串避免重名
    return `${fileName}_${timestamp}_${randomString}${extension}`;
  }

  // 提取元数据
  private extractMetadata(
    fileName: string, 
    userMetadata: { title?: string; artist?: string; album?: string }
  ): { title: string; artist: string; album: string; duration: number } {
    // 优先使用用户提供的元数据
    if (userMetadata.title && userMetadata.artist) {
      return {
        title: userMetadata.title,
        artist: userMetadata.artist,
        album: userMetadata.album || '未知专辑',
        duration: 180 // 实际应该从文件读取
      };
    }

    // 从文件名提取
    const nameWithoutExt = path.basename(fileName, path.extname(fileName));
    const parts = nameWithoutExt.split(' - ');
    let artist = '未知艺术家';
    let title = nameWithoutExt;
    
    if (parts.length >= 2) {
      artist = parts[0];
      title = parts.slice(1).join(' - ');
    }
    
    return {
      title: title.trim(),
      artist: artist.trim(),
      album: '未知专辑',
      duration: 180
    };
  }
  // 在类中添加一个通用的数据库查询方法
  private async executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const [rows] = await dbPool.execute<RowDataPacket[]>(query, params);
      return rows as T[];
    } catch (error) {
      console.error('❌ 数据库查询失败:', error);
      console.error('❌ 查询:', query);
      console.error('❌ 参数:', params);
      throw error;
    }
  }
}

export const userMusicService = new UserMusicService();