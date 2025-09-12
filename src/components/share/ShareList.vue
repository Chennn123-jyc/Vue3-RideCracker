<template>
  <div class="share-list" :key="listKey">
    <div v-if="shares.length === 0" class="empty-state">
      <i class="fas fa-share-alt"></i>
      <p>还没有分享内容</p>
      <p>成为第一个分享的人吧！</p>
    </div>
    
    <div v-else class="shares-container">
      <div 
        v-for="share in shares" 
        :key="share.id" 
        class="share-card"
        @click="$emit('view-detail', share)"
      >
        <!-- 用户信息 -->
        <div class="card-header">
          <div class="user-info">
            <img 
              :src="share.user.avatar || '/default-avatar.png'" 
              alt="用户头像" 
              class="avatar"
            >
            <div class="user-details">
              <div class="username">{{ share.user.username }}</div>
              <div class="timestamp">{{ formatDate(share.timestamp) }}</div>
            </div>
          </div>
          <div class="location-tag" v-if="share.location">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ getLocationLabel(share.location) }}</span>
          </div>
        </div>
        
        <!-- 内容 -->
        <div class="card-content">
          <p>{{ share.content }}</p>
        </div>
        
        <!-- 图片 -->
        <div v-if="share.image" class="card-image">
          <img :src="share.image" alt="分享图片" @click.stop="$emit('view-detail', share)">
        </div>
        
        <!-- 操作区 -->
        <div class="card-actions">
          <button class="action-btn" @click.stop="$emit('like', share.id)">
            <i :class="['fas', 'fa-heart', { 'liked': share.liked }]"></i>
            <span>{{ share.likes }}</span>
          </button>
          <button class="action-btn" @click.stop="$emit('comment', share.id)">
            <i class="fas fa-comment"></i>
            <span>{{ share.comments.length }}</span>
          </button>
          <button class="action-btn">
            <i class="fas fa-share"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'like', shareId: number): void,
  (e: 'comment', shareId: number): void, 
  (e: 'view-detail', share: any): void
}>()

// 修改评论提交逻辑
const submitComment = (shareId: number) => {
  const commentContent = newComments.value[shareId]?.trim()
  
  if (commentContent) {
    emit('comment', shareId)
    newComments.value[shareId] = ''
  }
}

defineProps<{
  shares: any[],
  listKey?: number
}>()

interface User {
  id: number
  username: string
  avatar?: string
}

interface Comment {
  id: number
  user: User
  content: string
  timestamp: string
}

interface Share {
  id: number
  user: User
  content: string
  image?: string
  location?: string
  timestamp: string
  likes: number
  liked: boolean
  comments: Comment[]
  showComments?: boolean
}

// 模拟数据 - 实际应用中应从API获取
const shares = ref<Share[]>([
  {
    id: 1,
    user: {
      id: 1,
      username: "运动达人",
      avatar: "/avatar1.jpg"
    },
    content: "今天完成了10公里跑步，感觉太棒了！继续坚持！💪",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 15,
    liked: false,
    comments: [
      {
        id: 1,
        user: {
          id: 2,
          username: "健身小白",
          avatar: "/avatar2.jpg"
        },
        content: "太厉害了！向你学习！",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 2,
    user: {
      id: 3,
      username: "音乐爱好者",
      avatar: "/avatar3.jpg"
    },
    content: "发现了一首超级适合运动的歌曲，节奏感超强！推荐给大家！",
    image: "/music-cover.jpg",
    location: "gym",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: 8,
    liked: true,
    comments: []
  }
])

const newComments = ref<Record<number, string>>({})

onMounted(() => {
  // 初始化每个分享的新评论对象
  shares.value.forEach(share => {
    newComments.value[share.id] = ''
  })
})

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return '刚刚'
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`
  } else {
    return `${Math.floor(diffInHours / 24)}天前`
  }
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const getLocationLabel = (location: string) => {
  const locations: Record<string, string> = {
    'gym': '健身房',
    'park': '公园',
    'home': '家中',
    'outdoor': '户外'
  }
  return locations[location] || location
}

const toggleLike = (shareId: number) => {
  const share = shares.value.find(s => s.id === shareId)
  if (share) {
    share.liked = !share.liked
    share.likes += share.liked ? 1 : -1
  }
}

const focusCommentInput = (shareId: number) => {
  const share = shares.value.find(s => s.id === shareId)
  if (share) {
    share.showComments = !share.showComments
  }
}

const addComment = (shareId: number) => {
  const share = shares.value.find(s => s.id === shareId)
  const commentContent = newComments.value[shareId]?.trim()
  
  if (share && commentContent) {
    // 这里模拟新评论
    const newComment: Comment = {
      id: Date.now(),
      user: {
        id: 4, // 当前用户ID，实际应用中应从用户状态获取
        username: "我",
        avatar: "/my-avatar.jpg"
      },
      content: commentContent,
      timestamp: new Date().toISOString()
    }
    
    share.comments.push(newComment)
    newComments.value[shareId] = ''
  }
}
</script>

<style scoped>
.share-list {
  padding-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
  color: #ccc;
}

.empty-state p {
  margin: 8px 0;
  font-size: 16px;
}

.shares-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.share-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.share-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 16px 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details .username {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.user-details .timestamp {
  font-size: 12px;
  color: #999;
}

.location-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #06B6D4;
  background-color: rgba(6, 182, 212, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
}

.card-content {
  padding: 0 16px 12px;
}

.card-content p {
  margin: 0;
  color: #333;
  line-height: 1.5;
  font-size: 14px;
  display: -webkit-box;
  display: box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  box-orient: vertical;
  overflow: hidden;
}

.card-image {
  width: 100%;
  margin-bottom: 12px;
}

.card-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.card-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #f0f0f0;
  padding: 12px 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;
  font-size: 14px;
}

.action-btn:hover {
  color: #06B6D4;
}

.action-btn .fa-heart.liked {
  color: #ff2e4d;
}

@media (max-width: 480px) {
  .shares-container {
    grid-template-columns: 1fr;
  }
}
</style>
