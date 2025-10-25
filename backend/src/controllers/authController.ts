import { Request, Response } from 'express';
import { ApiResponse } from '../types/index'; // 导入 ApiResponse 类型
import { JWTPayload } from '../types/index'; // 导入 JWTPayload 类型

// 扩展 Express 的 Request 类型以包含 user 属性
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const checkAuth = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 检查用户是否存在
    if (!req.user) {
      const response: ApiResponse = {
        code: 401,
        message: '用户未认证',
        data: null,
        timestamp: Date.now()
      };
      return res.status(401).json(response);
    }

    const response: ApiResponse = {
      code: 200,
      message: '认证有效',
      data: { userId: req.user.id },
      timestamp: Date.now()
    };
    return res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now()
    };
    return res.status(500).json(response);
  }
};