import { dbPool } from '../config/database';
import { SportSession, GPSPoint, StartSessionRequest, EndSessionRequest, PaginatedResponse, SportType } from '../types/index';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class SportService {
  // 开始运动（修复时间类型校验错误）
  async startSession(userId: number, data: StartSessionRequest): Promise<{ sessionId: number }> {
    const { sport_type, start_time } = data;

    // 🔴 1. 统一转换 start_time 为 Date 类型（处理 string | Date 兼容问题）
    const convertedStartTime = typeof start_time === 'string' ? new Date(start_time) : start_time;

    // 🔴 2. 二次校验（参数有效性）
    if (isNaN(userId) || isInvalidDate(convertedStartTime)) {
      throw new Error('用户ID或开始时间无效');
    }
    // 补充运动类型校验（如果需要）
    if (!Object.values(SportType).includes(sport_type)) {
      throw new Error(`运动类型无效，合法类型：${Object.values(SportType).join(', ')}`);
    }

    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO sport_sessions (user_id, sport_type, start_time) 
       VALUES (?, ?, ?)`,
      [userId, sport_type, convertedStartTime] // 使用转换后的Date类型
    );

    if (result.affectedRows === 0) {
      throw new Error('创建运动会话失败');
    }

    return { sessionId: result.insertId };
  }

  // 结束运动（保持不变，已有时间转换逻辑）
  async endSession(sessionId: number, endData: EndSessionRequest, tracks: GPSPoint[]): Promise<void> {
    const { userId, end_time, calories, distance, steps } = endData;
    const connection = await dbPool.getConnection();

    try {
      await connection.beginTransaction();

      // 权限校验
      const [sessionRows] = await connection.execute<RowDataPacket[]>(
        'SELECT start_time FROM sport_sessions WHERE id = ? AND user_id = ?',
        [sessionId, userId]
      );
      if (sessionRows.length === 0) {
        throw new Error('运动会话不存在或无权操作（非当前用户会话）');
      }

      // 🔴 时间转换（处理 string | Date 类型）
      const startTime = new Date(sessionRows[0].start_time);
      const endTime = typeof end_time === 'string' ? new Date(end_time) : end_time;
      
      if (isInvalidDate(endTime) || endTime < startTime) {
        throw new Error('结束时间无效（需晚于开始时间）');
      }
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // 更新会话
      const [updateResult] = await connection.execute<ResultSetHeader>(
        `UPDATE sport_sessions SET 
          end_time = ?, 
          duration = ?,
          calories = ?, 
          distance = ?, 
          steps = ? 
         WHERE id = ? AND user_id = ?`,
        [endTime, duration, calories, distance, steps, sessionId, userId]
      );
      if (updateResult.affectedRows === 0) {
        throw new Error('更新运动会话失败（会话可能已被删除）');
      }

      // 插入轨迹
      if (tracks && tracks.length > 0) {
        const trackValues = tracks.map(track => [
          sessionId,
          track.lat,
          track.lng,
          // 🔴 轨迹时间转换（处理 string | Date 类型）
          typeof track.timestamp === 'string' ? new Date(track.timestamp) : track.timestamp
        ]);
        await connection.execute(
          `INSERT INTO sport_tracks (session_id, latitude, longitude, timestamp) 
           VALUES ?`,
          [trackValues]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 记录GPS轨迹（保持不变，已有时间转换逻辑）
  async recordGPSTracks(sessionId: number, tracks: GPSPoint[], userId: number): Promise<void> {
    // 权限校验
    const [sessionRows] = await dbPool.execute<RowDataPacket[]>(
      'SELECT id FROM sport_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );
    if (sessionRows.length === 0) {
      throw new Error('运动会话不存在或无权操作（非当前用户会话）');
    }

    // 轨迹校验
    if (tracks.length === 0) {
      throw new Error('轨迹数据不能为空');
    }
    const trackValues = tracks.map(track => {
      // 🔴 轨迹时间转换（处理 string | Date 类型）
      const trackTime = typeof track.timestamp === 'string' ? new Date(track.timestamp) : track.timestamp;
      if (isInvalidDate(trackTime)) {
        throw new Error(`轨迹时间格式无效：${track.timestamp}`);
      }
      return [sessionId, track.lat, track.lng, trackTime];
    });

    await dbPool.execute(
      `INSERT INTO sport_tracks (session_id, latitude, longitude, timestamp) 
       VALUES ?`,
      [trackValues]
    );
  }

  // 获取运动历史（保持不变）
  async getSportHistory(userId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponse<SportSession>> {
    const offset = (page - 1) * limit;

    if (isNaN(userId) || isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      throw new Error('用户ID、页码、条数必须为正整数');
    }

    console.log(`🔍 SQL参数 - userId: ${userId}, limit: ${limit}, offset: ${offset}`);

    try {
      const [rows] = await dbPool.execute<RowDataPacket[]>(
        `SELECT * FROM sport_sessions 
         WHERE user_id = ? 
         ORDER BY start_time DESC 
         LIMIT ? OFFSET ?`,
        [userId, Number(limit), Number(offset)]
      );

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
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('❌ SQL执行失败:', error);
      throw new Error('查询运动历史失败（服务器错误）');
    }
  }

  // 获取运动详情（保持不变）
  async getSessionDetail(sessionId: number, userId: number): Promise<{ session: SportSession; tracks: GPSPoint[] }> {
    const [sessionRows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM sport_sessions WHERE id = ? AND user_id = ?`,
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
  };

  // 在 SportService 类中添加删除方法
async deleteSession(sessionId: number, userId: number): Promise<void> {
  const connection = await dbPool.getConnection();
  
  try {
    await connection.beginTransaction();

    console.log(`🔍 检查运动记录权限 - 会话ID: ${sessionId}, 用户ID: ${userId}`);

    // 1. 先检查记录是否存在且属于当前用户
    const [sessionRows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM sport_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (sessionRows.length === 0) {
      throw new Error('运动记录不存在或无权删除（非当前用户记录）');
    }

    console.log(`✅ 权限验证通过，开始删除运动记录 ${sessionId}`);

    // 2. 先删除关联的轨迹数据（外键约束）
    await connection.execute(
      'DELETE FROM sport_tracks WHERE session_id = ?',
      [sessionId]
    );

    // 3. 删除运动记录
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM sport_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error('删除运动记录失败');
    }

    await connection.commit();
    console.log(`✅ 运动记录 ${sessionId} 删除成功`);

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
}

// 工具函数：校验时间是否无效（参数必须为Date类型）
const isInvalidDate = (date: Date): boolean => {
  return isNaN(date.getTime());
};

export const sportService = new SportService();


