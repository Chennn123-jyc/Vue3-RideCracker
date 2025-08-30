<template>
  <div 
    class="lyrics-page" 
    :style="{ 
      transform: isDragging ? `translateY(${dragOffset}px)` : '',
      opacity: isDragging ? dragOpacity : 1
    }"
  >
    <!-- 拖动把手 -->
    <div class="drag-handle" 
         @touchstart="startDrag" 
         @mousedown="startDrag"
         @touchend="endDrag"
         @mouseup="endDrag"
         @touchmove="onDrag"
         @mousemove="onDrag">
    </div>
    
    <!-- 背景模糊效果 -->
    <div class="background-blur"></div>
    
    <!-- 顶部栏 -->
    <div class="lyrics-header">
      <div class="song-info">
        <h3 class="song-title">{{ currentSong?.title }}</h3>
        <p class="song-artist">{{ currentSong?.artist }}</p>
      </div>
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
          :data-index="index"
        >
          {{ lyric.text }}
        </p>
      </div>
    </div>
    
    <!-- 底部音乐控制栏 -->
    <div class="music-controls">
      <button class="control-btn" @click="prevSong">
        <i class="fa fa-backward"></i>
      </button>
      <button class="control-btn play-pause-btn" @click="togglePlayPause">
        <i class="fa" :class="isPlaying ? 'fa-pause' : 'fa-play'"></i>
      </button>
      <button class="control-btn" @click="nextSong">
        <i class="fa fa-forward"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useMusicStore } from '@/stores/musicStore'
import { ref, onMounted, watch, nextTick } from 'vue'

const router = useRouter()
const musicStore = useMusicStore()
const { 
  currentSong, 
  currentTime, 
  parsedLyrics, 
  currentLyricIndex,
  isPlaying
} = storeToRefs(musicStore)

// 歌词容器和滚动偏移
const lyricsContainer = ref<HTMLElement | null>(null)
const offsetY = ref(0)

// 拖动相关变量
const isDragging = ref(false)
const startY = ref(0)
const dragOffset = ref(0)
const dragOpacity = ref(1)
const initialPosition = 0

// 关闭歌词页（返回主路由）
const closeLyrics = () => {
  const lyricsPage = document.querySelector('.lyrics-page') as HTMLElement | null;
  if (lyricsPage) {
    lyricsPage.style.transform = 'translateY(100%)';
    lyricsPage.style.opacity = '0';
    
    setTimeout(() => {
      router.push({ name: 'music-main' });
    }, 300);
  }
};

// 控制音乐播放暂停
const togglePlayPause = () => {
  musicStore.togglePlayPause()
}

// 上一首/下一首
const prevSong = () => {
  musicStore.prevSong()
}

const nextSong = () => {
  musicStore.nextSong()
}

// 歌词滚动逻辑 - 优化版
const updateLyricsPosition = () => {
  if (!lyricsContainer.value || currentLyricIndex.value === -1 || parsedLyrics.value.length === 0) return
  
  nextTick(() => {
    // 获取当前歌词元素，添加类型断言
    const activeLine = document.querySelector(`.lyrics-content p.active`) as HTMLElement | null;
    if (!activeLine) return;
    
    // 检查lyricsContainer.value是否存在
    if (!lyricsContainer.value) return;
    
    // 计算容器和当前歌词的位置
    const containerRect = lyricsContainer.value.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();
    
    // 计算需要滚动的偏移量，使当前歌词居中
    const containerCenter = containerRect.height / 2;
    const lineCenter = lineRect.top - containerRect.top + lineRect.height / 2;
    offsetY.value += containerCenter - lineCenter;
    
    // 添加动画效果，添加类型断言
    const lyricsContent = document.querySelector('.lyrics-content') as HTMLElement | null;
    if (lyricsContent) {
      lyricsContent.style.transition = 'transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)';
      
      // 动画结束后清除过渡效果，避免手动滚动时的卡顿
      setTimeout(() => {
        if (lyricsContent) {
          lyricsContent.style.transition = '';
        }
      }, 300);
    }
  });

}

// 拖动开始
const startDrag = (e: TouchEvent | MouseEvent) => {
  isDragging.value = true
  // 区分触摸和鼠标事件
  if (e.type === 'touchstart') {
    startY.value = (e as TouchEvent).touches[0].clientY
  } else {
    startY.value = (e as MouseEvent).clientY
  }
  
  // 添加拖动状态类
  const lyricsPage = document.querySelector('.lyrics-page')
  if (lyricsPage) {
    lyricsPage.classList.add('dragging')
  }
  
  e.preventDefault()
}

// 拖动过程
const onDrag = (e: TouchEvent | MouseEvent) => {
  if (!isDragging.value) return
  
  let currentY: number
  // 区分触摸和鼠标事件
  if (e.type === 'touchmove') {
    currentY = (e as TouchEvent).touches[0].clientY
  } else {
    currentY = (e as MouseEvent).clientY
  }
  
  // 计算拖动偏移量（只允许向下拖动）
  const deltaY = currentY - startY.value
  if (deltaY > 0) {
    dragOffset.value = deltaY
    // 拖动距离越大，透明度越低（最小0.5）
    dragOpacity.value = 1 - (deltaY / 400)
    if (dragOpacity.value < 0.5) dragOpacity.value = 0.5
  }
  
  e.preventDefault()
}

// 拖动结束
const endDrag = () => {
  if (!isDragging.value) return
  
  isDragging.value = false
  // 1. 添加类型断言，明确是HTMLElement类型
  const lyricsPage = document.querySelector('.lyrics-page') as HTMLElement | null
  
  if (lyricsPage) {
    lyricsPage.classList.remove('dragging')
    // 2. 现在访问style属性不会报错了
    lyricsPage.style.transition = 'transform 0.3s, opacity 0.3s'
  }
  
  // 如果拖动距离超过100px，则关闭歌词页
  if (dragOffset.value > 100) {
    closeLyrics()
  } else {
    // 否则恢复原位置
    dragOffset.value = 0
    dragOpacity.value = 1
    
    // 3. 重新获取元素或使用闭包保存的引用，避免定时器中可能的null问题
    const currentLyricsPage = lyricsPage
    // 清除过渡效果
    setTimeout(() => {
      if (currentLyricsPage) {  // 这里使用保存的引用
        currentLyricsPage.style.transition = ''
      }
    }, 300)
  }
}


// 监听歌词索引变化，更新位置
watch(currentLyricIndex, (newIndex, oldIndex) => {
  if (newIndex !== oldIndex) {
    updateLyricsPosition()
  }
})

// 监听窗口大小变化，重新计算位置
const handleResize = () => {
  updateLyricsPosition()
}

// 初始化时计算位置
onMounted(() => {
  updateLyricsPosition()
  window.addEventListener('resize', handleResize)
  
  // 清理函数
  return () => {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
.lyrics-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 90vh;
  background: linear-gradient(to top, rgba(40, 15, 48, 0.98), rgba(30, 10, 38, 0.98));
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px;
  margin-bottom: 60px;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
  z-index: 100;
  box-sizing: border-box;
  touch-action: pan-y;
  overflow: hidden;
  animation: slideUp 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}

/* 拖动把手 */
.drag-handle {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 5px;
  background-color: rgba(180, 100, 200, 0.6);
  border-radius: 3px;
  cursor: pointer;
  z-index: 10;
}

/* 背景模糊效果 */
.background-blur {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('https://picsum.photos/800/1600') no-repeat center center / cover;
  filter: blur(20px) brightness(0.4);
  z-index: -1;
  opacity: 0.7;
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
  padding: 15px 0 20px;
  border-bottom: 1px solid rgba(138, 43, 226, 0.3);
  margin-top: 10px;
}

.song-info {
  text-align: center;
}

.song-title {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 5px 0;
}

.song-artist {
  color: #b088b6;
  font-size: 14px;
  margin: 0;
}

.close-btn {
  position: absolute;
  right: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: #d8bfd8;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:active {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(0.95);
}

.lyrics-container {
  height: calc(100% - 160px); /* 调整高度以适应控制栏 */
  overflow: hidden;
  position: relative;
  margin-top: 20px;
  /* 添加渐变遮罩，使顶部和底部歌词逐渐消失 */
  mask-image: linear-gradient(to bottom, 
    transparent 0%, 
    black 10%, 
    black 90%, 
    transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, 
    transparent 0%, 
    black 10%, 
    black 90%, 
    transparent 100%);
}

.lyrics-content {
  text-align: center;
  padding: 50% 0;
}

.lyrics-content p {
  color: rgba(180, 140, 200, 0.7);
  margin: 12px 0;
  padding: 8px 0;
  font-size: 17px;
  transition: all 0.4s ease;
  line-height: 1.5;
}

.lyrics-content p.active {
  color: #e39ff6;
  font-size: 20px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(185, 85, 211, 0.5);
  transform: scale(1.08);
}

/* 底部音乐控制栏 */
.music-controls {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  padding: 0 20px;
}

.control-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(150, 75, 180, 0.3);
  border: none;
  color: #e39ff6;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s;
}

.control-btn:active {
  background: rgba(150, 75, 180, 0.5);
  transform: scale(0.95);
}

.play-pause-btn {
  width: 60px;
  height: 60px;
  background: rgba(185, 85, 211, 0.3);
  font-size: 24px;
}

/* 拖动状态样式 */
.dragging {
  transition: none !important;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .lyrics-page {
    height: 80vh;
  }
  
  .song-title {
    font-size: 18px;
  }
  
  .lyrics-content p {
    font-size: 16px;
  }
  
  .lyrics-content p.active {
    font-size: 18px;
  }
}
</style>
