import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getShares, 
  createShare, 
  toggleLike, 
  addComment, 
  getComments,
  getShareDetail 
} from '../controllers/shareController';

const router = express.Router();

// 获取分享列表
router.get('/', authenticateToken, getShares);

// 创建分享
router.post('/', authenticateToken, createShare);

// 获取分享详情
router.get('/:shareId', authenticateToken, getShareDetail);

// 点赞/取消点赞
router.post('/:shareId/like', authenticateToken, toggleLike);

// 添加评论
router.post('/:shareId/comments', authenticateToken, addComment);

// 获取评论列表
router.get('/:shareId/comments', authenticateToken, getComments);

export default router;