import { Request, Response } from 'express';
import { musicService } from '../services/musicService.js';
import { ApiResponse } from '../types/index.js';

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