import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// 定义 Multer 文件类型
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// 音乐文件上传配置
const musicStorage = multer.diskStorage({
  destination: (req: Request, file: MulterFile, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'uploads/music/');
  },
  filename: (req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadMusicMiddleware = multer({
  storage: musicStorage,
  fileFilter: (req: Request, file: MulterFile, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// 图片上传配置
const imageStorage = multer.diskStorage({
  destination: (req: Request, file: MulterFile, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'uploads/images/');
  },
  filename: (req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: (req: Request, file: MulterFile, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});