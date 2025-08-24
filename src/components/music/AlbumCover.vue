<template>
  <div class="album-cover-container" @click="toggleCoverLyrics">
    <!-- 使用过渡动画 -->
    <transition :name="transitionName" mode="out-in">
      <!-- 封面模式 -->
      <div class="vinyl" :class="{ playing: isPlaying }" v-if="!showLyricsMode" key="cover">
        <!-- ... 封面内容 ... -->
      </div>
      
      <!-- 歌词预览模式 -->
      <div class="lyrics-preview" v-else key="lyrics">
        <!-- ... 歌词内容 ... -->
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMusicStore } from '@/stores/musicStore'
import { computed, ref, watch } from 'vue'
import type { Song } from '@/types/music';

// 定义歌词类型
interface ParsedLyric {
  time: number;
  text: string;
}

const musicStore = useMusicStore();

// 直接从 storeToRefs 获取响应式引用
const { 
  currentSong, 
  isPlaying, 
  showCoverLyricsMode, 
  currentLyricIndex,
  parsedLyrics,
  progressPercentage
} = storeToRefs(musicStore);

// 处理封面图路径
const coverUrl = computed(() => {
  return currentSong.value?.coverUrl || '/images/default-cover.jpg';
});

// 歌词模式状态
const showLyricsMode = computed(() => showCoverLyricsMode.value);

// 切换封面/歌词显示模式
const toggleCoverLyrics = () => {
  musicStore.toggleCoverLyricsMode();
};

// 添加歌词动画相关逻辑
const visibleLyrics = ref<ParsedLyric[]>([]);
const currentVisibleIndex = ref(0);

//添加切换动画
const transitionName = ref('cover-to-lyrics');

watch(showLyricsMode, (newVal) => {
  transitionName.value = newVal ? 'cover-to-lyrics' : 'lyrics-to-cover';
});


watch(currentLyricIndex, (newIndex) => {
  if (newIndex === -1) {
    visibleLyrics.value = [];
    return;
  }
  
  // 获取当前歌词及前后各2行
  const start = Math.max(0, newIndex - 2);
  const end = Math.min(parsedLyrics.value.length, newIndex + 3);
  
  visibleLyrics.value = parsedLyrics.value.slice(start, end);
  currentVisibleIndex.value = newIndex - start;
});

const currentLyricLine = computed(() => {
  return musicStore.currentLyricLine;
});
</script>

<style scoped>
/* 保留所有样式不变 */
.album-cover-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  cursor: pointer;
}

.vinyl {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  position: relative;
  background: radial-gradient(circle, #333 0%, #000 70%);
  box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-img {
  width: 70%;
  height: 70%;
  border-radius: 50%;
  object-fit: cover;
}

.placeholder {
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background-color: #444;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 48px;
}

.center-dot {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #ddd;
  z-index: 10;
}

.playing {
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 歌词预览容器样式 */
.lyrics-preview {
  width: 280px;
  height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  color: #fff;
  padding: 30px;
  box-shadow: 0 0 30px rgba(185, 85, 211, 0.5);
  position: relative;
  overflow: hidden;
}

.lyrics-content {
  text-align: center;
  z-index: 2;
}

.current-lyric {
  font-size: 22px;
  font-weight: 500;
  line-height: 1.4;
  margin-bottom: 25px;
  text-shadow: 0 0 10px rgba(185, 85, 211, 0.8);
  animation: lyric-pulse 3s ease-in-out infinite;
}

.progress-container {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #b955d3, #8a2be2);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 添加背景模糊层 */
.lyrics-preview::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  filter: blur(15px);
  z-index: 1;
}

/* 添加歌词动画 */
@keyframes lyric-pulse {
  0% { opacity: 0.8; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0.8; transform: scale(0.98); }
}
</style>