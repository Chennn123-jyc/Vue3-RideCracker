import { dbPool } from '../config/database';
import { Music, PaginatedResponse, UploadMusicRequest, Playlist } from '../types/index';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// 定义 Multer 文件类型
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// 新增接口类型
interface LikeResult {
  liked: boolean;
  likeCount: number;
}

export class MusicService {
  // 获取用户喜欢的音乐（公共音乐）
  async getUserLikedMusic(
    userId: number,
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedResponse<Music>> {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT m.* FROM music m
      JOIN user_liked_music ulm ON m.id = ulm.music_id
      WHERE ulm.user_id = ?
      ORDER BY ulm.liked_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM user_liked_music 
      WHERE user_id = ? AND music_id IS NOT NULL
    `;
    
    // 确保参数数量与查询占位符匹配
    const [rows] = await dbPool.execute<RowDataPacket[]>(query, [userId, limit, offset]);
    const [countRows] = await dbPool.execute<RowDataPacket[]>(countQuery, [userId]);
    
    return {
      items: rows as Music[],
      total: countRows[0].total,
      page,
      limit,
      totalPages: Math.ceil(countRows[0].total / limit)
    };
  }

  // 获取用户播放历史
  async getUserPlayHistory(
    userId: number,
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedResponse<Music>> {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT m.*, uph.play_count, uph.last_played_at 
      FROM music m
      JOIN user_play_history uph ON m.id = uph.music_id
      WHERE uph.user_id = ?
      ORDER BY uph.last_played_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total FROM user_play_history WHERE user_id = ?
    `;
    
    const [rows] = await dbPool.execute<RowDataPacket[]>(query, [userId, limit, offset]);
    const [countRows] = await dbPool.execute<RowDataPacket[]>(countQuery, [userId]);
    
    return {
      items: rows as Music[],
      total: countRows[0].total,
      page,
      limit,
      totalPages: Math.ceil(countRows[0].total / limit)
    };
  }

  // 切换喜欢/取消喜欢公共音乐
  async toggleLikeMusic(userId: number, musicId: number): Promise<LikeResult> {
    // 首先检查是否已经喜欢（明确指定music_id不为空，符合表约束）
    const [existing] = await dbPool.execute<RowDataPacket[]>(
      `SELECT id FROM user_liked_music WHERE user_id = ? AND music_id = ? AND user_music_id IS NULL`,
      [userId, musicId]
    );

    if (existing.length > 0) {
      // 取消喜欢
      await dbPool.execute(
        `DELETE FROM user_liked_music WHERE user_id = ? AND music_id = ? AND user_music_id IS NULL`,
        [userId, musicId]
      );
      
      // 更新音乐的喜欢计数
      await dbPool.execute(
        `UPDATE music SET like_count = GREATEST(0, like_count - 1) WHERE id = ?`,
        [musicId]
      );
      
      const [countRows] = await dbPool.execute<RowDataPacket[]>(
        `SELECT like_count FROM music WHERE id = ?`,
        [musicId]
      );
      
      return {
        liked: false,
        likeCount: countRows[0]?.like_count || 0
      };
    } else {
      // 添加喜欢（遵循表约束：只能有一个关联字段非空）
      await dbPool.execute(
        `INSERT INTO user_liked_music (user_id, music_id, user_music_id) VALUES (?, ?, NULL)`,
        [userId, musicId]
      );
      
      // 更新音乐的喜欢计数
      await dbPool.execute(
        `UPDATE music SET like_count = like_count + 1 WHERE id = ?`,
        [musicId]
      );
      
      const [countRows] = await dbPool.execute<RowDataPacket[]>(
        `SELECT like_count FROM music WHERE id = ?`,
        [musicId]
      );
      
      return {
        liked: true,
        likeCount: countRows[0]?.like_count || 0
      };
    }
  }

  // 记录播放历史
  async recordPlayHistory(userId: number, musicId: number, playTime: number = 0): Promise<void> {
    // 检查是否已有记录
    const [existing] = await dbPool.execute<RowDataPacket[]>(
      `SELECT id, play_count FROM user_play_history WHERE user_id = ? AND music_id = ?`,
      [userId, musicId]
    );

    if (existing.length > 0) {
      // 更新现有记录
      await dbPool.execute(
        `UPDATE user_play_history 
         SET play_count = play_count + 1, 
             last_played_at = CURRENT_TIMESTAMP,
             total_play_time = total_play_time + ?
         WHERE user_id = ? AND music_id = ?`,
        [playTime, userId, musicId]
      );
    } else {
      // 插入新记录
      await dbPool.execute(
        `INSERT INTO user_play_history (user_id, music_id, play_count, total_play_time) 
         VALUES (?, ?, 1, ?)`,
        [userId, musicId, playTime]
      );
    }

    // 同时更新音乐的播放计数
    await dbPool.execute(
      `UPDATE music SET play_count = play_count + 1 WHERE id = ?`,
      [musicId]
    );
  }

  // 获取音乐列表 - 对应 musicStore
  async getMusicList(
    page: number = 1, 
    limit: number = 20, 
    keyword: string = ''
  ): Promise<PaginatedResponse<Music>> {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM music WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as total FROM music WHERE 1=1`;
    const params: any[] = [];
    
    if (keyword) {
      query += ` AND (title LIKE ? OR artist LIKE ?)`;
      countQuery += ` AND (title LIKE ? OR artist LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await dbPool.execute<RowDataPacket[]>(query, params);
    // 确保计数查询参数正确（移除limit和offset）
    const [countRows] = await dbPool.execute<RowDataPacket[]>(countQuery, params.slice(0, -2));
    
    return {
      items: rows as Music[],
      total: countRows[0].total,
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      totalPages: Math.ceil(countRows[0].total / limit)
    };
  }

  // 上传音乐 - 对应 UploadMusic.vue
  async uploadMusic(
    file: MulterFile, 
    metadata: UploadMusicRequest, 
    userId: number
  ): Promise<{ id: number; filePath: string; duration: number }> {
    const { title, artist, album } = metadata;
    const filePath = `/uploads/music/${file.filename}`;
    
    // 这里可以集成音频元数据提取
    const duration = await this.extractAudioDuration(file.path);
    
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO music (title, artist, album, duration, file_path, uploader_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, artist, album, duration, filePath, userId]
    );
    
    return { id: result.insertId, filePath, duration };
  }

  // 播放音乐 - 对应 useAudioPlayer.ts
  async getMusicStream(musicId: number): Promise<{ filePath: string }> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT file_path FROM music WHERE id = ?`,
      [musicId]
    );
    
    if (rows.length === 0) {
      throw new Error('音乐文件不存在');
    }
    
    const filePath = rows[0].file_path;
    return { filePath };
  }

  // 播放列表相关方法
  async createPlaylist(name: string, userId: number, isPublic: boolean = false): Promise<{ id: number }> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO playlists (name, user_id, is_public) VALUES (?, ?, ?)`,
      [name, userId, isPublic]
    );
    
    return { id: result.insertId };
  }

  async addToPlaylist(playlistId: number, musicId: number): Promise<void> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO playlist_music (playlist_id, music_id) VALUES (?, ?)`,
      [playlistId, musicId]
    );
  }

  async getUserPlaylists(userId: number): Promise<Playlist[]> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    
    return rows as Playlist[];
  }

  async getPlaylistWithMusic(playlistId: number, userId: number): Promise<{playlist: Playlist; music: Music[]}> {
    const [playlistRows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM playlists WHERE id = ? AND (user_id = ? OR is_public = true)`,
      [playlistId, userId]
    );
    
    if (playlistRows.length === 0) {
      throw new Error('播放列表不存在或无权访问');
    }
    
    const [musicRows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT m.* FROM music m
       JOIN playlist_music pm ON m.id = pm.music_id
       WHERE pm.playlist_id = ?
       ORDER BY pm.sort_order, pm.added_at`,
      [playlistId]
    );
    
    return {
      playlist: playlistRows[0] as Playlist,
      music: musicRows as Music[]
    };
  }

  private async extractAudioDuration(filePath: string): Promise<number> {
    // 实现音频时长提取逻辑
    // 可以使用 fluent-ffmpeg 或其他音频处理库
    return 180; // 默认3分钟
  }
}

export const musicService = new MusicService();