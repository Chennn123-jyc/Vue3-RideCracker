<template>
  <div class="lyrics-page">
    <!-- 顶部栏 -->
    <div class="lyrics-header">
      <h3 class="song-title">{{ currentSong?.title }}</h3>
      <button class="close-btn" @click="closeLyrics">
        <i class="fa fa-times"></i>
      </button>
    </div>

    <!-- 歌词内容 -->
    <div class="lyrics-container" ref="lyricsContainer">
      <div class="lyrics-content" :style="{ transform: `translateY(${offsetY}px)` }">
        <p 
          v-for="(lyric, index) in parsedLyrics" 
          :key="index"
          :class="{ active: index === currentLyricIndex }"
        >
          {{ lyric.text }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useMusicStore } from '@/stores/musicStore'
import { ref, onMounted, watch } from 'vue'

const router = useRouter()
const musicStore = useMusicStore()
const { currentSong, currentTime, parsedLyrics, currentLyricIndex } = storeToRefs(musicStore)

const lyricsContainer = ref<HTMLElement | null>(null)
const offsetY = ref(0)

// 关闭歌词页（返回主路由）
const closeLyrics = () => {
  router.push({ name: 'music-main' })
}

// 歌词滚动逻辑
const updateLyricsPosition = () => {
  if (!lyricsContainer.value || currentLyricIndex.value === -1) return
  
  // 让当前歌词居中显示
  const lineHeight = 40 // 每行歌词高度
  const containerHeight = lyricsContainer.value.clientHeight
  offsetY.value = (containerHeight / 2) - (currentLyricIndex.value * lineHeight)
}

// 监听歌词索引变化，更新位置
watch(currentLyricIndex, updateLyricsPosition)

// 初始化时计算位置
onMounted(() => {
  updateLyricsPosition()
})
</script>

<style scoped>
.lyrics-page {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 80vh;
  background-color: rgba(26, 5, 32, 0.98);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 20px;
  box-shadow: 0 -5px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
  animation: slideUp 0.4s ease-out forwards;
  box-sizing: border-box;

  touch-action: pan-y;
  overflow-x: hidden;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.lyrics-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 10px 0 20px;
  border-bottom: 1px solid rgba(138, 43, 226, 0.3);
}

.song-title {
  color: #fff;
  font-size: 18px;
  margin: 0;
}

.close-btn {
  position: absolute;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: #d8bfd8;
  font-size: 18px;
  cursor: pointer;
}

.lyrics-container {
  height: calc(100% - 80px);
  overflow: hidden;
  position: relative;
  margin-top: 20px;
}

.lyrics-content {
  transition: transform 0.3s ease-out;
  text-align: center;
  padding: 50px 0;
}

.lyrics-content p {
  color: #b088b6;
  margin: 8px 0;
  padding: 8px 0;
  font-size: 16px;
  transition: all 0.2s;
}

.lyrics-content p.active {
  color: #b955d3;
  font-size: 18px;
  font-weight: 500;
  transform: scale(1.05);
}
</style>
