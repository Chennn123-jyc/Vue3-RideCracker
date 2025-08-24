<template>
  <div class="playlist-container">
    <h2 class="playlist-title">播放列表</h2>
    <ul class="playlist-list">
      <li 
        v-for="(song, index) in playlist" 
        :key="song.id" 
        class="playlist-item"
        @click="playSong(song)"
        :class="{ active: isCurrentSong(song) }"
      >
        <span class="song-title">{{ song.title }}</span>
        <span class="playlist-artist">{{ song.artist }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMusicStore } from '@/stores/musicStore';
import { computed } from 'vue';
import type { Song } from '@/types/music';

const musicStore = useMusicStore();
const { playlist, currentSong } = storeToRefs(musicStore);

// 检查是否为当前播放歌曲
const isCurrentSong = (song: Song) => {
  return currentSong.value?.id === song.id;
}

// 播放选中歌曲
const playSong = (song: Song) => {
  musicStore.currentSong = song;
  musicStore.currentTime = 0;
  musicStore.isPlaying = true;
};
</script>

<style scoped>
.playlist-container {
  padding: 0 15px 15px;
}

.playlist-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 10px 0 15px;
  padding: 0 10px;
}

.playlist-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #b088b6;
  background-color: rgba(45, 10, 49, 0.3);
}

.playlist-item:hover {
  background-color: rgba(185, 85, 211, 0.2);
  color: #d8bfd8;
}

.playlist-item.active {
  color: #b955d3;
  font-weight: 500;
  background-color: rgba(185, 85, 211, 0.25);
}

.song-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 10px;
}

.playlist-artist {
  font-size: 13px;
  color: #8a6d8f;
  white-space: nowrap;
}
</style>