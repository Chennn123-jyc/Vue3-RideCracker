<!-- src/components/music/MusicHeader.vue -->
<template>
    <div class="music-header">
      <button class="back-btn" @click="$router.back()">
        <i class="fa fa-chevron-left"></i>
      </button>
      <h1 class="title">{{ title }}</h1>
      <div class="empty"></div>
    </div>
  </template>
  
  <script setup lang="ts">
  
  const props = defineProps({
    title: {
      type: String,
      required: true
    }
  });
  </script>
  
  <style scoped>
  .music-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 44px;
    padding: 0 16px;
  }
  
  .back-btn {
    background: none;
    border: none;
    color: var(--music-text-secondary);
    font-size: 20px;
    cursor: pointer;
  }
  
  .title {
    font-size: 18px;
    font-weight: 600;
    color: var(--music-text-primary);
    margin: 0;
  }
  
  .empty {
    width: 24px;
  }
  </style>