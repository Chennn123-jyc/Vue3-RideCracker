<template>
  <div class="music-view">
    <!-- 顶部状态栏，包裹在统一容器中 -->
    <div class="status-container">
      <router-view name="status"></router-view>
    </div>
    
    <MusicHeader title="正在播放" />
    
    <div class="content-container">
      <!-- 使用命名视图显示子路由组件 -->
      <router-view name="VinyRecord"
      :is-playing="isPlaying"
      :cover-url="musicStore.currentSong?.coverUrl||''"></router-view>
      <router-view name="info"></router-view>
      <router-view name="progress"></router-view>
      <router-view name="controls"></router-view>
      <router-view name="functions"></router-view>
      <router-view name="upload"></router-view>
    </div>
    
    <!-- 歌词页面（独立路由） -->
    <router-view name="lyrics"></router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useMusicStore } from '@/stores/musicStore';
import MusicHeader from '@/components/music/MusicHeader.vue';
import useAudioPlayer from '@/composables/useAudioPlayer';
import type { Song } from '@/types/music';  // 确保导入Song类型

// 获取音乐存储实例
const musicStore = useMusicStore();
// 通过storeToRefs解构响应式状态
const { isPlaying, currentSong } = storeToRefs(musicStore);  // 关键：获取currentSong
const player = useAudioPlayer();

// 动态加载歌曲
const songFiles = import.meta.glob('@/assets/music/*.mp3', { query: '?url', import: 'default' });

onMounted(async () => {
  // 只在第一次加载时初始化歌曲列表
  if (musicStore.playlist.length === 0) {
    const songs: Song[] = [];
    for (const path in songFiles) {
      const fileName = path.split('/').pop()?.replace('.mp3', '') || '未知歌曲';
      const url = await songFiles[path]();
      songs.push({
        id: `file-${Date.now()}-${fileName}`,
        title: fileName,
        artist: '未知艺术家',
        album: '本地歌曲',
        coverUrl: '/images/default-cover.png',
        url: url as string,
        duration: 0,
        lyrics: []
      });
    }
    musicStore.initPlaylist(songs);
  }
  
  // 只在需要时初始化播放器
  if (musicStore.playlist.length > 0 && !musicStore.currentSong) {
    musicStore.setCurrentSong(musicStore.playlist[0]);
  }
  
  // 同步音频状态（不需要延迟）
  if (musicStore.currentSong) {
    musicStore.syncAudioWithState();
  }
});
</script>



<style scoped>
.music-view {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, #1a0520, #2d0a31, #1a0520);
  color: #d8bfd8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  touch-action: pan-y;
  z-index: 10;
}

/* 新增：状态栏容器，确保两个界面样式一致 */
.status-container {
  width: 100%;
  box-sizing: border-box;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  overflow-y: auto;
  scrollbar-width: none;
  scrollbar-color: #b955d3 rgba(45, 10, 49, 0.5);
  scrollbar-width: none;
  -ms-overflow-style: none;
}


/* 自定义滚动条样式 */
.content-container::-webkit-scrollbar {
  display: none;
}

.content-container::-webkit-scrollbar-track {
  background: rgba(45, 10, 49, 0.5);
  border-radius: 3px;
}

.content-container::-webkit-scrollbar-thumb {
  background-color: #b955d3;
  border-radius: 3px;
}

/* 响应式调整 - 保持与运动界面一致的最大宽度 */
@media (min-width: 768px) {
  .music-view {
    max-width: 768px;
    margin: 0 auto;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
  }
}

/* 确保状态栏容器不受其他样式影响 */
::v-deep .header {
  width: 100% !important;
  margin: 0 !important;
  padding: 16px !important;
  box-sizing: border-box !important;
}
</style>
    