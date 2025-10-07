import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  startSportSession, 
  endSportSession, 
  getSportHistory, 
  recordGPSTrack 
} from '../controllers/sportController';

const router = express.Router();

// 开始运动
router.post('/sessions/start', authenticateToken, startSportSession);

// 结束运动
router.post('/sessions/:sessionId/end', authenticateToken, endSportSession);

// 获取运动历史
router.get('/sessions', authenticateToken, getSportHistory);

// 记录GPS轨迹
router.post('/sessions/:sessionId/tracks', authenticateToken, recordGPSTrack);

export default router;