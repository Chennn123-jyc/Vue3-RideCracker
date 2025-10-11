import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../types/index';
import { JWTPayload } from '../types/index';

// 🔴 关键：扩展 Express 的 Request 类型，添加 user 属性（解决 TypeScript 报错）
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload; // 关联你的 JWTPayload 类型，确保能拿到 userId 等字段
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // 1. 校验 JWT_SECRET 是否配置（避免非空断言崩溃）
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

  // 2. 提取 Authorization 头和 Token
  const authHeader = req.headers['authorization'];
  console.log('📤 后端收到的 Authorization 头:', authHeader);
  const token = authHeader && authHeader.split(' ')[1]; // 格式必须是 "Bearer {token}"
  console.log('🔍 提取的 token:', token);

  // 3. 未获取到 Token 的处理
  if (!token) {
    const reason = authHeader ? '格式错误（需符合 "Bearer {token}"）' : 'Authorization 头不存在';
    console.error('❌ 未获取到有效 token！原因：', reason);
    const response: ApiResponse = {
      code: 401,
      message: '访问令牌不存在或格式错误', // 提示更具体
      data: null,
      timestamp: Date.now()
    };
    res.status(401).json(response);
    return;
  }

  // 4. Token 验证（细化错误类型：过期/无效）
  jwt.verify(token, process.env.JWT_SECRET, (err: Error | null, user: unknown) => {
    if (err) {
      // 区分 Token 过期和无效
      const isExpired = err.name === 'TokenExpiredError';
      console.error(`❌ Token 验证失败: ${isExpired ? '令牌已过期' : '令牌无效'}`, err.message);
      const response: ApiResponse = {
        code: isExpired ? 401 : 403, // 过期返回 401，无效返回 403（状态码语义更准确）
        message: isExpired ? '访问令牌已过期，请重新登录' : '令牌无效',
        data: null,
        timestamp: Date.now()
      };
      res.status(response.code).json(response);
      return;
    }

    // 5. 验证成功：挂载用户信息到 req.user
    const userInfo = user as JWTPayload;
    console.log('✅ Token 验证成功，用户信息:', userInfo);
    req.user = userInfo; // 后续控制器可通过 req.user 获取 userId 等信息
    next(); // 放行到下一个中间件/控制器
  });
};