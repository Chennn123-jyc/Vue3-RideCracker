import { Request, Response } from 'express';
import { sportService } from '../services/sportService';
import { ApiResponse, SportType } from '../types/index';

// 工具函数：校验时间格式是否有效
const isInvalidDate = (date: Date): boolean => {
  return isNaN(date.getTime());
};

export const startSportSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sport_type, start_time } = req.body;
    const userId = req.user!.id; // 中间件已确保登录，非空断言安全

    // 🔴 1. 参数校验（客户端错误，返回400）
    // 校验运动类型是否合法
    if (!Object.values(SportType).includes(sport_type)) {
      const response: ApiResponse = {
        code: 400,
        message: `运动类型无效，合法类型：${Object.values(SportType).join(', ')}`,
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }
    // 校验时间格式
    const startTime = new Date(start_time);
    if (isInvalidDate(startTime)) {
      const response: ApiResponse = {
        code: 400,
        message: '开始时间格式无效（建议格式：YYYY-MM-DD HH:MM:SS）',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }

    // 调用服务层（传递合法参数）
    const result = await sportService.startSession(userId, { 
      sport_type, 
      start_time: startTime 
    });

    const response: ApiResponse = {
      code: 200,
      message: '运动开始',
      data: result,
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    // 🔴 区分错误类型：服务层抛出的客户端错误（如参数错）返回400，服务器错误返回500
    const isClientError = (error as Error).message.includes('无效') || (error as Error).message.includes('不存在');
    const response: ApiResponse = {
      code: isClientError ? 400 : 500,
      message: error instanceof Error ? error.message : '服务器错误',
      data: null,
      timestamp: Date.now()
    };
    res.status(response.code).json(response);
  }
};

export const endSportSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { end_time, calories, distance, steps, tracks } = req.body;
    const userId = req.user!.id;

    // 🔴 1. 参数校验
    // 校验 sessionId 是否为有效数字
    const sessionIdNum = parseInt(sessionId);
    if (isNaN(sessionIdNum)) {
      const response: ApiResponse = {
        code: 400,
        message: '会话ID必须是数字',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }
    // 校验时间格式
    const endTime = new Date(end_time);
    if (isInvalidDate(endTime)) {
      const response: ApiResponse = {
        code: 400,
        message: '结束时间格式无效（建议格式：YYYY-MM-DD HH:MM:SS）',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }
    // 校验数值参数（不能为负数）
    if (calories < 0 || distance < 0 || steps < 0) {
      const response: ApiResponse = {
        code: 400,
        message: '卡路里、距离、步数不能为负数',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }

    // 🔴 2. 传递 userId 到服务层（用于权限校验）
    await sportService.endSession(
      sessionIdNum, 
      { 
        userId, // 关键：传递当前用户ID
        end_time: endTime, 
        calories, 
        distance, 
        steps 
      }, 
      tracks || [] // 防止 tracks 为 undefined
    );

    const response: ApiResponse = {
      code: 200,
      message: '运动结束',
      data: null,
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    const isClientError = (error as Error).message.includes('无权') || (error as Error).message.includes('不存在');
    const response: ApiResponse = {
      code: isClientError ? 400 : 500,
      message: error instanceof Error ? error.message : '服务器错误',
      data: null,
      timestamp: Date.now()
    };
    res.status(response.code).json(response);
  }
};

export const getSportHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    let { page = 1, limit = 10 } = req.query;
    const userId = req.user!.id;

    // 🔴 参数校验（页码/条数必须为正整数）
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string) || 10), 100); // 限制最大100条

    console.log(`🔍 获取运动历史 - 用户ID: ${userId}, 页码: ${pageNum}, 每页: ${limitNum}`);
    const history = await sportService.getSportHistory(userId, pageNum, limitNum);

    const response: ApiResponse = {
      code: 200,
      message: '成功',
      data: history,
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

export const recordGPSTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { tracks } = req.body;
    const userId = req.user!.id;

    // 🔴 1. 参数校验
    const sessionIdNum = parseInt(sessionId);
    if (isNaN(sessionIdNum)) {
      const response: ApiResponse = {
        code: 400,
        message: '会话ID必须是数字',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }
    // 校验轨迹格式（至少包含一条有效轨迹，且每个点有lat/lng/timestamp）
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      const response: ApiResponse = {
        code: 400,
        message: '轨迹数据不能为空，且必须是数组',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }
    const invalidTrack = tracks.find(t => !t.lat || !t.lng || !t.timestamp || isInvalidDate(new Date(t.timestamp)));
    if (invalidTrack) {
      const response: ApiResponse = {
        code: 400,
        message: '轨迹数据无效（每个点需包含 lat、lng、有效 timestamp）',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }

    // 🔴 2. 传递 userId 到服务层（校验权限）
    await sportService.recordGPSTracks(sessionIdNum, tracks, userId);

    const response: ApiResponse = {
      code: 200,
      message: '轨迹记录成功',
      data: null,
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    const isClientError = (error as Error).message.includes('无权') || (error as Error).message.includes('不存在');
    const response: ApiResponse = {
      code: isClientError ? 400 : 500,
      message: error instanceof Error ? error.message : '服务器错误',
      data: null,
      timestamp: Date.now()
    };
    res.status(response.code).json(response);
  };
};

// 添加删除运动记录功能
export const deleteSportSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    // 参数校验
    const sessionIdNum = parseInt(sessionId);
    if (isNaN(sessionIdNum)) {
      const response: ApiResponse = {
        code: 400,
        message: '会话ID必须是数字',
        data: null,
        timestamp: Date.now()
      };
      res.status(400).json(response);
      return;
    }

    console.log(`🗑️ 用户 ${userId} 请求删除运动记录 ${sessionIdNum}`);

    // 调用服务层删除
    await sportService.deleteSession(sessionIdNum, userId);

    const response: ApiResponse = {
      code: 200,
      message: '运动记录删除成功',
      data: null,
      timestamp: Date.now()
    };
    res.json(response);
  } catch (error) {
    console.error('❌ 删除运动记录失败:', error);
    const isClientError = (error as Error).message.includes('无权') || 
                         (error as Error).message.includes('不存在');
    const response: ApiResponse = {
      code: isClientError ? 400 : 500,
      message: error instanceof Error ? error.message : '服务器错误',
      data: null,
      timestamp: Date.now()
    };
    res.status(response.code).json(response);
  }
};