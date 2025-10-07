import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbPool } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, RegisterRequest, LoginRequest, User } from '../types/index';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { uploadImage } from '../middleware/upload';

// 扩展 User 类型以包含 password
interface UserWithPassword extends User {
  password: string;
}

const router = express.Router();

// 注册
router.post('/register', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { username, email, password, avatar }: RegisterRequest = req.body;

    // 检查用户是否已存在
    const result = await dbPool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    const [existingUsers] = result;

    if (existingUsers.length > 0) {
      const response: ApiResponse = {
        code: 400,
        message: '邮箱已被注册',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const insertResult = await dbPool.execute<ResultSetHeader>(
      'INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, avatar || null]
    );
    const [insertData] = insertResult;

    const response: ApiResponse = {
      code: 201,
      message: '注册成功',
      data: { id: insertData.insertId },
      timestamp: Date.now()
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '服务器错误',
      data: null,
      timestamp: Date.now()
    };
    res.status(500).json(response);
  }
});

// 登录
router.post('/login', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // 查找用户
    const result = await dbPool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    const [users] = result;

    if (users.length === 0) {
      const response: ApiResponse = {
        code: 401,
        message: '邮箱或密码错误',
        data: null,
        timestamp: Date.now()
      };
      res.status(401).json(response);
      return;
    }

    const user = users[0] as UserWithPassword;

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const response: ApiResponse = {
        code: 401,
        message: '邮箱或密码错误',
        data: null,
        timestamp: Date.now()
      };
      res.status(401).json(response);
      return;
    }

    // 检查 JWT_SECRET 是否存在
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET 环境变量未设置');
    }

    // 生成JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        username: user.username 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
      } as jwt.SignOptions
    );

    const response: ApiResponse = {
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar
        }
      },
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '服务器错误',
      data: null,
      timestamp: Date.now()
    };
    res.status(500).json(response);
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const result = await dbPool.execute<RowDataPacket[]>(
      'SELECT id, username, email, avatar, created_at, updated_at FROM users WHERE id = ?',
      [req.user!.id]
    );
    const [users] = result;

    if (users.length === 0) {
      const response: ApiResponse = {
        code: 404,
        message: '用户不存在',
        data: null,
        timestamp: Date.now()
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      code: 200,
      message: '成功',
      data: users[0],
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '服务器错误',
      data: null,
      timestamp: Date.now()
    };
    res.status(500).json(response);
  }
});



// 更新用户信息
router.put('/profile', authenticateToken, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { username, avatar } = req.body;
    const userId = req.user!.id;

    await dbPool.execute(
      'UPDATE users SET username = ?, avatar = ? WHERE id = ?',
      [username, avatar, userId]
    );

    const response: ApiResponse = {
      code: 200,
      message: '更新成功',
      data: null,
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '服务器错误',
      data: null,
      timestamp: Date.now()
    };
    res.status(500).json(response);
  }
});


// 上传头像
router.post('/avatar', authenticateToken, uploadImage.single('avatar'), async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        code: 400,
        message: '请选择头像文件',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }

    const avatarUrl = `/uploads/images/${req.file.filename}`;
    const userId = req.user!.id;

    // 更新用户头像
    await dbPool.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarUrl, userId]
    );

    const response: ApiResponse = {
      code: 200,
      message: '头像上传成功',
      data: {
        avatar: avatarUrl
      },
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '头像上传失败',
      data: null,
      timestamp: Date.now()
    };
    res.status(500).json(response);
  }
});

export default router;