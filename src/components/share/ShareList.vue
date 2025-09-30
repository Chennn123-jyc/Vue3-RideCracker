<template>
  <div class="share-list-container">
    <div class="share-list">
      <!-- 使用DynamicScroller替代RecycleScroller以支持动态高度 -->
      <DynamicScroller
        ref="dynamicScroller"
        v-if="props.shares.length"
        class="scroller"
        :items="props.shares"
        :min-item-size="200"  
        key-field="id"
        v-slot="{ item, active, index }"
      >
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[
            item.content, 
            item.images?.length, 
            item.tags?.length,
            item.music ? 1 : 0,
            item.video ? 1 : 0
          ]"
          :data-index="index"
        >
          <div 
            class="share-card"
            @click="$emit('view-detail', item)"
          >
            <!-- 卡片头部：用户信息和位置 -->
            <div class="card-header">
              <div class="user-info">
                <img 
                  :src="item.user.avatar || '/images/default-avatar.jpg'" 
                  alt="用户头像" 
                  class="avatar"
                >
                <div class="user-details">
                  <div class="username">{{ item.user.username }}</div>
                  <div class="timestamp">{{ formatDate(item.timestamp) }}</div>
                </div>
              </div>
              <div class="location-tag" v-if="item.location">
                <font-awesome-icon icon="map-marker-alt" />
                <span>{{ getLocationLabel(item.location) }}</span>
              </div>
            </div>
            
            <!-- 卡片内容：文本描述 -->
            <div class="card-content">
              <p>{{ item.content }}</p>
            </div>
            
            <!-- 多媒体内容预览区 -->
            <div v-if="hasMedia(item)" class="media-preview">
              <!-- 图片预览 -->
              <div v-if="item.images && item.images.length" class="image-preview">
                <img 
                  :src="item.images[0].url" 
                  :alt="item.images[0].caption || '分享图片'"
                  @click.stop="handleMediaClick(item, 'image', 0)"
                  class="preview-image"
                >
                <div v-if="item.images.length > 1" class="image-count">
                  +{{ item.images.length - 1 }}
                </div>
              </div>
              
              <!-- 音乐预览 -->
              <div v-if="item.music" class="music-preview" @click.stop="handleMediaClick(item, 'music')">
                <div class="music-icon">
                  <font-awesome-icon icon="music" />
                </div>
                <div class="music-info">
                  <div class="music-title">{{ item.music.title || '未知歌曲' }}</div>
                  <div class="music-artist">{{ item.music.artist || '未知艺术家' }}</div>
                </div>
              </div>
              
              <!-- 视频预览 -->
              <div v-if="item.video" class="video-preview" @click.stop="handleMediaClick(item, 'video')">
                <img 
                  :src="item.video.thumbnail || '/images/video-placeholder.jpg'" 
                  alt="视频预览图"
                  class="video-thumbnail"
                >
                <div class="video-play-button">
                  <font-awesome-icon icon="play" />
                </div>
                <div v-if="item.video.duration" class="video-duration">
                  {{ formatDuration(item.video.duration) }}
                </div>
              </div>
            </div>
            
            <!-- 卡片底部：标签和操作按钮 -->
            <div class="card-footer">
              <div class="tags-container" v-if="item.tags && item.tags.length">
                <span class="tag" v-for="(tag, index) in item.tags.slice(0, 3)" :key="index">
                  #{{ tag }}
                </span>
                <span v-if="item.tags.length > 3" class="tag-more">
                  +{{ item.tags.length - 3 }}更多
                </span>
              </div>
              
              <div class="card-actions">
                <button class="action-btn" @click.stop="toggleLike(item.id)">
                  <font-awesome-icon 
                    :icon="['fas', 'heart']" 
                    :class="{ 'liked': item.liked }" 
                  />
                  <span>{{ item.likes }}</span>
                </button>
                <button class="action-btn" @click.stop="focusCommentInput(item.id)">
                  <font-awesome-icon icon="comment" />
                  <span>{{ item.comments.length }}</span>
                </button>
                <button class="action-btn">
                  <font-awesome-icon icon="share" />
                </button>
              </div>
            </div>
            
            <!-- 评论区域 -->
            <div v-if="item.showComments" class="comments-section">
              <div class="comments-list">
                <div 
                  class="comment-item" 
                  v-for="(comment, cIndex) in item.comments" 
                  :key="cIndex"
                >
                  <span class="comment-username">{{ comment.user.username }}</span>
                  <span class="comment-content">{{ comment.content }}</span>
                </div>
              </div>
              <div class="comment-input-container">
                <input
                  type="text"
                  :id="`comment-input-${item.id}`"
                  v-model="newComments[item.id]"
                  placeholder="添加评论..."
                  @keyup.enter="handleCommentSubmit(item.id)"
                  class="comment-input"
                >
                <button 
                  @click="handleCommentSubmit(item.id)"
                  class="submit-comment"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </DynamicScrollerItem>
      </DynamicScroller>
      
      <!-- 空状态显示 -->
      <div v-else class="empty-state">
        <font-awesome-icon icon="share-alt" />
        <p>还没有分享内容</p>
        <p>成为第一个分享的人吧！</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// 定义数据类型接口
interface User {
  id: number;
  username: string;
  avatar?: string;
}

interface Comment {
  id: number;
  user: User;
  content: string;
  timestamp: string;
}

interface Image {
  url: string;
  caption?: string;
}

interface Music {
  id?: string;
  title?: string;
  artist?: string;
  url?: string;
}

interface Video {
  id?: string;
  url?: string;
  thumbnail?: string;
  duration?: number;
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
  showComments?: boolean;
}

// 定义组件Props
const props = defineProps<{
  shares: Share[];
  listKey?: number;
}>();

// 定义组件事件
const emit = defineEmits<{
  (e: 'like', shareId: number): void;
  (e: 'comment', shareId: number, content: string): void;
  (e: 'view-detail', share: Share): void;
  (e: 'media-click', share: Share, mediaType: string, index?: number): void;
}>();

// 评论输入框绑定值
const newComments = ref<Record<number, string>>({});
const dynamicScroller = ref<any>(null);

// 组件初始化
onMounted(() => {
  // 初始化评论输入框
  props.shares.forEach((share: Share) => {
    newComments.value[share.id] = '';
    if (share.showComments === undefined) {
      share.showComments = false;
    }
  });
});

// 监听分享数据变化，更新虚拟滚动
watch(() => props.shares, () => {
  nextTick(() => {
    if (dynamicScroller.value && typeof dynamicScroller.value.reset === 'function') {
      dynamicScroller.value.reset(); 
    }
  });
}, { deep: true });

// 检查是否有媒体内容
const hasMedia = (share: Share): boolean => {
  return !!(share.images && share.images.length) || !!share.music || !!share.video;
};

// 格式化日期显示
const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
  return `${Math.floor(diffInSeconds / 86400)}天前`;
};

// 格式化视频时长
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 获取位置标签显示文本
const getLocationLabel = (location: string) => {
  const locations: Record<string, string> = {
    'gym': '健身房',
    'park': '公园',
    'home': '家中',
    'outdoor': '户外',
    'studio': '工作室'
  };
  return locations[location] || location;
};

// 处理点赞
const toggleLike = (shareId: number) => {
  emit('like', shareId);
};

// 处理媒体点击
const handleMediaClick = (share: Share, mediaType: string, index?: number) => {
  emit('media-click', share, mediaType, index);
};

// 聚焦评论输入框
const focusCommentInput = (shareId: number) => {
  const share = props.shares.find((s: Share) => s.id === shareId);
  if (share) {
    share.showComments = true;
    nextTick(() => {
      const input = document.getElementById(`comment-input-${shareId}`);
      input?.focus();
    });
  }
};

// 提交评论
const handleCommentSubmit = (shareId: number) => {
  const content = newComments.value[shareId]?.trim();
  if (content) {
    emit('comment', shareId, content);
    newComments.value[shareId] = '';
  }
};
</script>

<style scoped>
.share-list-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.share-list {
  width: 100%;
}

.scroller {
  height: calc(100vh - 120px);
  width: 100%;
}

.share-card {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.share-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.timestamp {
  font-size: 12px;
  color: #888;
}

.location-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 12px;
}

.card-content {
  margin-bottom: 12px;
}

.card-content p {
  margin: 0;
  color: #333;
  line-height: 1.6;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.media-preview {
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 8px;
}

.image-count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.music-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.music-icon {
  width: 40px;
  height: 40px;
  background: #e0f2fe;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0ea5e9;
}

.music-info {
  flex: 1;
  overflow: hidden;
}

.music-title {
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-artist {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-preview {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.video-thumbnail {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.video-play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.video-duration {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 12px;
  color: #0ea5e9;
  background: #e0f2fe;
  padding: 2px 8px;
  border-radius: 4px;
}

.tag-more {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-actions {
  display: flex;
  gap: 20px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #0ea5e9;
}

.action-btn .liked {
  color: #ef4444;
}

.comments-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.comments-list {
  margin-bottom: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.comment-item {
  margin-bottom: 8px;
  font-size: 14px;
}

.comment-username {
  font-weight: 600;
  margin-right: 6px;
}

.comment-content {
  color: #444;
}

.comment-input-container {
  display: flex;
  gap: 8px;
}

.comment-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.comment-input:focus {
  border-color: #0ea5e9;
}

.submit-comment {
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-comment:hover {
  background: #0284c7;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #888;
  text-align: center;
}

.empty-state font-awesome-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ddd;
}

.empty-state p {
  margin: 4px 0;
}
</style>
