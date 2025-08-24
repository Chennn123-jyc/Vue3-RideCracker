<template>
  <div class="song-info">
    <h2 class="title">{{ title }}</h2>
    <p class="artist-album">{{ artist }} · {{ album }}</p>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMusicStore } from '@/stores/musicStore'
import { computed } from 'vue'

const musicStore = useMusicStore()
const { currentSong } = storeToRefs(musicStore)

// 计算属性：处理空值
const title = computed(() => currentSong.value?.title || '未知歌曲')
const artist = computed(() => currentSong.value?.artist || '未知歌手')
const album = computed(() => currentSong.value?.album || '未知专辑')
</script>

<style scoped>
.song-info {
  text-align: center;
  padding: 0 16px;
}

.title {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist-album {
  font-size: 16px;
  color: #b088b6;
  margin: 0;
}
</style>
