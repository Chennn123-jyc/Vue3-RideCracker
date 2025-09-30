<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>分享详情</h3>
        <button class="close-btn" @click="$emit('close')">
          <font-awesome-icon icon="times" />
        </button>
      </div>
      
      <div class="modal-body">
        <!-- 用户信息 -->
        <div class="user-info">
          <img :src="share.user.avatar || '/images/default-avatar.jpg'" 
          alt="用户头像" 
          class="avatar">
          <div class="user-details">
            <div class="username">{{ share.user.username }}</div>
            <div class="timestamp">{{ formatDate(share.timestamp) }}</div>
          </div>
        </div>
        
        <!-- 内容 -->
        <div class="share-content">
          <p>{{ share.content }}</p>
        </div>
        
        <!-- 多媒体内容展示 -->
        <div v-if="hasMedia" class="media-content">
          <!-- 图片展示 -->
          <div v-if="share.images && share.images.length" class="images-container">
            <h4>图片</h4>
            <div class="images-grid" :class="{'single-image': share.images.length === 1}">
              <div 
                v-for="(image, index) in share.images" 
                :key="index" 
                class="image-item"
              >
                <img 
                  :src="image.url" 
                  :alt="image.caption || '分享图片'"
                  @click="openImageLightbox(index)"
                >
                <div v-if="image.caption" class="image-caption">{{ image.caption }}</div>
              </div>
            </div>
          </div>
          
          <!-- 音乐播放器 -->
          <div v-if="share.music" class="music-player">
            <h4>音乐</h4>
            <div class="player-container">
              <div class="music-info">
                <div class="music-cover">
                  <font-awesome-icon icon="music" />
                </div>
                <div class="music-details">
                  <div class="music-title">{{ share.music.title || '未知歌曲' }}</div>
                  <div class="music-artist">{{ share.music.artist || '未知艺术家' }}</div>
                  <div v-if="share.music.duration" class="music-duration">
                    时长: {{ formatDuration(share.music.duration) }}
                  </div>
                </div>
              </div>
              <audio 
                ref="audioPlayer"
                :src="share.music.url" 
                controls
                class="audio-controls"
              ></audio>
            </div>
          </div>
          
          <!-- 视频播放器 -->
          <div v-if="share.video" class="video-player">
            <h4>视频</h4>
            <div class="video-container">
              <video 
                ref="videoPlayer"
                :src="share.video.url" 
                controls
                :poster="share.video.thumbnail || '/images/video-placeholder.jpg'"
                class="video-element"
              ></video>
              <div class="video-info">
                <div class="video-title">{{ share.video.title || '分享视频' }}</div>
                <div v-if="share.video.duration" class="video-duration">
                  时长: {{ formatDuration(share.video.duration) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 位置信息 -->
        <div v-if="share.location" class="location-info">
          <font-awesome-icon icon="map-marker-alt" />
          <span>{{ getLocationLabel(share.location) }}</span>
        </div>
        
        <!-- 标签 -->
        <div v-if="share.tags && share.tags.length" class="tags-container">
          <span class="tag" v-for="(tag, index) in share.tags" :key="index">
            #{{ tag }}
          </span>
        </div>
        
        <!-- 互动数据 -->
        <div class="interaction-stats">
          <span>{{ share.likes }} 点赞</span>
          <span>{{ share.comments.length }} 评论</span>
          <span v-if="share.views">{{ share.views }} 浏览</span>
        </div>
        
        <!-- 操作区 -->
        <div class="action-buttons">
          <button class="action-btn" @click="$emit('like', share.id)">
            <font-awesome-icon :icon="['fas', 'heart']" :class="{ 'liked': share.liked }" />
          </button>
          <button class="action-btn">
            <font-awesome-icon icon="comment" />
          </button>
          <button class="action-btn">
            <font-awesome-icon icon="share" />
          </button>
        </div>
        
        <!-- 评论区域 -->
        <div class="comments-section">
          <h4>评论</h4>
          <div class="comment-list">
            <div v-for="comment in share.comments" :key="comment.id" class="comment">
              <img :src="comment.user.avatar || '/images/default-avatar.jpg'" 
              alt="评论者头像" 
              class="comment-avatar">
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
import { ref, computed, watch } from 'vue'

// 定义媒体类型接口
interface Image {
  url: string;
  caption?: string;
}

interface Music {
  url: string;
  type: string;
  title?: string;
  artist?: string;
  duration?: number;
}

interface Video {
  url: string;
  type: string;
  thumbnail?: string;
  title?: string;
  duration?: number;
}

interface User {
  id: number;
  username: string;
  avatar?: string;
  verified?: boolean;
}

interface Comment {
  id?: number;
  user: User;
  content: string;
  timestamp: string;
  likes?: number;
  liked?: boolean;
}

interface Share {
  id: number;
  user: User;
  content: string;
  timestamp: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
  category: string;
  images?: Image[];
  music?: Music;
  video?: Video;
  location?: string;
  tags?: string[];
  views?: number;
}

const props = defineProps<{
  share: Share
}>()

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'like', shareId: number): void;
  (e: 'comment', shareId: number, content: string): void;
}>()

const newComment = ref('')
const audioPlayer = ref<HTMLAudioElement | null>(null)
const videoPlayer = ref<HTMLVideoElement | null>(null)

// 检查是否有媒体内容
const hasMedia = computed(() => {
  return !!(props.share.images && props.share.images.length) || 
         !!props.share.music || 
         !!props.share.video
})

// 格式化日期
const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return "无效日期";
  }
  return date.toLocaleDateString();
};

// 格式化时间
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return "无效时间";
  }
  return date.toLocaleTimeString();
};

// 格式化时长
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 格式化位置显示
const getLocationLabel = (location: string) => {
  const locations: Record<string, string> = {
    'gym': '健身房',
    'park': '公园',
    'home': '家中',
    'outdoor': '户外'
  };
  return locations[location] || location;
};

// 打开图片灯箱
const openImageLightbox = (index: number) => {
  // 这里可以实现图片灯箱功能
  console.log('打开图片灯箱，索引:', index);
};

// 提交评论
const submitComment = () => {
  if (newComment.value.trim()) {
    emit('comment', props.share.id, newComment.value.trim())
    newComment.value = ''
  }
}

// 监听模态框关闭，暂停媒体播放
watch(() => props.share, () => {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
  }
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
})
</script>

<style scoped>
/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(31, 17, 61, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: #52307c;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(82, 48, 124, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #7a57a7;
  position: sticky;
  top: 0;
  background-color: #52307c;
  z-index: 10;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #f0f0f0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #c0c0c0;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ffffff;
}

.modal-body {
  padding: 16px;
  background-color: #52307c;
}

/* 用户信息 */
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
  border: 1px solid #7a57a7;
}

.user-details .username {
  font-weight: 600;
  color: #f0f0f0;
}

.user-details .timestamp {
  font-size: 12px;
  color: #c0c0c0;
}

/* 内容 */
.share-content {
  margin-bottom: 16px;
}

.share-content p {
  margin: 0;
  color: #f0f0f0;
  line-height: 1.7;
}

/* 多媒体内容 */
.media-content {
  margin-bottom: 16px;
}

.media-content h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #f0f0f0;
}

/* 图片展示 */
.images-container {
  margin-bottom: 20px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.images-grid.single-image {
  grid-template-columns: 1fr;
}

.image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s;
}

.image-item img:hover {
  transform: scale(1.05);
}

.image-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  font-size: 12px;
}

/* 音乐播放器 */
.music-player {
  margin-bottom: 20px;
}

.player-container {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 12px;
}

.music-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.music-cover {
  width: 60px;
  height: 60px;
  background-color: rgba(162, 119, 227, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #a277e3;
}

.music-details {
  flex: 1;
}

.music-title {
  font-weight: 600;
  font-size: 16px;
  color: #f0f0f0;
  margin-bottom: 4px;
}

.music-artist {
  font-size: 14px;
  color: #c0c0c0;
  margin-bottom: 4px;
}

.music-duration {
  font-size: 12px;
  color: #a0a0a0;
}

.audio-controls {
  width: 100%;
  height: 32px;
}

/* 视频播放器 */
.video-player {
  margin-bottom: 20px;
}

.video-container {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
}

.video-element {
  width: 100%;
  max-height: 300px;
  background-color: #000;
}

.video-info {
  padding: 12px;
}

.video-title {
  font-weight: 600;
  font-size: 16px;
  color: #f0f0f0;
  margin-bottom: 4px;
}

.video-duration {
  font-size: 12px;
  color: #a0a0a0;
}

/* 位置信息 */
.location-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #c0c0c0;
}

/* 标签容器 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.tag {
  background-color: rgba(162, 119, 227, 0.2);
  color: #a277e3;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

/* 互动数据 */
.interaction-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #c0c0c0;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid #7a57a7;
  border-bottom: 1px solid #7a57a7;
  margin-bottom: 16px;
}

.action-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #c0c0c0;
  cursor: pointer;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #a277e3;
}

.action-btn .fa-heart.liked {
  color: #ff2e4d;
}

/* 评论区 */
.comments-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #f0f0f0;
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
  border: 1px solid #7a57a7;
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
  color: #f0f0f0;
}

.comment-time {
  font-size: 12px;
  color: #c0c0c0;
}

.comment-content p {
  margin: 0;
  font-size: 14px;
  color: #f0f0f0;
  line-height: 1.6;
}

.no-comments {
  text-align: center;
  color: #c0c0c0;
  padding: 20px 0;
  font-size: 14px;
}

/* 添加评论 */
.add-comment {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #7a57a7;
}

.comment-input {
  flex-grow: 1;
  background-color: #4a2a72;
  border: 1px solid #7a57a7;
  border-radius: 20px;
  padding: 8px 16px;
  outline: none;
  color: #f0f0f0;
  font-size: 14px;
}

.comment-input::placeholder {
  color: #a0a0a0;
}

.comment-input:focus {
  border-color: #a277e3;
  box-shadow: 0 0 0 2px rgba(162, 119, 227, 0.2);
}

.comment-btn {
  background-color: #a277e3;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
}

.comment-btn:disabled {
  background-color: #7a57a7;
  cursor: not-allowed;
  color: #c0c0c0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
    border-radius: 0;
    max-height: 100vh;
  }
  
  .images-grid {
    grid-template-columns: 1fr;
  }
  
  .music-info {
    flex-direction: column;
    text-align: center;
  }
}
</style>