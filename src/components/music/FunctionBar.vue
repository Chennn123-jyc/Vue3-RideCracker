<template>
  <div class="function-bar">
    <button class="func-btn" @click="toggleLike" :disabled="!currentSong">
      <i class="fa fa-heart" :class="{ active: isCurrentSongLiked, 'fa-spin': likeLoading }"></i>
      <span>喜欢</span>
    </button>
    <button class="func-btn" @click="goToLyrics">
      <i class="fa fa-align-left" :class="{ active: isLyricsActive }"></i>
      <span>歌词</span>
    </button>
    <button class="func-btn" @click="toggleDownload" :disabled="!currentSong">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import PlaylistModal from '@/components/music/PlayModal.vue'

const router = useRouter()
const musicStore = useMusicStore()
const showPlaylistModal = ref(false)
const likeLoading = ref(false)

// 响应式状态
const isCurrentSongLiked = ref(false)
const localLikedSongs = ref(new Set<number>())

// 计算当前歌曲
const currentSong = computed(() => musicStore.currentSong)

// 判断当前是否在歌词路由
const isLyricsActive = computed(() => {
  return router.currentRoute.value.name === 'music-lyrics'
})

// 状态监听器
const stateListener = (type: string, payload: any) => {
  console.log('🎵 功能栏收到状态变化:', type, payload);
  
  if (type === 'songChange') {
    updateCurrentSongLikedStatus();
  } else if (type === 'likedSongsUpdate') {
    localLikedSongs.value = new Set(payload.songIds);
    updateCurrentSongLikedStatus();
  } else if (type === 'songLiked') {
    if (payload.liked) {
      localLikedSongs.value.add(payload.songId);
    } else {
      localLikedSongs.value.delete(payload.songId);
    }
    updateCurrentSongLikedStatus();
  }
}

// 更新当前歌曲喜欢状态
const updateCurrentSongLikedStatus = () => {
  if (musicStore.currentSong) {
    // 从 user-10 格式中提取数字ID
    const songIdMatch = musicStore.currentSong.id.match(/user-(\d+)/);
    if (songIdMatch) {
      const songId = parseInt(songIdMatch[1]);
      isCurrentSongLiked.value = musicStore.isSongLiked(songId);
      console.log('❤️ 更新功能栏喜欢状态:', isCurrentSongLiked.value, '歌曲ID:', songId);
    }
  } else {
    isCurrentSongLiked.value = false;
  }
}

// 切换喜欢状态
const toggleLike = async () => {
  if (!musicStore.currentSong) {
    console.log('❌ 没有当前歌曲，无法喜欢');
    return;
  }

  const songIdMatch = musicStore.currentSong.id.match(/user-(\d+)/);
  if (!songIdMatch) {
    console.log('❌ 无法解析歌曲ID');
    return;
  }

  const songId = parseInt(songIdMatch[1]);
  
  try {
    likeLoading.value = true;
    
    // 立即更新全局状态（乐观更新）
    const newLikedState = !musicStore.isSongLiked(songId);
    musicStore.toggleLikedSong(songId);
    
    console.log('❤️ 功能栏切换喜欢状态:', songId, '新状态:', newLikedState);
    
    const response = await fetch('/api/music/my/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ userMusicId: songId })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('❤️ 功能栏喜欢操作结果:', result);
      
      // 如果API返回的状态与乐观更新不一致，重新同步
      if (result.data.liked !== newLikedState) {
        console.log('🔄 功能栏状态不一致，重新同步');
        if (result.data.liked) {
          musicStore.addLikedSong(songId);
        } else {
          musicStore.removeLikedSong(songId);
        }
      }
      
      // 显示操作反馈
      showLikeFeedback(result.data.liked);
      
    } else {
      // API调用失败，回滚状态
      console.log('❌ 功能栏API调用失败，回滚状态');
      musicStore.toggleLikedSong(songId);
      const errorText = await response.text();
      console.error('功能栏喜欢操作失败:', response.status, errorText);
    }
  } catch (error) {
    // 网络错误，回滚状态
    console.log('❌ 功能栏网络错误，回滚状态');
    musicStore.toggleLikedSong(songId);
    console.error('功能栏操作失败:', error);
  } finally {
    likeLoading.value = false;
  }
}

// 显示喜欢操作反馈
const showLikeFeedback = (liked: boolean) => {
  // 这里可以添加更复杂的反馈，比如 toast 通知
  console.log(`❤️ ${liked ? '已添加到喜欢' : '已取消喜欢'}`);
}

// 跳转到歌词子路由
const goToLyrics = () => {
  router.push({ name: 'music-lyrics' })
}

// 模拟下载
const toggleDownload = () => {
  musicStore.downloadCurrentSong();
};

// 加载喜欢歌曲列表
const loadLikedSongs = async () => {
  try {
    const response = await fetch('/api/music/my/liked?limit=1000', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.code === 200) {
        const likedSongIds = result.data.items.map((item: any) => item.id);
        musicStore.setLikedSongs(likedSongIds);
        console.log('❤️ 功能栏加载喜欢歌曲列表:', likedSongIds.length, '首');
      }
    }
  } catch (error) {
    console.error('功能栏加载喜欢歌曲失败:', error);
  }
};

// 组件挂载和卸载
onMounted(() => {
  console.log('🎵 功能栏组件挂载');
  
  // 注册状态监听器
  musicStore.addStateListener(stateListener);
  
  // 初始化喜欢状态
  const likedIds = musicStore.getLikedSongs;
  localLikedSongs.value = new Set(likedIds);
  updateCurrentSongLikedStatus();
  
  // 加载喜欢列表
  loadLikedSongs();
});

onUnmounted(() => {
  // 移除状态监听器
  musicStore.removeStateListener(stateListener);
});
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
  transition: all 0.2s;
  position: relative;
}

.func-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.func-btn:not(:disabled):hover {
  transform: translateY(-2px);
}

.func-btn i {
  font-size: 22px;
  transition: all 0.2s;
}

.func-btn:not(:disabled):hover i {
  color: #d8bfd8;
  transform: scale(1.1);
}

.func-btn .active {
  color: #b955d3;
}

/* 喜欢按钮的特殊样式 */
.func-btn:first-child .active {
  animation: heartBeat 0.6s;
}

@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.3);
  }
  50% {
    transform: scale(0.9);
  }
  75% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* 加载状态 */
.func-btn .fa-spin {
  animation: fa-spin 1s infinite linear;
}

@media (max-width: 480px) {
  .function-bar {
    gap: 20px;
  }
  
  .func-btn span {
    font-size: 12px;
  }
  
  .func-btn i {
    font-size: 18px;
  }
}
</style>