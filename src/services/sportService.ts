export interface SportSessionData {
  sport_type: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  calories?: number;
  distance?: number;
  steps?: number;
}

export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

// 运动历史响应类型
export interface SportHistoryResponse {
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class SportService {
  private API_BASE = 'http://localhost:3000/api';
  private isBackendAvailable = true; 

  // 检查后端服务状态 - 修复了超时属性的类型错误
  private async checkBackendStatus(): Promise<boolean> {
    try {
      // 使用AbortController实现超时功能
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${this.API_BASE.replace('/api', '')}/health`, {
        method: 'GET',
        signal: controller.signal // 关联abort信号
      });
      
      clearTimeout(timeoutId); // 请求成功则清除超时定时器
      return response.ok;
    } catch (error) {
      console.warn('⚠️ 后端服务不可用');
      this.isBackendAvailable = false;
      return false;
    }
  }

  // 开始运动会话
  async startSession(
    sessionData: Omit<SportSessionData, 'end_time' | 'duration'>, 
    token: string
  ): Promise<{ sessionId: number }> {
    if (!token) {
      throw new Error('用户未登录，无法开始运动');
    }

    const response = await fetch(`${this.API_BASE}/sport/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(sessionData)
    });

    const result = await response.json();

    if (result.code === 200) {
      console.log('✅ 运动会话创建成功:', result.data);
      return result.data;
    } else {
      console.error('❌ 运动会话创建失败:', result.message);
      throw new Error(result.message);
    }
  }

  // 结束运动会话
  async endSession(
    sessionId: number, 
    endData: {
      end_time: string;
      calories: number;
      distance: number;
      steps: number;
    }, 
    tracks: GPSPoint[],
    token: string
  ): Promise<void> {
    if (!token) {
      throw new Error('用户未登录，无法结束运动');
    }

    const response = await fetch(`${this.API_BASE}/sport/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...endData,
        tracks
      })
    });

    const result = await response.json();

    if (result.code !== 200) {
      console.error('❌ 结束运动失败:', result.message);
      throw new Error(result.message);
    }

    console.log('✅ 运动数据保存成功');
  }

  // 记录GPS轨迹
  async recordGPSTracks(
    sessionId: number, 
    tracks: GPSPoint[], 
    token: string
  ): Promise<void> {
    if (!token) {
      throw new Error('用户未登录，无法记录轨迹');
    }

    const response = await fetch(`${this.API_BASE}/sport/sessions/${sessionId}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tracks })
    });

    const result = await response.json();

    if (result.code !== 200) {
      console.error('❌ 轨迹记录失败:', result.message);
      throw new Error(result.message);
    }
  }

  // 获取运动历史
  async getSportHistory(
    page: number = 1, 
    limit: number = 10, 
    token: string
  ): Promise<SportHistoryResponse> {
    // 检查后端是否可用
    if (!this.isBackendAvailable) {
      throw new Error('后端服务不可用，使用本地存储');
    }

    if (!token) {
      throw new Error('用户未登录，无法获取运动历史');
    }

    try {
      console.log('🔄 从后端获取运动历史，用户Token:', token ? '存在' : '不存在');
      
      const response = await fetch(`${this.API_BASE}/sport/sessions?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200) {
        console.log('✅ 获取运动历史成功，记录数:', result.data.items?.length || 0);
        return result.data;
      } else {
        console.error('❌ 获取运动历史失败:', result.message);
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('🚨 获取运动历史网络错误:', error);
      
      // 如果是网络错误，标记后端不可用
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        this.isBackendAvailable = false;
        throw new Error('后端服务不可用，使用本地存储');
      }
      
      throw error;
    }
  };
  // 在 SportService 类中添加删除方法
async deleteSession(sessionId: number, token: string): Promise<void> {
  if (!token) {
    throw new Error('用户未登录，无法删除记录');
  }

  console.log(`🗑️ 请求删除运动记录: ${sessionId}`);

  const response = await fetch(`${this.API_BASE}/sport/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const result = await response.json();

  if (result.code === 200) {
    console.log('✅ 运动记录删除成功');
    return;
  } else {
    console.error('❌ 删除运动记录失败:', result.message);
    throw new Error(result.message);
  }
}
}

export const sportService = new SportService();
    