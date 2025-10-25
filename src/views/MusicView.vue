<template>
  <div class="music-view">
    <!-- 认证错误提示 -->
    <div v-if="authError" class="auth-error">
      <div class="error-content">
        <i class="fa fa-exclamation-triangle"></i>
        <p>认证已失效，请重新登录</p>
        <button class="relogin-btn" @click="handleReLogin">重新登录</button>
      </div>
    </div>
    
    <div v-else class="music-content">
      <div class="status-container">
        <router-view name="status" />
      </div>
      
      <div class="content-container" :class="{ 'content-container--shifted': menuStore.isOpen }">
        <!-- 新的导航栏布局 -->
        <div class="music-nav-bar">
          <div class="nav-left">
            <button 
              class="nav-btn player-btn" 
              :class="{ active: currentView === 'player' }"
              @click="currentView = 'player'"
            >
              <i class="fa fa-music"></i>
              <span class="btn-text">播放器</span>
            </button>
          </div>
          
          <div class="nav-center">
            <h1 class="nav-title">{{ currentView === 'player' ? '正在播放' : '我的音乐库' }}</h1>
          </div>
          
          <div class="nav-right">
            <button 
              class="nav-btn library-btn" 
              :class="{ active: currentView === 'library' }"
              @click="currentView = 'library'"
            >
              <i class="fa fa-folder"></i>
              <span class="btn-text">音乐库</span>
            </button>
          </div>
        </div>

        <!-- 播放器视图 -->
        <div v-if="currentView === 'player'" class="player-view">
  <div class="player-content">
    <router-view name="VinyRecord" :is-playing="isPlaying" :cover-url="musicStore.currentSong?.coverUrl||''"></router-view>
    <router-view name="info"></router-view>
    
    <!-- 确保进度条组件有足够的空间 -->
    <div class="progress-section">
      <router-view name="progress"></router-view>
    </div>
    
    <router-view name="controls"></router-view>
    <router-view name="functions"></router-view>
    <router-view name="upload"></router-view>
  </div>
</div>

        <!-- 音乐库视图 -->
        <div v-else class="library-view">
          <LikedMusicSearch @show-upload="showUploadModalHandler" />
        </div>
      </div>
      
      <router-view name="lyrics"></router-view>
      
      <!-- 上传模态框 -->
      <UploadModal 
        v-if="showUploadModal" 
        @close="closeUploadModal"
        @upload-success="handleUploadSuccess"
      />
      
      <!-- 悬浮上传按钮 -->
      <button class="floating-upload-btn" @click="showUploadModal = true" title="上传音乐">
        <div class="fab-content">
          <i class="fa fa-plus"></i>
          <span class="fab-text">上传</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import LikedMusicSearch from '@/components/music/LikedMusicSearch.vue';
import UploadModal from '@/components/music/UploadModal.vue';
import { storeToRefs } from 'pinia';
import { useMusicStore } from '@/stores/musicStore';
import { useMenuStore } from '@/stores/menuStore';

const router = useRouter();
const menuStore = useMenuStore();
const musicStore = useMusicStore();
const { isPlaying } = storeToRefs(musicStore);

const currentView = ref<'player' | 'library'>('player');
const showUploadModal = ref(false);
const authError = ref(false);

// 检查认证状态
const checkAuthStatus = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    authError.value = true;
    console.error('❌ 未找到token');
    return false;
  }

  try {
    // 尝试多个认证端点
    const endpoints = [
      '/api/music/auth/check',
      '/api/auth/check'
    ];
    
    let authValid = false;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.code === 200) {
            authValid = true;
            console.log('✅ 认证有效');
            break;
          }
        }
      } catch (error) {
        console.warn(`认证端点 ${endpoint} 检查失败:`, error);
      }
    }
    
    if (!authValid) {
      console.error('❌ 所有认证检查都失败');
      authError.value = true;
      return false;
    }
    
    authError.value = false;
    return true;
    
  } catch (error) {
    console.error('认证检查失败:', error);
    authError.value = true;
    return false;
  }
};

const handleReLogin = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  authError.value = false;
  router.push('/login');
};

// 显示上传模态框
const showUploadModalHandler = () => {
  showUploadModal.value = true;
};

// 关闭上传模态框
const closeUploadModal = () => {
  showUploadModal.value = false;
};

// 处理上传成功
const handleUploadSuccess = () => {
  console.log('音乐上传成功！');
  showUploadModal.value = false;
  if (currentView.value === 'library') {
    window.dispatchEvent(new Event('refresh-music-library'));
  }
};

// 组件挂载时检查认证
onMounted(() => {
  // 监听全局播放状态变化
  window.addEventListener('playback-state-changed', (event: any) => {
    const { action, song } = event.detail
    if (action === 'play' && song) {
      musicStore.setCurrentSong(song)
      musicStore.play()
    } else if (action === 'pause') {
      musicStore.pause()
    } else if (action === 'stop') {
      musicStore.pause()
      musicStore.setCurrentTime(0)
    }
  })
  
  // 发布当前播放状态供其他组件使用
  window.dispatchEvent(new CustomEvent('playback-state-update', {
    detail: {
      currentSong: musicStore.currentSong,
      isPlaying: musicStore.isPlaying,
      currentTime: musicStore.currentTime
    }
  }))
});

// 监听路由变化，检查认证状态
watch(() => router.currentRoute.value, async () => {
  await checkAuthStatus();
});
</script>

<style scoped>
/* 整体布局 */
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
  z-index: 10;
}

.music-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 状态栏 */
.status-container {
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 0 !important;
  margin: 0 !important;
}

/* 主要内容容器 - 唯一的滚动容器 */
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  transition: transform 0.3s ease;
  
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.content-container--shifted {
  transform: translateX(clamp(80%, 300px, 100%));
}

/* 新的导航栏样式 */
.music-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(45, 10, 49, 0.8);
  border-bottom: 1px solid rgba(185, 85, 211, 0.3);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
}

.nav-left, .nav-right {
  flex: 1;
  display: flex;
}

.nav-left {
  justify-content: flex-start;
}

.nav-right {
  justify-content: flex-end;
}

.nav-center {
  flex: 2;
  display: flex;
  justify-content: center;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  text-align: center;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(185, 85, 211, 0.3);
  border-radius: 20px;
  color: #d8bfd8;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.nav-btn:hover {
  background: rgba(185, 85, 211, 0.1);
  border-color: rgba(185, 85, 211, 0.5);
  transform: translateY(-1px);
}

.nav-btn.active {
  background: linear-gradient(135deg, #b955d3, #8a2be2);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(185, 85, 211, 0.3);
}

.nav-btn i {
  font-size: 16px;
}

.btn-text {
  font-weight: 500;
}

/* 播放器视图 - 不滚动，内容自然撑开 */
.player-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 20px;
}

.player-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  min-height: 0;
  padding-bottom: 20px;
}

/* 音乐库视图 - 不滚动，内容自然撑开 */
.library-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 20px;
}

/* 悬浮上传按钮 - 核心修改：确保未hover时图标居中，hover时显示“+上传” */
.floating-upload-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px; /* 未hover：纯圆形宽度，保证图标居中 */
  height: 60px;
  border-radius: 30px; /* 保持圆形 */
  background: linear-gradient(135deg, #b955d3, #8a2be2);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(185, 85, 211, 0.3);
  transition: all 0.3s ease; /* 宽度/阴影平滑过渡 */
  z-index: 1000;
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中（未hover时图标居中关键） */
  overflow: hidden; /* 隐藏未展开的文字 */
}

/* hover时：展开按钮宽度，容纳图标+文字 */
.floating-upload-btn:hover {
  width: 120px;
  box-shadow: 0 6px 25px rgba(185, 85, 211, 0.5);
}

/* 按钮内容容器：控制图标+文字整体对齐 */
.fab-content {
  display: flex;
  align-items: center;
  justify-content: center; /* 确保整体居中，避免偏移 */
  gap: 8px; /* 图标与文字间距，优化视觉 */
  white-space: nowrap; /* 防止文字换行 */
}

/* 文字样式：未hover时隐藏（宽度0+透明），hover时展开 */
.fab-text {
  opacity: 0; /* 初始透明 */
  width: 0; /* 初始宽度0，不占用空间（避免图标偏移） */
  overflow: hidden; /* 防止文字溢出 */
  font-size: 14px;
  transition: 
    opacity 0.3s ease, 
    width 0.3s ease; /* 透明度+宽度同步过渡，效果更流畅 */
}
.fab-content i {
  font-size: 18px;
  vertical-align: middle; /* 让图标垂直居中，消除基线偏差 */
  line-height: 1; /* 重置行高，避免多余垂直空间 */
}
/* hover时：文字显示（透明变1+宽度恢复自然） */
.floating-upload-btn:hover .fab-text {
  opacity: 1;
  width: auto;
}

/* 认证错误样式 */
.auth-error {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 5, 32, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.error-content {
  text-align: center;
  background: rgba(45, 10, 49, 0.9);
  padding: 40px;
  border-radius: 16px;
  border: 1px solid #b955d3;
}

.error-content i {
  font-size: 48px;
  color: #ff6b6b;
  margin-bottom: 20px;
}

.error-content p {
  margin: 0 0 20px 0;
  font-size: 18px;
}

.relogin-btn {
  background: linear-gradient(135deg, #b955d3, #8a2be2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.progress-section {
  width: 100%;
  max-width: 400px;
  margin: 20px 0;
  padding: 0 10px;
}

/* 隐藏所有滚动条 */
.content-container::-webkit-scrollbar {
  width: 0;
  height: 0;
  background: transparent;
}

.content-container::-webkit-scrollbar-thumb {
  background: transparent;
}

.content-container::-webkit-scrollbar-track {
  background: transparent;
}

/* 响应式设计：适配平板屏幕 */
@media (max-width: 768px) {
  .music-nav-bar {
    padding: 12px 15px;
  }
  
  .nav-title {
    font-size: 16px;
  }
  
  .nav-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .nav-btn i {
    font-size: 14px;
  }
  
  .player-view, .library-view {
    padding: 0 15px;
  }
  
  /* 悬浮按钮响应式调整：保持比例 */
  .floating-upload-btn {
    bottom: 70px;
    right: 20px;
    width: 52px;
    height: 52px;
  }
  
  .floating-upload-btn:hover {
    width: 110px; /* 适配小尺寸按钮的文字宽度 */
  }
  
  .player-content {
    padding-bottom: 10px;
  }
}

/* 针对小屏幕设备的优化 */
@media (max-width: 480px) {
  .music-nav-bar {
    padding: 10px 12px;
  }
  
  .nav-title {
    font-size: 15px;
  }
  
  .nav-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .btn-text {
    display: none; /* 在小屏幕上只显示图标 */
  }
  
  .player-view, .library-view {
    padding: 0 10px;
  }
}

/* 强制隐藏所有可能的滚动条 */
:deep() ::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
}

:deep() ::-webkit-scrollbar-thumb {
  background: transparent !important;
}

:deep() ::-webkit-scrollbar-track {
  background: transparent !important;
}
</style>