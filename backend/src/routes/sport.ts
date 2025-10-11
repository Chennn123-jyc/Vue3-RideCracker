import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  startSportSession, 
  endSportSession, 
  getSportHistory, 
  recordGPSTrack ,
  deleteSportSession
} from '../controllers/sportController';

const router = express.Router();

// 🔴 优化：统一挂载登录校验中间件（所有后续接口都需登录）
router.use(authenticateToken);

// 原有接口：无需再单独加 authenticateToken 中间件
router.post('/sessions/start', startSportSession); // 开始运动
router.post('/sessions/:sessionId/end', endSportSession); // 结束运动
router.get('/sessions', getSportHistory); // 获取运动历史
router.post('/sessions/:sessionId/tracks', recordGPSTrack); // 记录 GPS 轨迹
router.delete('/sessions/:sessionId', deleteSportSession);

export default router;