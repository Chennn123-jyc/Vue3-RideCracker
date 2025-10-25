// routes/music.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadMusicMiddleware } from '../middleware/upload';
import { 
  uploadUserMusicHandler,
  getUserMusicLibrary,
  getLikedUserMusic,
  toggleLikeUserMusic,
  deleteUserMusic,
  getMusicStream 
} from '../controllers/userMusicController';

const router = express.Router();

// 用户个人音乐网盘接口
router.post('/my/upload', authenticateToken, uploadMusicMiddleware.single('music_file'), uploadUserMusicHandler);
router.get('/my/library', authenticateToken, getUserMusicLibrary);
router.get('/my/liked', authenticateToken, getLikedUserMusic);
router.post('/my/like', authenticateToken, toggleLikeUserMusic);
router.delete('/my/:userMusicId', authenticateToken, deleteUserMusic);

// 音频流接口 - 确保这个路由正确配置
router.get('/stream/user/:userMusicId', authenticateToken, getMusicStream);

export default router;