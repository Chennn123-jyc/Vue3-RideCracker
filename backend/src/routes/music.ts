import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadMusicMiddleware } from '../middleware/upload';
import { getMusicList, uploadMusicHandler } from '../controllers/musicController';

const router = express.Router();

// 获取音乐列表
router.get('/', authenticateToken, getMusicList);

// 上传音乐
router.post('/upload', authenticateToken, uploadMusicMiddleware.single('music_file'), uploadMusicHandler);

export default router;