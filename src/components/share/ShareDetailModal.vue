<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>笔记详情</h3>
        <button class="close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <!-- 用户信息 -->
        <div class="user-info">
          <img :src="share.user.avatar || '/default-avatar.png'" alt="用户头像" class="avatar">
          <div class="user-details">
            <div class="username">{{ share.user.username }}</div>
            <div class="timestamp">{{ formatDate(share.timestamp) }}</div>
          </div>
        </div>
        
        <!-- 内容 -->
        <div class="share-content">
          <p>{{ share.content }}</p>
        </div>
        
        <!-- 图片 -->
        <div v-if="share.image" class="share-image">
          <img :src="share.image" alt="分享图片">
        </div>
        
        <!-- 互动数据 -->
        <div class="interaction-stats">
          <span>{{ share.likes }} 点赞</span>
          <span>{{ share.comments.length }} 评论</span>
        </div>
        
        <!-- 操作区 -->
        <div class="action-buttons">
          <button class="action-btn" @click="$emit('like', share.id)">
            <i :class="['fas', 'fa-heart', { 'liked': share.liked }]"></i>
          </button>
          <button class="action-btn">
            <i class="fas fa-comment"></i>
          </button>
          <button class="action-btn">
            <i class="fas fa-share"></i>
          </button>
        </div>
        
        <!-- 评论区域 -->
        <div class="comments-section">
          <h4>评论</h4>
          <div class="comment-list">
            <div v-for="comment in share.comments" :key="comment.id" class="comment">
              <img :src="comment.user.avatar || '/default-avatar.png'" alt="评论者头像" class="comment-avatar">
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-username">{{ comment.user.username }}</span>
                  <span class="comment-time">{{ formatTime(comment.timestamp) }}</span>
                </div>
                <p>{{ comment.content }}</p>
              </div>
            </div>
            
            <div v-if="share.comments.length === 0" class="no-comments">
              暂无评论
            </div>
          </div>
          
          <!-- 添加评论 -->
          <div class="add-comment">
            <input 
              type="text" 
              v-model="newComment" 
              placeholder="添加评论..." 
              @keyup.enter="submitComment"
              class="comment-input"
            >
            <button 
              @click="submitComment" 
              :disabled="!newComment.trim()"
              class="comment-btn"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCommentStore } from '@/stores/commentStore'
import { computed, ref, defineProps } from 'vue'

const props = defineProps({
  share: {
    type: Object as () => { 
      id: number; 
      user: { username: string; avatar?: string }; 
      timestamp: string | number | Date;
      content: string; 
      image?: string; 
      likes: number; 
      comments: { 
        id: string; 
        user: { username: string; avatar?: string }; 
        timestamp: string | number | Date; 
        content: string 
      }[];
      liked: boolean;
    },
    required: true
  }
})

const commentStore = useCommentStore()
const newComment = ref('')

const shareComments = computed(() => {
  return commentStore.getCommentsByShareId(props.share.id)
})

const submitComment = () => {
  if (newComment.value.trim()) {
    commentStore.addComment(props.share.id, newComment.value.trim())
    newComment.value = ''
  }
}


// 日期格式化工具函数
const formatDate = (timestamp: string | number | Date) => {
  // 直接创建 Date 对象，它能处理所有三种类型
  const date = new Date(timestamp);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return "无效日期";
  }
  
  return date.toLocaleDateString();
};

// 时间格式化工具函数
const formatTime = (timestamp: string | number | Date) => {
  // 直接创建 Date 对象，它能处理所有三种类型
  const date = new Date(timestamp);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return "无效时间";
  }
  
  return date.toLocaleTimeString();
};
</script>

<style scoped>
/* 样式部分保持不变 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 10;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
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
}

.user-details .timestamp {
  font-size: 12px;
  color: #999;
}

.share-content {
  margin-bottom: 16px;
}

.share-content p {
  margin: 0;
  color: #333;
  line-height: 1.6;
}

.share-image {
  margin-bottom: 16px;
}

.share-image img {
  width: 100%;
  border-radius: 8px;
  max-height: 300px;
  object-fit: cover;
}

.interaction-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.action-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #06B6D4;
}

.action-btn .fa-heart.liked {
  color: #ff2e4d;
}

.comments-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.comment {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex-grow: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-username {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-content p {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.no-comments {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.add-comment {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.comment-input {
  flex-grow: 1;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 8px 16px;
  outline: none;
}

.comment-input:focus {
  border-color: #06B6D4;
}

.comment-btn {
  background-color: #06B6D4;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.comment-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>