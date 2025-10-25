import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error Handler:', err);

  // Multer 错误处理
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        code: 400,
        message: '文件大小超过限制 (最大50MB)',
        data: null,
        timestamp: Date.now()
      });
      return; // 只是返回，不返回值
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        code: 400,
        message: '文件字段名不正确',
        data: null,
        timestamp: Date.now()
      });
      return; // 只是返回，不返回值
    }
  }

  // 其他错误
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    code: statusCode,
    message: err.message || '服务器内部错误',
    data: null,
    timestamp: Date.now()
  });
  // 不需要显式 return，函数自然结束
};