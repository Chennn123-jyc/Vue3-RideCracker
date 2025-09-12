<template>
    <div class="share-tabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-item', { active: activeTab === tab.id }]"
        @click="switchTab(tab.id)"
      >
        {{ tab.name }}
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  
  const tabs = [
    { id: 'public', name: '公共分享' },
    { id: 'personal', name: '我的笔记' }
  ]
  
  const activeTab = ref('public')
  const emit = defineEmits(['tab-change'])
  
  const switchTab = (tabId: string) => {
    activeTab.value = tabId
    emit('tab-change', tabId)
  }
  </script>
  
  <style scoped>
  .share-tabs {
    display: flex;
    background-color: #1f2937;
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 20px;
  }
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 12px 0;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s;
    font-weight: 500;
    color: #9ca3af;
  }
  
  .tab-item.active {
    background-color: #374151;
    color: #e5e7eb;
  }
  </style>