import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../types/index';
import { JWTPayload } from '../types/index';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // 1. 打印收到的 Authorization 头（原始值）
  const authHeader = req.headers['authorization'];
  console.log('📤 后端收到的 Authorization 头:', authHeader); // 新增日志

  // 2. 打印提取后的 token
  const token = authHeader && authHeader.split(' ')[1];
  console.log('🔍 提取的 token:', token); // 新增日志

  if (!token) {
    // 3. 打印未获取到 token 的原因
    console.error('❌ 未获取到有效 token！原因：', authHeader ? '格式错误（缺少空格或 Bearer 前缀）' : 'Authorization 头不存在'); // 新增日志
    const response: ApiResponse = {
      code: 401,
      message: '访问令牌不存在',
      data: null,
      timestamp: Date.now()
    };
    res.status(401).json(response);
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: Error | null, user: unknown) => {
    if (err) {
      // 4. 打印 token 验证失败的具体错误
      console.error('❌ Token 验证失败:', err.message); // 新增日志
      const response: ApiResponse = {
        code: 403,
        message: '令牌无效',
        data: null,
        timestamp: Date.now()
      };
      res.status(403).json(response);
      return;
    }
    // 5. 打印验证成功的用户信息
    console.log('✅ Token 验证成功，用户信息:', user); // 新增日志
    req.user = user as JWTPayload;
    next();
  });
};