<template>
    <div class="upload-container">
      <input 
        type="file" 
        ref="fileInput" 
        accept="audio/*" 
        @change="handleFileUpload"
        class="file-input"
      />
      <button class="upload-btn" @click="triggerFileInput">
        <i class="fa fa-upload"></i> 上传歌曲
      </button>
    </div>
</template>
  
  // UploadMusic.vue
  <script setup lang="ts">
  import { ref, onUnmounted } from 'vue';
  import { useMusicStore } from '@/stores/musicStore';
  import type { Song } from '@/types/music';
  import useAudioPlayer from '@/composables/useAudioPlayer';
  
  const fileInput = ref<HTMLInputElement | null>(null);
  const musicStore = useMusicStore();
  
  // 补充缺失的响应式变量
  const isUploading = ref(false);
  const errorMessage = ref('');
  const objectUrls = ref<string[]>([]);
    const player = useAudioPlayer();
    
  // 实现 cleanupResources 函数
  const cleanupResources = (audio: HTMLAudioElement, url: string) => {
    audio.src = '';
    URL.revokeObjectURL(url);
    const index = objectUrls.value.indexOf(url);
    if (index !== -1) {
      objectUrls.value.splice(index, 1);
    }
  };
  
  // 实现 resetUploadState 函数
  const resetUploadState = (input: HTMLInputElement) => {
    isUploading.value = false;
    input.value = ''; // 清空文件输入框
  };
  
  const triggerFileInput = () => {
    fileInput.value?.click();
  };
  
  const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const url = URL.createObjectURL(file);
  isUploading.value = true;
  errorMessage.value = '';

  // 创建歌曲对象
  const newSong: Song = {
    id: `uploaded-${Date.now()}`,
    title: file.name.replace(/\.[^/.]+$/, ''),
    artist: '未知艺术家',
    album: '上传歌曲',
    coverUrl: '/images/default-cover.jpg',
    url: url,
    duration: 0,
    lyrics: []
  };

  // 直接使用 store 方法添加歌曲
  musicStore.addToPlaylist(newSong);
  musicStore.setCurrentSong(newSong);

  // 直接使用全局播放器获取时长
  player.initPlayer(url);
  
  player.audio.value?.addEventListener('loadedmetadata', () => {
    newSong.duration = player.audio.value?.duration || 0;
    musicStore.setDuration(player.audio.value?.duration || 0);
    
    // 播放歌曲
    musicStore.setCurrentSong(newSong);
    musicStore.play();
    resetUploadState(input);
  });
  
  
};
  
  // 组件卸载时清理资源（可选，防止内存泄漏）
  onUnmounted(() => {
    objectUrls.value.forEach(url => {
      URL.revokeObjectURL(url);
    });
  });
  </script>
  <style scoped>
  .upload-container {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }
  
  .file-input {
    display: none;
  }
  
  .upload-btn {
    background: linear-gradient(135deg, #b955d3, #8a2be2);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 25px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  }
  
  .upload-btn:hover {
    box-shadow: 0 0 15px rgba(185, 85, 211, 0.5);
    transform: translateY(-2px);
  }
  
  .upload-btn i {
    font-size: 18px;
  }
  </style>