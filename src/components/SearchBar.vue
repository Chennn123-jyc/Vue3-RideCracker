<template>
  <div class="search-bar-container" :style="containerStyle">
    <div class="search-bar" :class="{ focused: isFocused }">
      <div class="search-input-container">
        <font-awesome-icon icon="search" class="search-icon" />
        <input
          type="text"
          :value="modelValue"
          :placeholder="placeholder"
          @input="handleInput"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @keyup.enter="handleSearch"
          ref="inputRef"
          class="search-input"
        />
        <button
          v-if="modelValue"
          @click="clearSearch"
          class="clear-button"
          aria-label="清除搜索"
        >
          <font-awesome-icon icon="times" />
        </button>
      </div>
      
      <button
        v-if="showSearchButton"
        @click="handleSearch"
        class="search-button"
        :disabled="!modelValue"
      >
        搜索
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

<style scoped>
.search-bar-container {
  width: 100%;
  flex: 1;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  width: 100%;
}

.search-input-container {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  background-color: var(--card-color);
  border: 2px solid var(--tertiary-color);
  border-radius: 24px;
  padding: 0 16px;
  transition: all 0.3s ease;
  height: 48px; /* 增加搜索框高度 */
}

.search-bar.focused .search-input-container {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.search-icon {
  color: var(--light-text-color);
  margin-right: 12px;
  font-size: 18px; /* 增大图标 */
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-color);
  font-size: 16px; /* 增大字体 */
  padding: 14px 0; /* 增加内边距 */
  width: 100%;
  height: 100%;
}

.search-input::placeholder {
  color: var(--light-text-color);
  font-size: 16px; /* 增大placeholder字体 */
}

.clear-button {
  background: none;
  border: none;
  color: var(--light-text-color);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 16px;
}

.clear-button:hover {
  background-color: rgba(139, 92, 246, 0.1);
  color: var(--primary-color);
}

.search-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 12px 24px; /* 增大按钮 */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-size: 16px;
  height: 48px; /* 与输入框高度一致 */
}

.search-button:hover:not(:disabled) {
  background-color: var(--secondary-color);
  transform: translateY(-1px);
}

.search-button:disabled {
  background-color: var(--tertiary-color);
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 480px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-button {
    align-self: flex-end;
    margin-top: 8px;
  }
  
  .search-input-container {
    height: 44px;
  }
  
  .search-input {
    font-size: 16px; /* 保持移动端字体大小 */
  }
}
</style>