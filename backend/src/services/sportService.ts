import { dbPool } from '../config/database';
import { SportSession, GPSPoint, StartSessionRequest, EndSessionRequest,PaginatedResponse } from '../types/index';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class SportService {
  // 开始运动
  async startSession(userId: number, data: StartSessionRequest): Promise<{ sessionId: number }> {
    const { sport_type, start_time } = data;
    
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO sport_sessions (user_id, sport_type, start_time) 
       VALUES (?, ?, ?)`,
      [userId, sport_type, start_time]
    );
    
    return { sessionId: result.insertId };
  }

  // 结束运动
  async endSession(sessionId: number, endData: EndSessionRequest, tracks: GPSPoint[]): Promise<void> {
    const { end_time, calories, distance, steps } = endData;
    
    // 计算持续时间（秒）
    const startResult = await dbPool.execute<RowDataPacket[]>(
      'SELECT start_time FROM sport_sessions WHERE id = ?',
      [sessionId]
    );
    const [sessions] = startResult;
    const startTime = new Date(sessions[0].start_time);
    const duration = Math.floor((new Date(end_time).getTime() - startTime.getTime()) / 1000);
    
    await dbPool.execute(
      `UPDATE sport_sessions SET 
        end_time = ?, 
        duration = ?,
        calories = ?, 
        distance = ?, 
        steps = ? 
       WHERE id = ?`,
      [end_time, duration, calories, distance, steps, sessionId]
    );
    
    // 记录GPS轨迹
    if (tracks && tracks.length > 0) {
      await this.recordGPSTracks(sessionId, tracks);
    }
  }

  // 记录GPS轨迹
  async recordGPSTracks(sessionId: number, tracks: GPSPoint[]): Promise<void> {
    const trackValues = tracks.map(track => [
      sessionId, 
      track.lat, 
      track.lng, 
      new Date(track.timestamp)
    ]);
    
    if (trackValues.length > 0) {
      await dbPool.execute(
        `INSERT INTO sport_tracks (session_id, latitude, longitude, timestamp) 
         VALUES ?`,
        [trackValues]
      );
    }
  }

  // 获取运动历史
async getSportHistory(userId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponse<SportSession>> {
  const offset = (page - 1) * limit;
  
  console.log(`🔍 SQL参数 - userId: ${userId}, limit: ${limit}, offset: ${offset}`);
  
  try {
    // 查询数据 - 确保参数类型正确
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM sport_sessions 
       WHERE user_id = ? 
       ORDER BY start_time DESC 
       LIMIT ? OFFSET ?`,
      [userId, Number(limit), Number(offset)]  // 关键修复：确保转换为数字
    );

    // 查询总数
    const [countRows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM sport_sessions WHERE user_id = ?`,
      [userId]
    );
    
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);
    
    console.log(`✅ 查询成功，找到 ${rows.length} 条记录，总共 ${total} 条`);
    
    return {
      items: rows as SportSession[],
      total,
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      totalPages
    };
  } catch (error) {
    console.error('❌ SQL执行失败:', error);
    throw error;
  }
}
  

  // 获取运动详情（包含轨迹）
  async getSessionDetail(sessionId: number, userId: number): Promise<{session: SportSession; tracks: GPSPoint[]}> {
    const [sessionRows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM sport_sessions WHERE id = ? AND user_id = ?`,  // 添加 user_id 条件
      [sessionId, userId]
    );
    
    if (sessionRows.length === 0) {
      throw new Error('运动记录不存在或无权访问');
    }
    
    const [trackRows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT latitude, longitude, timestamp FROM sport_tracks 
       WHERE session_id = ? ORDER BY timestamp ASC`,
      [sessionId]
    );
    
    const tracks: GPSPoint[] = trackRows.map(row => ({
      lat: row.latitude,
      lng: row.longitude,
      timestamp: row.timestamp
    }));
    
    return {
      session: sessionRows[0] as SportSession,
      tracks
    };
  }
}

export const sportService = new SportService();