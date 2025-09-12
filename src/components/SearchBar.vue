<template>
  <div class="search-bar">
    <div class="search-input-container">
      <i class="fas fa-search search-icon"></i>
      <input
        type="text"
        :value="searchStore.searchQuery"
        :placeholder="placeholder"
        @input="handleInput"
        @keyup.enter="searchStore.performSearch"
        class="search-input"
      />
      <button
        v-if="searchStore.searchQuery"
        @click="searchStore.clearSearch"
        class="clear-button"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSearchStore } from '@/stores/searchStore'

const searchStore = useSearchStore()
const props = defineProps({
  placeholder: {
    type: String,
    default: '搜索...'
  }
})

// 添加防抖处理
let searchTimeout: NodeJS.Timeout | null = null
const handleInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  searchStore.searchQuery = value
  
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    searchStore.performSearch()
  }, 300)
}
</script>