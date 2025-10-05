import { dbPool } from '../config/database.js';
import { Music, PaginatedResponse, UploadMusicRequest } from '../types/index.js';
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

export class MusicService {
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
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await dbPool.execute<RowDataPacket[]>(query, params);
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

  private async extractAudioDuration(filePath: string): Promise<number> {
    // 实现音频时长提取逻辑
    // 可以使用 fluent-ffmpeg 或其他音频处理库
    return 180; // 默认3分钟
  }
}

export const musicService = new MusicService();