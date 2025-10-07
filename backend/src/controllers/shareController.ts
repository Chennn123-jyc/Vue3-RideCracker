import { Request, Response } from 'express';
import { shareService } from '../services/shareService';
import { ApiResponse } from '../types/index';

export const getShares = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, category, user_id } = req.query;
    const currentUserId = req.user!.id;

    const result = await shareService.getShares(
      parseInt(page as string),
      parseInt(limit as string),
      category as string | null,
      user_id ? parseInt(user_id as string) : null
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

export const createShare = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, images, category, is_public } = req.body;
    const userId = req.user!.id;

    const result = await shareService.createShare(
      { content, images, category, is_public }, 
      userId
    );

    const response: ApiResponse = {
      code: 201,
      message: '分享成功',
      data: result,
      timestamp: Date.now()
    };
    res.status(201).json(response);
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

export const toggleLike = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareId } = req.params;
    const userId = req.user!.id;

    const result = await shareService.toggleLike(parseInt(shareId), userId);

    const response: ApiResponse = {
      code: 200,
      message: result.liked ? '点赞成功' : '取消点赞成功',
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

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareId } = req.params;
    const { content, parent_id } = req.body;
    const userId = req.user!.id;

    const result = await shareService.addComment(
      parseInt(shareId), 
      userId, 
      content, 
      parent_id
    );

    const response: ApiResponse = {
      code: 201,
      message: '评论成功',
      data: result,
      timestamp: Date.now()
    };
    res.status(201).json(response);
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

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareId } = req.params;
    
    const comments = await shareService.getComments(parseInt(shareId));

    const response: ApiResponse = {
      code: 200,
      message: '成功',
      data: comments,
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

export const getShareDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareId } = req.params;
    
    const share = await shareService.getShareDetail(parseInt(shareId));

    const response: ApiResponse = {
      code: 200,
      message: '成功',
      data: share,
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