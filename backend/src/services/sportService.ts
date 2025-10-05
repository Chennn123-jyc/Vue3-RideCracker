import { dbPool } from '../config/database.js';
import { SportSession, GPSPoint, StartSessionRequest, EndSessionRequest } from '../types/index.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class SportService {
  // 开始运动 - 对应 sportStore 和 ControlButtons.vue
  async startSession(userId: number, data: StartSessionRequest): Promise<{ sessionId: number }> {
    const { sport_type, start_time } = data;
    
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO sport_sessions (user_id, sport_type, start_time) 
       VALUES (?, ?, ?)`,
      [userId, sport_type, start_time]
    );
    
    return { sessionId: result.insertId };
  }

  // 结束运动并记录轨迹 - 对应 useGPS.ts
  async endSession(sessionId: number, endData: EndSessionRequest, tracks: GPSPoint[]): Promise<void> {
    const { end_time, calories, distance, steps } = endData;
    
    await dbPool.execute(
      `UPDATE sport_sessions SET end_time = ?, calories = ?, distance = ?, steps = ? 
       WHERE id = ?`,
      [end_time, calories, distance, steps, sessionId]
    );
    
    // 记录GPS轨迹
    if (tracks && tracks.length > 0) {
      const trackValues = tracks.map(track => 
        [sessionId, track.lat, track.lng, track.timestamp]
      );
      
      await dbPool.execute(
        `INSERT INTO sport_tracks (session_id, latitude, longitude, timestamp) 
         VALUES ?`,
        [trackValues]
      );
    }
    
    // 更新运动统计
    await this.updateSportStats(sessionId);
  }

  // 获取运动历史 - 对应 HistoryCards.vue
  async getSportHistory(
    userId: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<SportSession[]> {
    const offset = (page - 1) * limit;
    
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM sport_sessions 
       WHERE user_id = ? 
       ORDER BY start_time DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    
    return rows as SportSession[];
  }

  private async updateSportStats(sessionId: number): Promise<void> {
    // 实现运动统计更新逻辑
  }
}

export const sportService = new SportService();