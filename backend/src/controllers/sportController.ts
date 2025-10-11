import { Request, Response } from 'express';
import { sportService } from '../services/sportService';
import { ApiResponse } from '../types/index';

export const startSportSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sport_type, start_time } = req.body;
    const userId = req.user!.id;

    const result = await sportService.startSession(userId, { 
      sport_type, 
      start_time: new Date(start_time) 
    });

    const response: ApiResponse = {
      code: 200,
      message: '运动开始',
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

export const endSportSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { end_time, calories, distance, steps, tracks } = req.body;
    const userId = req.user!.id;

    await sportService.endSession(
      parseInt(sessionId), 
      { 
        end_time: new Date(end_time), 
        calories, 
        distance, 
        steps 
      }, 
      tracks
    );

    const response: ApiResponse = {
      code: 200,
      message: '运动结束',
      data: null,
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

export const getSportHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    let { page = 1, limit = 10 } = req.query;
    const userId = req.user!.id;

    // 参数验证和转换
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string) || 10), 100); // 限制最大100条
    
    console.log(`🔍 获取运动历史 - 用户ID: ${userId}, 页码: ${pageNum}, 每页: ${limitNum}`);

    const history = await sportService.getSportHistory(
      userId,
      pageNum, 
      limitNum
    );

    const response: ApiResponse = {
      code: 200,
      message: '成功',
      data: history,
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    console.error('❌ 获取运动历史失败:', error);
    const response: ApiResponse = {
      code: 500,
      message: error instanceof Error ? error.message : '服务器错误',
      data: null,
      timestamp: Date.now()
    };
    res.status(500).json(response);
  }
};

export const recordGPSTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { tracks } = req.body;

    await sportService.recordGPSTracks(parseInt(sessionId), tracks);

    const response: ApiResponse = {
      code: 200,
      message: '轨迹记录成功',
      data: null,
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