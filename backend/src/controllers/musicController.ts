import { Request, Response } from 'express';
import { musicService } from '../services/musicService';
import { ApiResponse } from '../types/index';

export const getMusicList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, keyword = '' } = req.query;
    const result = await musicService.getMusicList(
      parseInt(page as string), 
      parseInt(limit as string), 
      keyword as string
    );
    
    const response: ApiResponse = {
      code: 200,
      message: '成功',
      data: result,
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
};

export const uploadMusicHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        code: 400,
        message: '请选择音乐文件',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }

    const metadata = {
      title: req.body.title,
      artist: req.body.artist,
      album: req.body.album,
      cover_image: req.body.cover_image
    };

    const result = await musicService.uploadMusic(req.file, metadata, req.user!.id);
    
    const response: ApiResponse = {
      code: 200,
      message: '上传成功',
      data: result,
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
};

// 新增用户音乐数据接口
export const getUserLikedMusic = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;
    
    const result = await musicService.getUserLikedMusic(
      userId,
      parseInt(page as string), 
      parseInt(limit as string)
    );
    
    const response: ApiResponse = {
      code: 200,
      message: '成功',
      data: result,
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '获取喜欢列表失败',
      data: null,
      timestamp: Date.now()
    };
    res.status(500).json(response);
  }
};

export const getUserPlayHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;
    
    const result = await musicService.getUserPlayHistory(
      userId,
      parseInt(page as string), 
      parseInt(limit as string)
    );
    
    const response: ApiResponse = {
      code: 200,
      message: '成功',
      data: result,
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '获取播放历史失败',
      data: null,
      timestamp: Date.now()
    };
    res.status(500).json(response);
  }
};

// 喜欢/取消喜欢音乐
export const toggleLikeMusic = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { musicId } = req.body;
    
    if (!musicId) {
      const response: ApiResponse = {
        code: 400,
        message: '音乐ID不能为空',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }
    
    const result = await musicService.toggleLikeMusic(userId, musicId);
    
    const response: ApiResponse = {
      code: 200,
      message: result.liked ? '已添加到喜欢' : '已取消喜欢',
      data: result,
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '操作失败',
      data: null,
      timestamp: Date.now()
    };
    res.status(500).json(response);
  }
};

