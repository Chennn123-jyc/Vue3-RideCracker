import { dbPool } from '../config/database.js';
import { Share, PaginatedResponse, CreateShareRequest, Comment } from '../types/index.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class ShareService {
  // 获取分享列表 - 对应 shareStore 和 ShareList.vue
  async getShares(
    page: number = 1, 
    limit: number = 10, 
    category: string | null = null, 
    userId: number | null = null
  ): Promise<PaginatedResponse<Share>> {
    const offset = (page - 1) * limit;
    let query = `
      SELECT s.*, u.username, u.avatar, 
             (SELECT COUNT(*) FROM likes WHERE share_id = s.id) as like_count,
             (SELECT COUNT(*) FROM comments WHERE share_id = s.id) as comment_count
      FROM shares s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.is_public = true
    `;
    let countQuery = `SELECT COUNT(*) as total FROM shares WHERE is_public = true`;
    const params: any[] = [];
    
    if (category) {
      query += ` AND s.category = ?`;
      countQuery += ` AND category = ?`;
      params.push(category);
    }
    
    if (userId) {
      query += ` AND s.user_id = ?`;
      countQuery += ` AND user_id = ?`;
      params.push(userId);
    }
    
    query += ` ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await dbPool.execute<RowDataPacket[]>(query, params);
    const [countRows] = await dbPool.execute<RowDataPacket[]>(countQuery, params.slice(0, -2));
    
    return {
      items: rows as Share[],
      total: countRows[0].total,
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      totalPages: Math.ceil(countRows[0].total / limit)
    };
  }

  // 创建分享 - 对应 ShareForm.vue 和 NoteForm.vue
  async createShare(shareData: CreateShareRequest, userId: number): Promise<{ id: number }> {
    const { content, images, category, is_public } = shareData;
    
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO shares (user_id, content, images, category, is_public) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, content, images ? JSON.stringify(images) : null, category, is_public]
    );
    
    return { id: result.insertId };
  }

  // 点赞功能 - 对应 ShareDetailModal.vue
  async toggleLike(shareId: number, userId: number): Promise<{ liked: boolean }> {
    // 检查是否已点赞
    const [existing] = await dbPool.execute<RowDataPacket[]>(
      `SELECT id FROM likes WHERE share_id = ? AND user_id = ?`,
      [shareId, userId]
    );
    
    if (existing.length > 0) {
      // 取消点赞
      await dbPool.execute(
        `DELETE FROM likes WHERE share_id = ? AND user_id = ?`,
        [shareId, userId]
      );
      return { liked: false };
    } else {
      // 添加点赞
      await dbPool.execute(
        `INSERT INTO likes (share_id, user_id) VALUES (?, ?)`,
        [shareId, userId]
      );
      return { liked: true };
    }
  }

  // 添加评论
  async addComment(shareId: number, userId: number, content: string, parentId?: number): Promise<{ id: number }> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO comments (share_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)`,
      [shareId, userId, content, parentId || null]
    );
    
    return { id: result.insertId };
  }

  // 获取评论
  async getComments(shareId: number): Promise<Comment[]> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT c.*, u.username, u.avatar 
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.share_id = ? 
       ORDER BY c.created_at ASC`,
      [shareId]
    );
    
    return rows as Comment[];
  }
}

export const shareService = new ShareService();