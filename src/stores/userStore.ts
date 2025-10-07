import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  createdAt: string
}

// 后端返回的用户信息类型
interface ApiUser {
  id: number
  username: string
  email: string
  avatar?: string
  created_at: string
  updated_at: string
}

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const isLoggedIn = ref(false)
  const token = ref<string | null>(null)

  // 后端 API 基础 URL
  const API_BASE = 'http://localhost:3000/api'

  // 注册功能 - 连接到后端
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })

      const result = await response.json()

      if (result.code === 201) {
        console.log('注册成功:', result)
        // 注册成功后自动登录
        return await login(email, password)
      } else {
        console.error('注册失败:', result.message)
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('注册请求错误:', error)
      throw error
    }
  }

  // 登录功能 - 连接到后端
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const result = await response.json()

      if (result.code === 200) {
        const { token: newToken, user } = result.data
        
        // 存储 token 和用户信息
        token.value = newToken
        currentUser.value = {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.created_at
        }
        isLoggedIn.value = true
        
        // 保存到 localStorage
        localStorage.setItem('token', newToken)
        localStorage.setItem('user', JSON.stringify(currentUser.value))
        
        console.log('登录成功:', user)
        return true
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // 退出登录
  const logout = () => {
    currentUser.value = null
    isLoggedIn.value = false
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // 获取当前用户信息
  const getCurrentUser = async (): Promise<boolean> => {
    try {
      const savedToken = localStorage.getItem('token')
      if (!savedToken) {
        return false
      }

      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${savedToken}`,
        },
      })

      const result = await response.json()

      if (result.code === 200) {
        const user = result.data
        currentUser.value = {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.created_at
        }
        isLoggedIn.value = true
        token.value = savedToken
        return true
      } else {
        // token 无效，清除存储
        logout()
        return false
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      logout()
      return false
    }
  }

  // 初始化 - 恢复登录状态
  const init = async () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      try {
        // 验证 token 是否仍然有效
        await getCurrentUser()
      } catch (error) {
        console.error('初始化登录状态失败:', error)
        logout()
      }
    }
  }

 // 在 userStore.ts 中修改 updateAvatar 方法
const updateAvatar = async (avatarData: FormData | string): Promise<void> => {
  if (!currentUser.value || !token.value) {
    throw new Error('用户未登录');
  }

  try {
    let response: Response;

    if (avatarData instanceof FormData) {
      // 文件上传
      response = await fetch(`${API_BASE}/auth/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          // 不要设置 Content-Type，让浏览器自动设置 multipart/form-data
        },
        body: avatarData,
      });
    } else {
      // URL 更新（保持向后兼容）
      response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`,
        },
        body: JSON.stringify({
          avatar: avatarData,
        }),
      });
    }

    const result = await response.json();

    if (result.code === 200) {
      // 更新本地用户信息
      if (currentUser.value) {
        currentUser.value.avatar = result.data.avatar || avatarData;
        localStorage.setItem('user', JSON.stringify(currentUser.value));
      }
      return;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('更新头像失败:', error);
    throw error;
  }
};

  return {
    currentUser,
    isLoggedIn,
    token,
    init,
    login,
    register,
    logout,
    getCurrentUser,
    updateAvatar
  }
})