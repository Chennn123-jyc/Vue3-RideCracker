import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMusicMiddleware } from '../middleware/upload.js';
import { getMusicList, uploadMusicHandler } from '../controllers/musicController.js';

const router = express.Router();

// 获取音乐列表
router.get('/', authenticateToken, getMusicList);

// 上传音乐
router.post('/upload', authenticateToken, uploadMusicMiddleware.single('music_file'), uploadMusicHandler);

export default router;