<template>
    <div class="public-share">
      <!-- 添加条件判断，避免在没有数据时渲染 -->
      <ShareList 
        v-if="filteredShares && filteredShares.length > 0"
        :shares="filteredShares"
        @like="handleLike"
        @comment="handleComment"
        @view-detail="handleViewDetail"
      />
      
      <!-- 添加空状态显示 -->
      <div v-else class="empty-state">
        <i class="fas fa-share-alt"></i>
        <p>还没有分享内容</p>
        <p>成为第一个分享的人吧！</p>
      </div>
      
      <ShareDetailModal 
        v-if="selectedShare"
        :share="selectedShare"
        @close="selectedShare = null"
        @like="handleLike"
        @comment="handleCommentWithContent"
      />
    </div>
</template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import ShareList from './ShareList.vue';
  import ShareDetailModal from './ShareDetailModal.vue';
  // 定义分享接口
  interface Share {
    id: number;
    user: {
      id: number;
      username: string;
      avatar?: string;
    };
    content: string;
    image?: string;
    location?: string;
    timestamp: string;
    likes: number;
    liked: boolean;
    comments: any[];
    category: string;
  }
  
  // 定义组件属性
  defineProps<{
  filteredShares: Share[]; 
}>();

  
  const emit = defineEmits<{
    (e: 'like', shareId: number): void;
    (e: 'comment', shareId: number, content?: string): void;
    (e: 'view-detail', share: Share): void;
  }>();
  
  const selectedShare = ref<Share | null>(null);
  
  const handleLike = (shareId: number) => {
    emit('like', shareId);
  };
  
  const handleComment = (shareId: number) => {
    emit('comment', shareId);
  };
  
  const handleCommentWithContent = (shareId: number, content: string) => {
    emit('comment', shareId, content);
  };
  
  const handleViewDetail = (share: Share) => {
    selectedShare.value = share;
    emit('view-detail', share);
  };
  </script>
  
  <style scoped>
  .public-share {
    padding: 16px 0;
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
  </style>