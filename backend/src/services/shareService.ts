import { dbPool } from '../config/database';
import { Share, PaginatedResponse, CreateShareRequest, Comment } from '../types/index';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class ShareService {
  // 获取分享列表
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
             (SELECT COUNT(*) FROM comments WHERE share_id = s.id) as comment_count,
             EXISTS(SELECT 1 FROM likes WHERE share_id = s.id AND user_id = ?) as is_liked
      FROM shares s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.is_public = true
    `;
    let countQuery = `SELECT COUNT(*) as total FROM shares WHERE is_public = true`;
    const params: any[] = [userId];
    
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
    const [countRows] = await dbPool.execute<RowDataPacket[]>(countQuery, params.slice(1, -2));
    
    // 手动映射字段以确保类型安全
    const shares: Share[] = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      content: row.content,
      images: row.images ? JSON.parse(row.images) : [],
      category: row.category,
      is_public: row.is_public,
      like_count: row.like_count,
      comment_count: row.comment_count,
      view_count: row.view_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      username: row.username,
      avatar: row.avatar,
      is_liked: !!row.is_liked
    }));
    
    return {
      items: shares,
      total: countRows[0].total,
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      totalPages: Math.ceil(countRows[0].total / limit)
    };
  }

  // 创建分享
  async createShare(shareData: CreateShareRequest, userId: number): Promise<{ id: number }> {
    const { content, images, category, is_public } = shareData;
    
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO shares (user_id, content, images, category, is_public) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, content, images ? JSON.stringify(images) : null, category, is_public]
    );
    
    return { id: result.insertId };
  }

  // 点赞/取消点赞
  async toggleLike(shareId: number, userId: number): Promise<{ liked: boolean }> {
    const [existing] = await dbPool.execute<RowDataPacket[]>(
      `SELECT id FROM likes WHERE share_id = ? AND user_id = ?`,
      [shareId, userId]
    );
    
    if (existing.length > 0) {
      await dbPool.execute(
        `DELETE FROM likes WHERE share_id = ? AND user_id = ?`,
        [shareId, userId]
      );
      return { liked: false };
    } else {
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
    
    // 手动映射字段以确保类型安全
    const comments: Comment[] = rows.map(row => ({
      id: row.id,
      share_id: row.share_id,
      user_id: row.user_id,
      content: row.content,
      parent_id: row.parent_id,
      created_at: row.created_at,
      username: row.username,
      avatar: row.avatar
    }));
    
    return comments;
  }

  // 获取分享详情
  async getShareDetail(shareId: number): Promise<Share> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT s.*, u.username, u.avatar,
             (SELECT COUNT(*) FROM likes WHERE share_id = s.id) as like_count,
             (SELECT COUNT(*) FROM comments WHERE share_id = s.id) as comment_count
       FROM shares s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [shareId]
    );
    
    if (rows.length === 0) {
      throw new Error('分享不存在');
    }
    
    const row = rows[0];
    
    // 手动映射字段以确保类型安全
    const share: Share = {
      id: row.id,
      user_id: row.user_id,
      content: row.content,
      images: row.images ? JSON.parse(row.images) : [],
      category: row.category,
      is_public: row.is_public,
      like_count: row.like_count,
      comment_count: row.comment_count,
      view_count: row.view_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      username: row.username,
      avatar: row.avatar
    };
    
    return share;
  }
}

export const shareService = new ShareService();