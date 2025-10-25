<template>
  <div class="play-controls">
    <!-- 播放顺序按钮 -->
    <button class="btn play-order" @click="togglePlayOrder" :title="playOrderText">
      <i :class="[playOrderIcon, { active: playOrder !== 'normal' }]"></i>
    </button>
    
    <button class="btn prev" @click="prevSong" title="上一首">
      <i class="fa fa-step-backward"></i>
    </button>
    <button class="btn play-pause" @click="togglePlayPause" :title="isPlaying ? '暂停' : '播放'">
      <i :class="isPlaying ? 'fa fa-pause' : 'fa fa-play'"></i>
    </button>
    <button class="btn next" @click="nextSong" title="下一首">
      <i class="fa fa-step-forward"></i>
    </button>
    <button class="btn repeat" @click="toggleRepeat" :title="repeatText">
      <i :class="['fa', repeatIcon, { active: repeatActive }]"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import useAudioPlayer from '@/composables/useAudioPlayer'

const musicStore = useMusicStore()
const player = useAudioPlayer();

const isPlaying = computed(() => musicStore.isPlaying)
const repeatMode = computed(() => musicStore.repeatMode)
const playOrder = computed(() => musicStore.playOrder)

// 播放顺序图标和文本
const playOrderIcon = computed(() => {
  switch (playOrder.value) {
    case 'normal':
      return 'fa fa-list-ol'
    case 'shuffle':
      return 'fa fa-random'
    case 'single':
      return 'fa fa-retweet' // 修改：使用 fa-retweet 替代 fa-repeat-1
    default:
      return 'fa fa-list-ol'
  }
})

const playOrderText = computed(() => {
  return musicStore.playOrderText
})

// 重复模式文本
const repeatText = computed(() => {
  switch (repeatMode.value) {
    case 'none':
      return '不重复'
    case 'one':
      return '单曲循环'
    case 'all':
      return '列表循环'
    default:
      return '重复模式'
  }
})

// 切换播放顺序
const togglePlayOrder = () => {
  musicStore.togglePlayOrder()
}

// 播放控制方法
const prevSong = () => musicStore.prevSong()
const nextSong = () => musicStore.nextSong()

const togglePlayPause = () => {
  player.togglePlayPause();
}

// 重复模式切换逻辑
const toggleRepeat = () => {
  musicStore.toggleRepeatMode()
}

// 重复模式图标计算 - 修复图标类名
const repeatIcon = computed(() => {
  switch (repeatMode.value) {
    case 'one':
      return 'fa-retweet' // 修改：使用 fa-retweet 替代 fa-repeat-1
    case 'all':
      return 'fa-repeat'
    default:
      return 'fa-repeat'
  }
})

const repeatActive = computed(() => {
  return repeatMode.value !== 'none'
})
</script>

<style scoped>
.play-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
}

.btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background-color: rgba(45, 10, 49, 0.8);
  color: #d8bfd8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.btn:hover {
  background-color: rgba(138, 43, 226, 0.3);
  transform: scale(1.05);
}

.btn.active {
  color: #b955d3;
}

.btn:active {
  transform: scale(0.95);
}

.play-pause {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #b955d3, #8a2be2);
  font-size: 24px;
  box-shadow: 0 0 15px rgba(185, 85, 211, 0.5);
}

.play-pause:hover {
  box-shadow: 0 0 20px rgba(185, 85, 211, 0.7);
}

/* 为按钮添加工具提示效果 */
.btn::after {
  content: attr(title);
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 100;
}

.btn:hover::after {
  opacity: 1;
}
</style>