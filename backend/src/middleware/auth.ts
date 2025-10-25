import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../types/index';
import { JWTPayload } from '../types/index';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // 1. 校验 JWT_SECRET
  if (!process.env.JWT_SECRET) {
    console.error('❌ 环境变量 JWT_SECRET 未配置！');
    const response: ApiResponse = {
      code: 500,
      message: '服务器配置错误',
      data: null,
      timestamp: Date.now()
    };
    res.status(500).json(response);
    return;
  }

  console.log(`🔐 认证检查: ${req.method} ${req.originalUrl}`);
  
  // 2. 提取 Token - 简化版本，使用类型断言
  let token: string | undefined;
  
  // 从 Authorization 头获取
  const authHeader = req.headers['authorization'];
  console.log('📤 后端收到的 Authorization 头:', authHeader);
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log('🔑 从 Authorization 头获取 token');
  }
  
  // 从查询参数获取 - 使用类型断言简化
  if (!token && req.query.token) {
    // 简化处理：假设 token 是字符串
    token = req.query.token as string;
    console.log('🔑 从查询参数获取 token');
  }
  
  console.log('🔍 最终提取的 token:', token ? '存在' : '不存在');

  // 3. 未获取到 Token 的处理
  if (!token) {
    console.error('❌ 未获取到有效 token！');
    
    const response: ApiResponse = {
      code: 401,
      message: '访问令牌不存在',
      data: {
        supportedMethods: ['Authorization Header (Bearer token)', 'Query Parameter (token)']
      },
      timestamp: Date.now()
    };
    res.status(401).json(response);
    return;
  }

  // 4. Token 验证
  jwt.verify(token, process.env.JWT_SECRET, (err: Error | null, user: unknown) => {
    if (err) {
      const isExpired = err.name === 'TokenExpiredError';
      console.error(`❌ Token 验证失败: ${isExpired ? '令牌已过期' : '令牌无效'}`, err.message);
      
      const response: ApiResponse = {
        code: isExpired ? 401 : 403,
        message: isExpired ? '访问令牌已过期，请重新登录' : '令牌无效',
        data: null,
        timestamp: Date.now()
      };
      res.status(response.code).json(response);
      return;
    }

    // 5. 验证成功
    const userInfo = user as JWTPayload;
    console.log('✅ Token 验证成功，用户:', userInfo.username);
    req.user = userInfo;
    next();
  });
};