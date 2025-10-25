// controllers/userMusicController.ts
import { Request, Response } from 'express';
import { ApiResponse } from '../types/index';
import { dbPool } from '../config/database';
import { RowDataPacket } from 'mysql2';
import path from 'path';
import fs from 'fs';
import { userMusicService } from '../services/userMusicService';

// 扩展 Express Request 类型以包含 user 属性
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const uploadUserMusicHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('=== 开始处理音乐上传 ===');
    
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user?.id) {
      console.log('错误: 用户未认证');
      const response: ApiResponse = {
        code: 401,
        message: '用户未认证',
        data: null,
        timestamp: Date.now()
      };
      return res.status(401).json(response);
    }

    if (!req.file) {
      console.log('错误: 没有收到文件');
      const response: ApiResponse = {
        code: 400,
        message: '请选择音乐文件',
        data: null,
        timestamp: Date.now()
      };
      return res.status(400).json(response);
    }

    if (!req.body.title || !req.body.artist) {
      console.log('错误: 缺少必要元数据');
      const response: ApiResponse = {
        code: 400,
        message: '歌曲标题和艺术家不能为空',
        data: null,
        timestamp: Date.now()
      };
      return res.status(400).json(response);
    }

    const metadata = {
      title: req.body.title,
      artist: req.body.artist,
      album: req.body.album || '未知专辑',
      cover_image: req.body.cover_image
    };

    console.log('调用 userMusicService.uploadMusic...');
    const result = await userMusicService.uploadMusic(req.file, metadata, authReq.user.id);
    
    console.log('上传成功，返回结果');
    const response: ApiResponse = {
      code: 200,
      message: '上传成功',
      data: result,
      timestamp: Date.now()
    };
    
    return res.json(response);
    
  } catch (error) {
    console.error('上传处理错误:', error);
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '服务器错误',
      data: null,
      timestamp: Date.now()
    };
    return res.status(500).json(response);
  }
};

export const getUserMusicLibrary = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('🎵 开始获取用户音乐库');
    
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      console.log('❌ 错误: 用户ID不存在');
      const response: ApiResponse = {
        code: 401,
        message: '用户未认证',
        data: null,
        timestamp: Date.now()
      };
      return res.status(401).json(response);
    }

    const { keyword = '', page = 1, limit = 20 } = req.query;
    
    // 确保参数是数字类型
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    
    console.log(`📊 查询参数: userId=${userId}, keyword=${keyword}, page=${pageNum}, limit=${limitNum}`);

    // 直接使用 userMusicService
    const result = await userMusicService.getUserMusicLibrary(
      userId, // userId 已经是 number 类型，不需要转换
      keyword as string,
      pageNum,
      limitNum
    );
    
    console.log(`✅ 成功获取用户音乐库，数量: ${result.items?.length || 0}`);
    
    const response: ApiResponse = {
      code: 200,
      message: '成功',
      data: result,
      timestamp: Date.now()
    };
    return res.json(response);
  } catch (error) {
    console.error('❌ 获取用户音乐库失败:', error);
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '获取失败',
      data: null,
      timestamp: Date.now()
    };
    return res.status(500).json(response);
  }
};

export const getLikedUserMusic = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      const response: ApiResponse = {
        code: 401,
        message: '用户未认证',
        data: null,
        timestamp: Date.now()
      };
      return res.status(401).json(response);
    }

    const { keyword = '', page = 1, limit = 20 } = req.query;
    
    // 确保参数是数字类型
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    
    console.log(`📊 获取喜欢音乐: userId=${userId}`);

    // 直接使用 userMusicService
    const result = await userMusicService.getUserLikedMusic(
      userId, // userId 已经是 number 类型，不需要转换
      keyword as string,
      pageNum,
      limitNum
    );
    
    const response: ApiResponse = {
      code: 200,
      message: '成功',
      data: result,
      timestamp: Date.now()
    };
    return res.json(response);
  } catch (error) {
    console.error('获取喜欢音乐失败:', error);
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '获取失败',
      data: null,
      timestamp: Date.now()
    };
    return res.status(500).json(response);
  }
};

export const toggleLikeUserMusic = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      const response: ApiResponse = {
        code: 401,
        message: '用户未认证',
        data: null,
        timestamp: Date.now()
      };
      return res.status(401).json(response);
    }

    const { userMusicId } = req.body;
    
    if (!userMusicId) {
      const response: ApiResponse = {
        code: 400,
        message: '音乐ID不能为空',
        data: null,
        timestamp: Date.now()
      };
      return res.status(400).json(response);
    }
    
    // 确保参数是数字类型
    const userMusicIdNum = parseInt(userMusicId as string, 10);
    
    // 直接使用 userMusicService
    const result = await userMusicService.toggleLikeUserMusic(userId, userMusicIdNum);
    
    const response: ApiResponse = {
      code: 200,
      message: result.liked ? '已添加到喜欢' : '已取消喜欢',
      data: result,
      timestamp: Date.now()
    };
    return res.json(response);
  } catch (error) {
    console.error('切换喜欢状态失败:', error);
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '操作失败',
      data: null,
      timestamp: Date.now()
    };
    return res.status(500).json(response);
  }
};

export const deleteUserMusic = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      const response: ApiResponse = {
        code: 401,
        message: '用户未认证',
        data: null,
        timestamp: Date.now()
      };
      return res.status(401).json(response);
    }

    const { userMusicId } = req.params;
    
    if (!userMusicId) {
      const response: ApiResponse = {
        code: 400,
        message: '音乐ID不能为空',
        data: null,
        timestamp: Date.now()
      };
      return res.status(400).json(response);
    }
    
    // 确保参数是数字类型
    const userMusicIdNum = parseInt(userMusicId as string, 10);
    
    // 直接使用 userMusicService
    await userMusicService.deleteUserMusic(userId, userMusicIdNum);
    
    const response: ApiResponse = {
      code: 200,
      message: '删除成功',
      data: null,
      timestamp: Date.now()
    };
    return res.json(response);
  } catch (error) {
    console.error('删除用户音乐失败:', error);
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '删除失败',
      data: null,
      timestamp: Date.now()
    };
    return res.status(500).json(response);
  }
};

export const getMusicStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      console.log('❌ 用户未认证');
      res.status(401).json({
        code: 401,
        message: "用户未认证",
        data: null,
        timestamp: Date.now()
      });
      return;
    }

    const { userMusicId } = req.params;
    console.log(`🎵 请求音乐流: userMusicId=${userMusicId}, userId=${userId}`);

    // 1. 从数据库获取音乐文件路径
    const [musicRows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT file_path, file_format, file_name, user_id FROM user_music WHERE id = ? AND user_id = ?`,
      [userMusicId, userId]
    );

    if (musicRows.length === 0) {
      console.log(`❌ 音乐不存在或无权访问: userMusicId=${userMusicId}`);
      res.status(404).json({
        code: 404,
        message: "音乐不存在或无权访问",
        data: null,
        timestamp: Date.now()
      });
      return;
    }

    const music = musicRows[0];
    
    console.log('📊 数据库记录:', {
      file_path: music.file_path,
      file_name: music.file_name,
      file_format: music.file_format
    });
    
    // 🔒 文件路径验证
    if (!music.file_path || music.file_path.includes('..')) {
      console.log(`❌ 文件路径不安全: ${music.file_path}`);
      res.status(400).json({
        code: 400,
        message: "文件路径无效",
        data: null,
        timestamp: Date.now()
      });
      return;
    }

    // 2. 构建文件路径 - 关键修复
    const backendRoot = path.resolve(__dirname, '../..');
    const uploadsPath = path.join(backendRoot, 'uploads', 'music');
    
    // 修复路径构建：确保使用正确的路径
    let absoluteFilePath = path.join(uploadsPath, music.file_path);
    
    console.log(`📁 路径构建检查:`, {
      backendRoot,
      uploadsPath,
      db_file_path: music.file_path,
      absoluteFilePath,
      fileExists: fs.existsSync(absoluteFilePath)
    });

    // 3. 如果主要路径不存在，尝试备用路径
    if (!fs.existsSync(absoluteFilePath)) {
      console.log(`❌ 主要路径不存在，尝试备用路径检查`);
      
      // 备用方案1：直接拼接用户目录
      const alternativePath1 = path.join(uploadsPath, userId.toString(), path.basename(music.file_path));
      console.log(`🔍 备用路径1: ${alternativePath1}, 存在: ${fs.existsSync(alternativePath1)}`);
      
      // 备用方案2：使用文件名的完整路径
      const alternativePath2 = path.join(uploadsPath, userId.toString(), music.file_name);
      console.log(`🔍 备用路径2: ${alternativePath2}, 存在: ${fs.existsSync(alternativePath2)}`);
      
      // 使用第一个存在的路径
      if (fs.existsSync(alternativePath1)) {
        absoluteFilePath = alternativePath1;
        console.log(`✅ 使用备用路径1`);
      } else if (fs.existsSync(alternativePath2)) {
        absoluteFilePath = alternativePath2;
        console.log(`✅ 使用备用路径2`);
      } else {
        // 列出用户目录内容用于调试
        const userDir = path.join(uploadsPath, userId.toString());
        if (fs.existsSync(userDir)) {
          const files = fs.readdirSync(userDir);
          console.log(`📁 用户 ${userId} 目录中的文件:`, files);
        }
      }
    }

    // 4. 最终检查文件是否存在
    if (!fs.existsSync(absoluteFilePath)) {
      console.log(`❌ 音频文件不存在: ${absoluteFilePath}`);
      res.status(404).json({
        code: 404,
        message: "音频文件已丢失",
        data: null,
        timestamp: Date.now()
      });
      return;
    }

    console.log(`✅ 找到音频文件: ${absoluteFilePath}`);

    // 5. 设置正确的 Content-Type
    const contentType = getContentType(music.file_format || path.extname(absoluteFilePath));
    res.setHeader("Content-Type", contentType);
    
    // 修复 Content-Disposition 头
    const fileName = music.file_name || path.basename(absoluteFilePath);
    const safeFileName = fileName.replace(/[^a-zA-Z0-9\-_.]/g, '_');
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
    
    // 6. 支持范围请求
    const fileStat = fs.statSync(absoluteFilePath);
    const fileSize = fileStat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      if (start >= fileSize || end >= fileSize) {
        res.status(416).json({
          code: 416,
          message: "请求范围不符合要求",
          data: null,
          timestamp: Date.now()
        });
        return;
      }
      
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType
      });

      const fileStream = fs.createReadStream(absoluteFilePath, { start, end });
      fileStream.pipe(res);
    } else {
      res.setHeader("Content-Length", fileSize);
      res.setHeader("Accept-Ranges", "bytes");
      
      const fileStream = fs.createReadStream(absoluteFilePath);
      fileStream.pipe(res);
    }

    console.log(`✅ 成功返回音乐流: ${absoluteFilePath}`);

  } catch (error) {
    console.error("❌ 音频流获取失败:", error);
    if (!res.headersSent) {
      res.status(500).json({
        code: 500,
        message: "播放失败，请重试",
        data: null,
        timestamp: Date.now()
      });
    }
  }
};

// 辅助函数：根据文件格式获取 Content-Type
function getContentType(fileFormat: string): string {
  // 清理文件格式字符串
  const format = fileFormat.toLowerCase().replace('.', '').trim();
  
  const typeMap: { [key: string]: string } = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'webm': 'audio/webm',
    'mpeg': 'audio/mpeg',
    'mp4': 'audio/mp4'
  };
  
  // 如果找不到对应的类型，默认使用 audio/mpeg
  return typeMap[format] || 'audio/mpeg';
}