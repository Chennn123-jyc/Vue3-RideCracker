import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../types/index';
import { JWTPayload } from '../types/index';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
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
      const response: ApiResponse = {
        code: 403,
        message: '令牌无效',
        data: null,
        timestamp: Date.now()
      };
      res.status(403).json(response);
      return;
    }
    req.user = user as JWTPayload;
    next();
  });
};