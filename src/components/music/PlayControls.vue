<template>
  <div class="play-controls">
    <button class="btn shuffle" @click="toggleShuffle">
      <i class="fa fa-random" :class="{ active: shuffle }"></i>
    </button>
    <button class="btn prev" @click="prevSong">
      <i class="fa fa-step-backward"></i>
    </button>
    <button class="btn play-pause" @click="togglePlayPause">
      <i :class="isPlaying ? 'fa fa-pause' : 'fa fa-play'"></i>
    </button>
    <button class="btn next" @click="nextSong">
      <i class="fa fa-step-forward"></i>
    </button>
    <button class="btn repeat" @click="toggleRepeat">
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
const shuffle = computed(() => musicStore.shuffle)
const repeatMode = computed(() => musicStore.repeatMode)

// 播放控制方法
const prevSong = () => musicStore.prevSong()
const nextSong = () => musicStore.nextSong()

const toggleShuffle = () => musicStore.toggleShuffle()
const togglePlayPause = () => {
  player.togglePlayPause(); // 使用音频播放器的方法
}
// 播放模式切换逻辑
const toggleRepeat = () => {
  musicStore.toggleRepeatMode()
}

// 播放模式图标计算
const repeatIcon = computed(() => {
  switch (repeatMode.value) {
    case 'one':
      return 'fa-repeat-1'
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
}

.btn:hover {
  background-color: rgba(138, 43, 226, 0.3);
}

.btn.active {
  color: #b955d3;
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
</style>