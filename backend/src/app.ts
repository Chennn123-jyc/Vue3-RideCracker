import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { connectRedis, dbPool } from './config/database';
import { initDatabase } from './config/initDatabase';
import authRoutes from './routes/auth';
import musicRoutes from './routes/music';
import sportRoutes from './routes/sport';
import shareRoutes from './routes/shares';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: 'http://localhost:5173', // Vue开发服务器端口
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/sport', sportRoutes);
app.use('/api/shares', shareRoutes);

// 健康检查
app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    // 检查数据库连接
    const [dbResult] = await dbPool.execute('SELECT 1 as connected');
    
    res.json({ 
      code: 200, 
      message: '服务正常运行', 
      data: { 
        timestamp: new Date().toISOString(),
        database: 'connected',
        redis: 'connected'
      },
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务异常',
      data: { error: error instanceof Error ? error.message : '未知错误' },
      timestamp: Date.now()
    });
  }
});

// 404处理
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
    timestamp: Date.now()
  });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null,
    timestamp: Date.now()
  });
});

// 启动服务
const startServer = async (): Promise<void> => {
  try {
    // 初始化数据库
    if (process.env.AUTO_INIT_DB === 'true') {
      await initDatabase();
    }
    
    await connectRedis();
    console.log('Redis连接成功');
    
    app.listen(PORT, () => {
      console.log(`后端服务运行在端口 ${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();