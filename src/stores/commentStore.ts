import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './userStore'

export interface Comment {
  id: number
  userId: number
  shareId: number
  content: string
  timestamp: string
  user?: {
    id: number
    username: string
    avatar?: string
  }
}

export const useCommentStore = defineStore('comments', () => {
  const userStore = useUserStore()
  const comments = ref<Comment[]>([])

  // 添加评论
  const addComment = (shareId: number, content: string) => {
    const newComment: Comment = {
      id: Date.now(),
      userId: userStore.currentUser!.id,
      shareId,
      content,
      timestamp: new Date().toISOString(),
      user: {
        id: userStore.currentUser!.id,
        username: userStore.currentUser!.username,
        avatar: userStore.currentUser!.avatar
      }
    }
    
    comments.value.push(newComment)
    return newComment
  }

  // 获取某分享的评论
  const getCommentsByShareId = (shareId: number) => {
    return comments.value
      .filter(comment => comment.shareId === shareId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  return {
    comments,
    addComment,
    getCommentsByShareId
  }
})