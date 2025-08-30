import { defineStore } from 'pinia'
import { ref } from 'vue' // 移除 onMounted 导入
import usersData from '@/data/users.json'

export interface User {
  id: number
  username: string
  email: string
  password: string
  avatar?: string
  createdAt: string
}

// 定义本地存储的用户信息类型（不包含敏感信息）
interface StoredUser {
  id: number
  email: string
  username: string
}

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const isLoggedIn = ref(false)
  const users = ref<User[]>([])

  // 从本地存储加载用户数据
  const loadUsersFromStorage = (): User[] => {
    try {
      const storedUsers = localStorage.getItem('users')
      if (storedUsers) {
        return JSON.parse(storedUsers) as User[]
      }
      // 本地存储没有数据时使用初始数据
      return usersData.users as User[]
    } catch (error) {
      console.error('Failed to load users from storage:', error)
      return usersData.users as User[]
    }
  }

  // 登录功能 - 增强类型和错误处理
  const login = (email: string, password: string): boolean => {
    const user = users.value.find(u => u.email === email && u.password === password)
    if (user) {
      // 过滤敏感信息后存储
      const userToStore: StoredUser = {
        id: user.id,
        email: user.email,
        username: user.username
      }
      
      currentUser.value = { ...user }
      isLoggedIn.value = true
      localStorage.setItem('user', JSON.stringify(userToStore))
      return true
    }
    return false
  }

  // 注册功能 - 修复数据持久化逻辑
  const register = (username: string, email: string, password: string): boolean => {
    if (users.value.some(u => u.email === email)) {
      return false
    }
    
    const newUser: User = {
      id: users.value.length > 0 
        ? Math.max(...users.value.map(u => u.id)) + 1 
        : 1, // 更安全的ID生成方式
      username,
      email,
      password,
      createdAt: new Date().toISOString()
    }
    
    users.value.push(newUser)
    localStorage.setItem('users', JSON.stringify(users.value))
    return login(email, password)
  }

  // 退出登录
  const logout = () => {
    currentUser.value = null
    isLoggedIn.value = false
    localStorage.removeItem('user')
  }

  // 初始化 - 需要外部调用
  const init = () => {
    // 先加载所有用户数据
    users.value = loadUsersFromStorage()
    
    // 再恢复登录状态
    try {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const userData = JSON.parse(savedUser) as StoredUser
        const user = users.value.find(u => u.id === userData.id)
        if (user) {
          currentUser.value = { ...user }
          isLoggedIn.value = true
        }
      }
    } catch (error) {
      console.error('Failed to initialize user session:', error)
      localStorage.removeItem('user') // 清除损坏的会话数据
    }
  }

  // 更新用户头像
  const updateAvatar = (avatarUrl: string) => {
    if (currentUser.value) {
      currentUser.value.avatar = avatarUrl
      
      const userIndex = users.value.findIndex(u => u.id === currentUser.value!.id)
      if (userIndex !== -1) {
        users.value[userIndex].avatar = avatarUrl
        localStorage.setItem('users', JSON.stringify(users.value))
      }
    }
  }

  // 移除 onMounted(init) 调用

  return {
    currentUser,
    isLoggedIn,
    users,
    init, // 确保导出 init 方法
    login,
    register,
    logout,
    updateAvatar
  }
})