import express from 'express';

const router = express.Router();

// 临时路由，后续实现具体功能
router.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    code: 200,
    message: '分享模块',
    data: null,
    timestamp: Date.now()
  });
});

export default router;