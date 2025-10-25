// middleware/upload.ts
import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

// 确保上传目录存在
const ensureUploadDirs = () => {
  const dirs = ['uploads/music', 'uploads/images'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureUploadDirs();

// 音乐文件上传配置
const musicStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads/music/');
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueSuffix + '_' + safeName);
  }
});

export const uploadMusicMiddleware = multer({
  storage: musicStorage,
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    const allowedTypes = [
      'audio/mpeg', 
      'audio/wav', 
      'audio/flac',
      'audio/mp3',
      'audio/x-m4a',
      'audio/aac',
      'audio/ogg',
      'audio/webm'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // 确保返回 JSON 错误而不是抛出异常
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  },
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});
// 图片上传配置
const imageStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads/images/');
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});