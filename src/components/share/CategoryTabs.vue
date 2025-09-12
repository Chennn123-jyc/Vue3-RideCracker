<template>
    <div class="category-tabs-container" :style="containerStyle">
      <!-- 横向滚动的标签容器 -->
      <div class="tabs-scroll-wrapper">
        <div class="tabs-inner">
          <button
            v-for="category in categories"
            :key="category.id"
            class="category-tab"
            :class="{ 
              'active': currentCategory === category.id,
              'sport': theme === 'sport',
              'music': theme === 'music'
            }"
            @click="handleCategoryChange(category.id)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { useMenuStore } from '@/stores/menuStore';
  
  // 定义分类项接口
  interface Category {
    id: string;
    name: string;
    icon?: string; // 可选的图标
  }
  
  // 接收的属性
  const props = defineProps<{
    // 分类列表
    categories: Category[];
    // 当前选中的分类ID（支持v-model）
    modelValue?: string;
    // 是否显示顶部边框
    showBorder?: boolean;
    // 自定义样式
    customStyle?: Record<string, string>;
  }>();
  
  // 发出的事件
  const emit = defineEmits<{
    // 分类变化事件（用于v-model）
    (e: 'update:modelValue', value: string): void;
    // 分类点击事件
    (e: 'category-click', categoryId: string): void;
  }>();
  
  // 菜单存储（用于主题）
  const menuStore = useMenuStore();
  // 当前主题
  const theme = computed(() => menuStore.theme);
  
  // 当前选中的分类
  const currentCategory = ref<string>(
    props.modelValue || (props.categories.length > 0 ? props.categories[0].id : '')
  );
  
  // 监听外部值变化
  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue) {
        currentCategory.value = newValue;
      }
    }
  );
  
  // 监听内部值变化并触发事件
  watch(
    currentCategory,
    (newValue) => {
      emit('update:modelValue', newValue);
      emit('category-click', newValue);
    }
  );
  
  // 处理分类点击
  const handleCategoryChange = (categoryId: string) => {
    currentCategory.value = categoryId;
  };
  
  // 容器样式
  const containerStyle = computed(() => {
    const baseStyle: Record<string, string> = {
      ...(props.customStyle || {})
    };
    
    if (props.showBorder) {
      baseStyle.borderBottom = theme.value === 'sport' 
        ? '1px solid rgba(6, 182, 212, 0.3)' 
        : '1px solid rgba(185, 85, 211, 0.3)';
    }
    
    return baseStyle;
  });
  </script>
  
  <style scoped>
  .category-tabs-container {
    background-color: inherit;
  }
  
  .tabs-scroll-wrapper {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch; /* 平滑滚动 */
  }
  
  .tabs-inner {
    display: flex;
    padding: 8px 16px;
    min-width: 100%;
    gap: 10px;
  }
  
  /* 隐藏滚动条但保留功能 */
  .tabs-scroll-wrapper::-webkit-scrollbar {
    display: none;
  }
  
  .tabs-scroll-wrapper {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .category-tab {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  /* 运动主题样式 */
  .category-tab.sport {
    background-color: rgba(6, 182, 212, 0.1);
    color: #06B6D4;
  }
  
  .category-tab.sport.active {
    background-color: #06B6D4;
    color: white;
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
  }
  
  /* 音乐主题样式 */
  .category-tab.music {
    background-color: rgba(185, 85, 211, 0.1);
    color: #b955d3;
  }
  
  .category-tab.music.active {
    background-color: #b955d3;
    color: white;
    box-shadow: 0 2px 8px rgba(185, 85, 211, 0.3);
  }
  
  /* 响应式调整 */
  @media (max-width: 375px) {
    .category-tab {
      padding: 6px 12px;
      font-size: 13px;
    }
  }
  </style>
  