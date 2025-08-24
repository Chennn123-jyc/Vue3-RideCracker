<template>
  <div class="function-bar">
    <button class="func-btn" @click="toggleLike">
      <i class="fa fa-heart" :class="{ active: isLiked }"></i>
      <span>喜欢</span>
    </button>
    <button class="func-btn" @click="goToLyrics">
      <i class="fa fa-align-left" :class="{ active: isLyricsActive }"></i>
      <span>歌词</span>
    </button>
    <button class="func-btn" @click="toggleDownload">
      <i class="fa fa-download"></i>
      <span>下载</span>
    </button>
    <button class="func-btn" @click="showPlaylistModal = true">
      <i class="fa fa-list"></i>
      <span>歌单</span>
    </button>
    
    <!-- 歌单弹窗组件 -->
    <PlaylistModal 
      v-if="showPlaylistModal" 
      @close="showPlaylistModal = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import PlaylistModal from '@/components/music/PlayModal.vue'

const router = useRouter()
const musicStore = useMusicStore()
const showPlaylistModal = ref(false) // 控制歌单弹窗显示

// 本地状态
const isLiked = ref(false)

// 判断当前是否在歌词路由
const isLyricsActive = computed(() => {
  return router.currentRoute.value.name === 'music-lyrics'
})

// 切换喜欢状态
const toggleLike = () => {
  isLiked.value = !isLiked.value
}

// 跳转到歌词子路由
const goToLyrics = () => {
  router.push({ name: 'music-lyrics' })
}

// 模拟下载
const toggleDownload = () => {
  musicStore.downloadCurrentSong();
};
</script>

<style scoped>
.function-bar {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 10px 0 30px;
  position: relative;
}

.func-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  color: #b088b6;
  font-size: 14px;
  cursor: pointer;
}

.func-btn i {
  font-size: 22px;
  transition: all 0.2s;
}

.func-btn:hover i {
  color: #d8bfd8;
}

.func-btn .active {
  color: #b955d3;
}

@media (max-width: 480px) {
  .function-bar {
    gap: 20px;
  }
  
  .func-btn span {
    font-size: 12px;
  }
}
</style>