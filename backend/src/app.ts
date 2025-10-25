import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { connectRedis, dbPool } from './config/database';
import { initDatabase, migrateDatabase } from './config/initDatabase';
import authRoutes from './routes/auth';
import musicRoutes from './routes/music';
import sportRoutes from './routes/sport';
import shareRoutes from './routes/shares';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 获取backend目录路径（uploads在backend目录内）
const backendRoot = path.resolve(__dirname, '..'); // 指向backend目录

// 中间件
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 修复静态文件服务配置 - 使用backend目录内的uploads
const uploadsPath = path.join(backendRoot, 'uploads');

// 检查上传目录是否存在，如果不存在则创建
const ensureUploadDirs = () => {
  const dirs = [
    path.join(uploadsPath, 'music'),
    path.join(uploadsPath, 'images')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 创建上传目录: ${dir}`);
    } else {
      console.log(`📁 上传目录已存在: ${dir}`);
      
      // 列出目录内容用于调试
      try {
        const files = fs.readdirSync(dir);
        console.log(`📁 ${dir} 中的文件:`, files);
      } catch (error) {
        console.log(`❌ 无法读取 ${dir} 目录:`, error);
      }
    }
  });
};

ensureUploadDirs();

// 修复静态文件服务配置
app.use('/uploads', express.static(uploadsPath, {
  index: false,
  dotfiles: 'deny',
  setHeaders: (res, filePath) => {
    // 为音频文件设置正确的 Content-Type
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.webm': 'audio/webm'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

// 增强静态文件访问日志
app.use('/uploads', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestedPath = path.join(uploadsPath, req.path);
  console.log(`📁 静态文件请求: ${req.path}`);
  console.log(`📁 映射到物理路径: ${requestedPath}`);
  console.log(`🔐 认证头: ${req.headers.authorization ? '存在' : '不存在'}`);
  
  if (fs.existsSync(requestedPath)) {
    const stats = fs.statSync(requestedPath);
    console.log(`📁 文件类型: ${stats.isDirectory() ? '目录' : '文件'}`);
    console.log(`📁 文件大小: ${stats.isFile() ? stats.size + ' bytes' : 'N/A'}`);
    console.log(`📁 文件扩展名: ${path.extname(requestedPath)}`);
  } else {
    console.log(`❌ 文件不存在`);
    
    // 列出目录内容用于调试
    const dir = path.dirname(requestedPath);
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        console.log(`📁 目录 ${dir} 中的文件:`, files);
      } catch (error) {
        console.log(`❌ 无法读取目录:`, error);
      }
    }
  }
  
  next();
});

// 请求日志中间件
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/sport', sportRoutes);
app.use('/api/shares', shareRoutes);

// 添加音频流调试路由
app.get('/api/debug/audio/:userMusicId', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const userMusicId = req.params.userMusicId;
    const userId = (req as any).user?.id;
    
    console.log(`🔍 音频调试: userMusicId=${userMusicId}, userId=${userId}`);
    
    // 查询数据库获取文件信息
    const [rows] = await dbPool.execute(
      `SELECT um.*, u.username 
       FROM user_music um 
       JOIN users u ON um.user_id = u.id 
       WHERE um.id = ? AND um.user_id = ?`,
      [userMusicId, userId]
    );
    
    const musicList = rows as any[];
    if (musicList.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '音乐未找到或无权访问',
        data: null,
        timestamp: Date.now()
      });
    }
    
    const music = musicList[0];
    
    // 构建文件路径
    const absoluteFilePath = path.join(uploadsPath, 'music', music.file_path);
    
    res.json({
      code: 200,
      message: '音频信息获取成功',
      data: {
        music: {
          id: music.id,
          title: music.title,
          artist: music.artist,
          file_path: music.file_path,
          file_name: music.file_name,
          file_format: music.file_format,
          user_id: music.user_id,
          username: music.username
        },
        paths: {
          file_path: music.file_path,
          absoluteFilePath,
          exists: fs.existsSync(absoluteFilePath)
        },
        urls: {
          streamUrl: `/api/music/stream/user/${music.id}`,
          directUrl: `/uploads/music/${music.file_path}`,
          fullStreamUrl: `http://localhost:${PORT}/api/music/stream/user/${music.id}`,
          fullDirectUrl: `http://localhost:${PORT}/uploads/music/${music.file_path}`
        }
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('音频调试错误:', error);
    res.status(500).json({
      code: 500,
      message: '调试信息获取失败',
      data: { error: error instanceof Error ? error.message : '未知错误' },
      timestamp: Date.now()
    });
  }
});

// 添加直接文件访问测试
app.get('/api/test/audio-file/:filename', (req: express.Request, res: express.Response) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsPath, 'music', filename);
  
  console.log(`🔍 测试文件访问: ${filename}`);
  console.log(`📁 文件路径: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      code: 404,
      message: '文件不存在',
      data: { filename, filePath },
      timestamp: Date.now()
    });
  }
  
  const stats = fs.statSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac'
  };
  
  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  res.setHeader('Content-Length', stats.size);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (error) => {
    console.error('文件流错误:', error);
    res.status(500).json({
      code: 500,
      message: '文件读取失败',
      data: null,
      timestamp: Date.now()
    });
  });
});

// 添加健康检查端点
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({
    code: 200,
    message: '服务正常运行',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    },
    timestamp: Date.now()
  });
});


app.get('/api/debug/filesystem', (req: express.Request, res: express.Response) => {
  const backendRoot = path.resolve(__dirname, '..');
  const uploadsPath = path.join(backendRoot, 'uploads', 'music');
  
  try {
    const stats = {
      backendRoot,
      uploadsPath,
      uploadsExists: fs.existsSync(uploadsPath),
      directories: [] as string[]
    };
    
    if (stats.uploadsExists) {
      stats.directories = fs.readdirSync(uploadsPath);
      
      // 检查每个用户目录
      stats.directories.forEach(dir => {
        const userDir = path.join(uploadsPath, dir);
        if (fs.statSync(userDir).isDirectory()) {
          console.log(`📁 用户 ${dir} 目录中的文件:`, fs.readdirSync(userDir));
        }
      });
    }
    
    res.json({
      code: 200,
      message: '文件系统状态',
      data: stats,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '文件系统检查失败',
      data: { error: error instanceof Error ? error.message : '未知错误' },
      timestamp: Date.now()
    });
  }
});

// 在现有的 /api/debug/filesystem 路由后面添加以下代码

// 详细文件系统调试路由
app.get('/api/debug/filesystem/detailed', (req: express.Request, res: express.Response) => {
  const backendRoot = path.resolve(__dirname, '..');
  const uploadsPath = path.join(backendRoot, 'uploads', 'music');
  
  try {
    const stats = {
      backendRoot,
      uploadsPath,
      uploadsExists: fs.existsSync(uploadsPath),
      directories: [] as any[]
    };
    
    if (stats.uploadsExists) {
      stats.directories = fs.readdirSync(uploadsPath).map(dir => {
        const userDir = path.join(uploadsPath, dir);
        try {
          const isDirectory = fs.statSync(userDir).isDirectory();
          const files = isDirectory ? fs.readdirSync(userDir) : [];
          return {
            name: dir,
            isDirectory,
            files: files.map(file => {
              const filePath = path.join(userDir, file);
              const fileStat = fs.statSync(filePath);
              return {
                name: file,
                size: fileStat.size,
                modified: fileStat.mtime,
                path: filePath
              };
            })
          };
        } catch (error) {
          return {
            name: dir,
            isDirectory: false,
            error: error instanceof Error ? error.message : '未知错误',
            files: []
          };
        }
      });
    }
    
    res.json({
      code: 200,
      message: '详细文件系统状态',
      data: stats,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '文件系统检查失败',
      data: { error: error instanceof Error ? error.message : '未知错误' },
      timestamp: Date.now()
    });
  }
});

// 快速文件检查路由
app.get('/api/debug/check-file/:userId/:filename', (req: express.Request, res: express.Response) => {
  const { userId, filename } = req.params;
  const decodedFilename = decodeURIComponent(filename);
  
  const possiblePaths = [
    path.join(backendRoot, 'uploads', 'music', userId, decodedFilename),
    path.join('D:', 'Personal Workspace', 'RideCracker', 'backend', 'uploads', 'music', userId, decodedFilename),
    path.join(uploadsPath, userId, decodedFilename)
  ];
  
  const results = possiblePaths.map(filePath => ({
    path: filePath,
    exists: fs.existsSync(filePath),
    isFile: fs.existsSync(filePath) ? fs.statSync(filePath).isFile() : false,
    size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
  }));
  
  // 检查用户目录是否存在
  const userDir = path.join(uploadsPath, 'music', userId);
  const userDirExists = fs.existsSync(userDir);
  let userDirFiles: string[] = [];
  
  if (userDirExists) {
    try {
      userDirFiles = fs.readdirSync(userDir);
    } catch (error) {
      userDirFiles = [`无法读取目录: ${error}`];
    }
  }
  
  res.json({
    code: 200,
    message: '文件路径检查结果',
    data: {
      userId,
      filename: decodedFilename,
      userDirExists,
      userDirFiles,
      paths: results
    },
    timestamp: Date.now()
  });
});

// 数据库音乐记录检查路由
app.get('/api/debug/db-music/:userId?', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id;
    const targetUserId = req.params.userId || userId;
    
    if (!targetUserId) {
      return res.status(400).json({
        code: 400,
        message: '需要用户ID',
        data: null,
        timestamp: Date.now()
      });
    }
    
    // 查询用户音乐记录
    const [rows] = await dbPool.execute(
      `SELECT id, user_id, file_name, file_path, file_size, file_format, title, artist 
       FROM user_music 
       WHERE user_id = ? 
       ORDER BY upload_time DESC`,
      [targetUserId]
    );
    
    const musicList = rows as any[];
    
    // 检查每个文件是否存在
    const musicWithFileCheck = musicList.map(music => {
      const filePath = path.join(backendRoot, 'uploads', 'music', music.file_path);
      return {
        ...music,
        file_exists: fs.existsSync(filePath),
        absolute_path: filePath
      };
    });
    
    res.json({
      code: 200,
      message: '数据库音乐记录检查完成',
      data: {
        userId: targetUserId,
        totalRecords: musicList.length,
        records: musicWithFileCheck
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('数据库音乐记录检查错误:', error);
    res.status(500).json({
      code: 500,
      message: '数据库检查失败',
      data: { error: error instanceof Error ? error.message : '未知错误' },
      timestamp: Date.now()
    });
  }
});

// 启动服务
const startServer = async (): Promise<void> => {
  try {
    console.log('🚀 启动后端服务...');
    
    // 连接 Redis
    await connectRedis();
    console.log('Redis连接成功');
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 后端服务运行在端口 ${PORT}`);
      console.log(`📁 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📁 Backend 目录: ${backendRoot}`);
      console.log(`📁 上传目录: ${uploadsPath}`);
      console.log(`🔧 健康检查: http://localhost:${PORT}/health`);
      console.log(`🐛 文件系统调试: http://localhost:${PORT}/api/debug/filesystem`);
      console.log(`🎵 音频调试: http://localhost:${PORT}/api/debug/audio/1`); // 替换为实际存在的音乐ID
      console.log(`🎵 测试文件访问: http://localhost:${PORT}/api/test/audio-file/test-file.txt`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();