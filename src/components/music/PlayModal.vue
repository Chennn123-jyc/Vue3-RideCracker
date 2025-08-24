<template>
    <div class="playlist-modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>播放列表</h3>
          <button class="close-btn" @click="closeModal">
            <i class="fa fa-times"></i>
          </button>
        </div>
        
        <!-- 使用Playlist组件 -->
        <Playlist class="playlist-container" />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import Playlist from '@/components/music/Playlist.vue';
  
  const emit = defineEmits(['close']);
  
  // 关闭弹窗
  const closeModal = () => {
    emit('close');
  };
  </script>
  
  <style scoped>
  .playlist-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }
  
  .modal-content {
    background: linear-gradient(to bottom, #2d0a31, #1a0520);
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(138, 43, 226, 0.3);
  }
  
  .modal-header h3 {
    margin: 0;
    color: #fff;
    font-size: 18px;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: #d8bfd8;
    font-size: 20px;
    cursor: pointer;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }
  
  .close-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .playlist-container {
    padding: 10px 0;
    max-height: 60vh;
    overflow-y: auto;
  }
  
  /* 动画效果 */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      transform: translateY(20px);
      opacity: 0.7;
    }
    to { 
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  /* 滚动条样式 */
  .playlist-container::-webkit-scrollbar {
    width: 6px;
  }
  
  .playlist-container::-webkit-scrollbar-track {
    background: rgba(45, 10, 49, 0.3);
    border-radius: 3px;
  }
  
  .playlist-container::-webkit-scrollbar-thumb {
    background-color: #b955d3;
    border-radius: 3px;
  }
  </style>