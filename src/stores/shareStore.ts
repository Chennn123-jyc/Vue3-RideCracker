// stores/shareStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Share {
  id: number
  userId: number
  content: string
  image?: string
  location?: string
  category: string
  timestamp: string
  likes: number
  liked: boolean
  user?: {
    id: number
    username: string
    avatar?: string
  }
  comments: any[]; // 新增：匹配模拟数据中的 comments 数组
}

export const useShareStore = defineStore('shares', () => {
  const shares = ref<Share[]>([])

  // 获取所有分享
  const fetchShares = async () => {
    // API调用获取分享数据
  }

  // 添加分享
  const addShare = (share: Omit<Share, 'id'>) => {
    const newShare: Share = {
      id: Date.now(),
      ...share
    }
    shares.value.unshift(newShare)
    return newShare
  }

  // 点赞/取消点赞
  const toggleLike = (shareId: number) => {
    const share = shares.value.find(s => s.id === shareId)
    if (share) {
      share.liked = !share.liked
      share.likes += share.liked ? 1 : -1
    }
  }

  return {
    shares,
    fetchShares,
    addShare,
    toggleLike
  }
})