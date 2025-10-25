<template>
  <div class="liked-music-search">
    <!-- 搜索框 -->
    <div class="search-bar">
      <div class="search-input-container">
        <i class="fa fa-search search-icon"></i>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="在喜欢列表中搜索..."
          class="search-input"
          @input="handleSearchInput"
          @keyup.enter="performSearch"
        />
        <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">
          <i class="fa fa-times"></i>
        </button>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="tabs">
      <button 
        class="tab" 
        :class="{ active: activeTab === 'all' }"
        @click="switchTab('all')"
      >
        全部音乐
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'liked' }"
        @click="switchTab('liked')"
      >
        喜欢的音乐
      </button>
    </div>

    <!-- 音乐列表 -->
    <div class="music-list-container">
      <div v-if="loading" class="loading">
        <i class="fa fa-spinner fa-spin"></i>
        <span>加载中...</span>
      </div>

      <div v-else-if="musicList.length > 0" class="music-list">
        <div
          v-for="song in musicList"
          :key="`user-${song.id}`"
          class="music-item"
          :class="{ active: isCurrentSong(song), playing: isCurrentSongPlaying(song) }"
        >
          <div class="song-cover" @click="playSong(song)">
            <img :src="song.cover_url || '/images/default-cover.jpg'" :alt="song.title" />
            <div class="play-overlay">
              <i :class="isCurrentSongPlaying(song) ? 'fa fa-pause' : 'fa fa-play'"></i>
            </div>
            <!-- 播放指示器 -->
            <div v-if="isCurrentSongPlaying(song)" class="playing-indicator">
              <div class="bar"></div>
              <div class="bar"></div>
              <div class="bar"></div>
            </div>
          </div>
          
          <div class="song-info" @click="playSong(song)">
            <h4 class="song-title">{{ song.title }}</h4>
            <p class="song-artist">{{ song.artist }}</p>
            <p class="song-album">{{ song.album }}</p>
            <div class="song-meta">
              <span class="upload-time">{{ formatTime(song.upload_time) }}</span>
              <span class="play-count">播放 {{ song.play_count }} 次</span>
            </div>
          </div>
          
          <div class="song-actions">
            <button
              class="like-btn"
              :class="{ 
                liked: isSongLiked(song),
                loading: song._loading }"
              @click="toggleLike(song)"
              :title="isSongLiked(song) ? '取消喜欢' : '喜欢'"
              :disabled="song._loading"  
            >
            <i class="fa" :class="
            song._loading ? 'fa-spinner fa-spin' : 
            isSongLiked(song) ? 'fa-heart' : 'fa-heart-o'
            "></i>
            </button>
            
            <button 
              class="action-btn" 
              @click="playSong(song)" 
              :title="isCurrentSong(song) ? (isCurrentSongPlaying(song) ? '暂停' : '播放') : '播放'"
            >
              <i :class="isCurrentSongPlaying(song) ? 'fa fa-pause' : 'fa fa-play'"></i>
            </button>
            
            <button class="action-btn" @click="showSongMenu(song)" title="更多">
              <i class="fa fa-ellipsis-v"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <i class="fa fa-heart empty-icon"></i>
        <p v-if="activeTab === 'liked' && !searchKeyword">你还没有喜欢的音乐</p>
        <p v-else-if="activeTab === 'all' && !searchKeyword">你还没有上传音乐</p>
        <p v-else>没有找到相关音乐</p>
        <button v-if="activeTab === 'all' && !searchKeyword" class="upload-prompt-btn" @click="$emit('show-upload')">
          <i class="fa fa-upload"></i>
          上传第一首音乐
        </button>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
          上一页
        </button>
        <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
        <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
          下一页
        </button>
      </div>
    </div>

    <!-- 歌曲菜单模态框 -->
    <div v-if="showMenu" class="modal-overlay" @click="hideSongMenu">
      <div class="song-menu" @click.stop>
        <h4>{{ selectedSong?.title }}</h4>
        <button @click="playSong(selectedSong!)">
          <i class="fa fa-play"></i> {{ isCurrentSongPlaying(selectedSong!) ? '暂停' : '播放' }}
        </button>
        <button @click="toggleLike(selectedSong!)">
          <i class="fa" :class="isSongLiked(selectedSong!) ? 'fa-heart' : 'fa-heart-o'"></i>
          {{ isSongLiked(selectedSong!) ? '取消喜欢' : '喜欢' }}
        </button>
        <button @click="deleteSong(selectedSong!)" class="delete-btn">
          <i class="fa fa-trash"></i> 删除
        </button>
        <button @click="hideSongMenu">
          <i class="fa fa-times"></i> 取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useMusicStore } from '@/stores/musicStore';

const musicStore = useMusicStore();

const searchKeyword = ref('');
const musicList = ref<any[]>([]);
const currentPage = ref(1);
const totalResults = ref(0);
const totalPages = ref(0);
const loading = ref(false);
const activeTab = ref<'all' | 'liked'>('liked');
const showMenu = ref(false);
const selectedSong = ref<any>(null);
const searchTimer = ref<NodeJS.Timeout | null>(null);

// 响应式播放状态
const localPlayingState = ref(false);
const currentPlayingSongId = ref<string | null>(null);
const localLikedSongs = ref(new Set<number>());

const baseApi = '/api';

// 计算属性
const apiEndpoint = computed(() => {
  return activeTab.value === 'liked' 
    ? `${baseApi}/music/my/liked`    
    : `${baseApi}/music/my/library`; 
});

// 状态监听器
const stateListener = (type: string, payload: any) => {
  console.log('🎵 音乐库收到状态变化:', type, payload);
  
  if (type === 'playbackState') {
    localPlayingState.value = payload.isPlaying;
  } else if (type === 'songChange') {
    currentPlayingSongId.value = payload.song?.id || null;
  } else if (type === 'likedSongsUpdate') {
    localLikedSongs.value = new Set(payload.songIds);
    console.log('❤️ 音乐库收到喜欢列表更新:', payload.songIds);
  } else if (type === 'songLiked') {
    if (payload.liked) {
      localLikedSongs.value.add(payload.songId);
    } else {
      localLikedSongs.value.delete(payload.songId);
    }
    console.log('❤️ 音乐库收到喜欢状态变化:', payload.songId, payload.liked);
  }
};

// 监听标签页变化
watch(activeTab, () => {
  currentPage.value = 1;
  loadMusic();
});

// 加载音乐列表
const loadMusic = async () => {
  console.log('🔄 开始加载音乐...');
  loading.value = true;
  
  try {
    const url = `${apiEndpoint.value}?keyword=${encodeURIComponent(searchKeyword.value)}&page=${currentPage.value}&limit=20`;
    console.log('📡 请求URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('📨 响应状态:', response.status);
    
    // 确保响应是 JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`非JSON响应: ${text.substring(0, 100)}`);
    }
    
    const result = await response.json();
    console.log('📦 响应数据:', result);
    
    if (response.ok && result.code === 200) {
      // 使用全局喜欢状态覆盖服务器返回的 isLiked
      const itemsWithGlobalLiked = (result.data.items || []).map((song: any) => ({
        ...song,
        isLiked: musicStore.isSongLiked(song.id) // 使用全局状态
      }));
      
      console.log('✅ 设置音乐数据:', itemsWithGlobalLiked);
      musicList.value = itemsWithGlobalLiked;
      totalResults.value = result.data.total || 0;
      totalPages.value = Math.ceil((result.data.total || 0) / 20);
    } else {
      throw new Error(result.message || `加载失败 (${response.status})`);
    }
    
  } catch (error) {
    console.error('❌ 加载音乐失败:', error);
    musicList.value = [];
    totalResults.value = 0;
    totalPages.value = 0;
  } finally {
    loading.value = false;
    console.log('🏁 加载完成, loading状态设置为:', loading.value);
  }
};

// 处理搜索输入（防抖）
const handleSearchInput = () => {
  if (searchTimer.value) {
    clearTimeout(searchTimer.value);
  }
  
  searchTimer.value = setTimeout(() => {
    currentPage.value = 1;
    loadMusic();
  }, 500);
};

// 切换喜欢状态 - 使用全局状态管理
const toggleLike = async (song: any) => {
  try {
    console.log('❤️ 切换喜欢状态:', song);
    
    // 立即更新全局状态（乐观更新）
    const newLikedState = !musicStore.isSongLiked(song.id);
    musicStore.toggleLikedSong(song.id);
    
    const response = await fetch('/api/music/my/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ userMusicId: song.id })
    });
    
    console.log('喜欢操作响应状态:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('喜欢操作结果:', result);
      
      // 如果API返回的状态与乐观更新不一致，重新同步
      if (result.data.liked !== newLikedState) {
        console.log('🔄 状态不一致，重新同步');
        if (result.data.liked) {
          musicStore.addLikedSong(song.id);
        } else {
          musicStore.removeLikedSong(song.id);
        }
      }
      
      // 如果在喜欢标签页取消喜欢，从列表中移除
      if (activeTab.value === 'liked' && !result.data.liked) {
        console.log('从喜欢列表中移除歌曲');
        musicList.value = musicList.value.filter(s => s.id !== song.id);
      }
      
    } else {
      // API调用失败，回滚状态
      console.log('❌ API调用失败，回滚状态');
      musicStore.toggleLikedSong(song.id); // 再次切换回滚
      const errorText = await response.text();
      console.error('喜欢操作失败:', response.status, errorText);
    }
  } catch (error) {
    // 网络错误，回滚状态
    console.log('❌ 网络错误，回滚状态');
    musicStore.toggleLikedSong(song.id);
    console.error('操作失败:', error);
  }
};

// 播放歌曲 - 增强版本
const playSong = (song: any) => {
  const songId = `user-${song.id}`;
  
  // 如果是当前歌曲，切换播放状态
  if (currentPlayingSongId.value === songId) {
    console.log('🔄 切换当前歌曲播放状态');
    musicStore.togglePlayPause();
    return;
  }

  const playableSong = {
    id: songId,
    title: song.title,
    artist: song.artist,
    album: song.album,
    coverUrl: song.cover_url || '/images/default-cover.jpg',
    url: `/api/music/stream/user/${song.id}`,
    duration: song.duration,
    lyrics: song.lyrics ? JSON.parse(song.lyrics) : []
  };
  
  console.log('🎵 准备播放新歌曲:', playableSong.title);
  
  musicStore.setCurrentSong(playableSong);
  
  // 立即播放
  setTimeout(() => {
    musicStore.play();
  }, 100);
  
  hideSongMenu();
};

// 检查是否为当前播放歌曲
const isCurrentSong = (song: any) => {
  return currentPlayingSongId.value === `user-${song.id}`;
};

// 检查当前歌曲是否正在播放
const isCurrentSongPlaying = (song: any) => {
  return isCurrentSong(song) && localPlayingState.value;
};

// 检查歌曲是否被喜欢
const isSongLiked = (song: any) => {
  return musicStore.isSongLiked(song.id);
};

// 删除歌曲
const deleteSong = async (song: any) => {
  if (!confirm(`确定要删除 "${song.title}" 吗？`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/music/my/${song.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      // 从列表中移除
      musicList.value = musicList.value.filter(s => s.id !== song.id);
      hideSongMenu();
    }
  } catch (error) {
    console.error('删除失败:', error);
  }
};

// 显示歌曲菜单
const showSongMenu = (song: any) => {
  selectedSong.value = song;
  showMenu.value = true;
};

// 隐藏歌曲菜单
const hideSongMenu = () => {
  showMenu.value = false;
  selectedSong.value = null;
};

// 格式化时间
const formatTime = (timeString: string) => {
  const date = new Date(timeString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// 切换标签页
const switchTab = (tab: 'all' | 'liked') => {
  activeTab.value = tab;
};

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = '';
  currentPage.value = 1;
  loadMusic();
};

// 切换页面
const changePage = (page: number) => {
  currentPage.value = page;
  loadMusic();
};

// 执行搜索
const performSearch = () => {
  currentPage.value = 1;
  loadMusic();
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
        console.log('❤️ 加载喜欢歌曲列表:', likedSongIds.length, '首');
      }
    }
  } catch (error) {
    console.error('加载喜欢歌曲失败:', error);
  }
};

onMounted(() => {
  console.log('🎵 LikedMusicSearch 组件挂载');
  
  // 注册状态监听器
  musicStore.addStateListener(stateListener);
  
  // 初始化状态
  localPlayingState.value = musicStore.isPlaying;
  currentPlayingSongId.value = musicStore.currentSong?.id || null;
  localLikedSongs.value = new Set(musicStore.getLikedSongs);
  
  // 加载喜欢列表
  loadLikedSongs();
  
  // 加载音乐列表
  loadMusic();
  
  // 添加重新加载监听
  window.addEventListener('refresh-music-library', () => {
    console.log('🔄 收到重新加载事件');
    loadMusic();
  });
});

onUnmounted(() => {
  // 移除状态监听器
  musicStore.removeStateListener(stateListener);
  
  // 清理事件监听器
  window.removeEventListener('refresh-music-library', () => {});
});

defineEmits(['show-upload']);
</script>

<style scoped>
.liked-music-search {
  padding: 20px;
}

.search-bar {
  margin-bottom: 20px;
}

.search-input-container {
  position: relative;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 40px;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 16px;
  outline: none;
}

.search-input:focus {
  border-color: #b955d3;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.clear-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab {
  padding: 10px 20px;
  background: none;
  border: none;
  color: #b088b6;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab.active {
  color: #b955d3;
  border-bottom-color: #b955d3;
}

.music-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.music-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  transition: background-color 0.3s;
  border: 1px solid transparent;
}

.music-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.music-item.active {
  border-color: #b955d3;
}

.music-item.playing {
  background: rgba(185, 85, 211, 0.1);
  border-color: #b955d3;
}

.song-cover {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 15px;
  cursor: pointer;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.song-cover:hover .play-overlay {
  opacity: 1;
}

.play-overlay i {
  color: white;
  font-size: 20px;
}

/* 播放指示器 */
.playing-indicator {
  position: absolute;
  bottom: 5px;
  left: 5px;
  display: flex;
  align-items: end;
  gap: 2px;
  height: 12px;
}

.playing-indicator .bar {
  width: 2px;
  background: #b955d3;
  border-radius: 1px;
  animation: bounce 1.2s infinite ease-in-out;
}

.playing-indicator .bar:nth-child(1) {
  height: 6px;
  animation-delay: -0.4s;
}

.playing-indicator .bar:nth-child(2) {
  height: 9px;
  animation-delay: -0.2s;
}

.playing-indicator .bar:nth-child(3) {
  height: 12px;
  animation-delay: 0s;
}

@keyframes bounce {
  0%, 100% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1);
  }
}

.song-info {
  flex: 1;
  cursor: pointer;
}

.song-title {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #fff;
}

.song-artist {
  margin: 0 0 2px 0;
  font-size: 14px;
  color: #b088b6;
}

.song-album {
  margin: 0 0 5px 0;
  font-size: 12px;
  color: #8a6d8f;
}

.song-meta {
  display: flex;
  gap: 15px;
  font-size: 11px;
  color: #666;
}

.song-actions {
  display: flex;
  gap: 5px;
}

.like-btn, .action-btn {
  background: none;
  border: none;
  color: #d8bfd8;
  cursor: pointer;
  font-size: 16px;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s;
}

.like-btn:hover, .action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.like-btn.liked {
  color: #b955d3;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #b088b6;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.upload-prompt-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #b955d3, #8a2be2);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding: 20px;
}

.pagination button {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 5px;
  color: #d8bfd8;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.song-menu {
  background: #2d0a31;
  border-radius: 10px;
  padding: 20px;
  min-width: 200px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.song-menu h4 {
  margin: 0 0 15px 0;
  color: #fff;
  text-align: center;
}

.song-menu button {
  display: block;
  width: 100%;
  padding: 10px;
  background: none;
  border: none;
  color: #d8bfd8;
  text-align: left;
  cursor: pointer;
  border-radius: 5px;
  margin-bottom: 5px;
}

.song-menu button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.song-menu button i {
  margin-right: 10px;
  width: 20px;
  text-align: center;
}

.delete-btn {
  color: #ff6b6b !important;
}
</style>