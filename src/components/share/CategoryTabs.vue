<template>
  <div class="category-tabs-container" :style="containerStyle">
    <!-- 横向滚动的标签容器 -->
    <div class="tabs-scroll-wrapper" ref="scrollWrapper">
      <!-- 滚动指示器（仅在可滚动时显示） -->
      <div 
        class="scroll-indicator left" 
        v-if="showLeftIndicator"
        @click="scrollLeft"
      ></div>
      
      <div class="tabs-inner" ref="tabsInner">
        <button
          v-for="category in categories"
          :key="category.id"
          class="category-tab"
          :class="{ 
            'active': currentCategory === category.id,
            'sport': theme === 'sport',
            'music': theme === 'music',
            'share': theme === 'share'
          }"
          @click="handleCategoryChange(category.id)"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
          ref="categoryTabs"
        >
          <!-- 可选图标 -->
          <font-awesome-icon 
            :icon="category.icon" 
            v-if="category.icon" 
            class="category-icon"
          />
          {{ category.name }}
        </button>
      </div>
      
      <div 
        class="scroll-indicator right" 
        v-if="showRightIndicator"
        @click="scrollRight"
      ></div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useMenuStore } from '@/stores/menuStore';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

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
  // 自动滚动到选中项
  autoScroll?: boolean;
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

// DOM引用
const scrollWrapper = ref<HTMLDivElement | null>(null);
const tabsInner = ref<HTMLDivElement | null>(null);
const categoryTabs = ref<HTMLButtonElement[]>([]);

// 状态管理
const currentCategory = ref<string>(
  props.modelValue || (props.categories.length > 0 ? props.categories[0].id : '')
);
const showLeftIndicator = ref(false);
const showRightIndicator = ref(false);
const isTouching = ref(false);
const touchStartX = ref(0);
const scrollPosition = ref(0);

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue !== currentCategory.value) {
      currentCategory.value = newValue
      console.log('外部值变化，更新分类为:', currentCategory.value)
      if (props.autoScroll !== false) {
        scrollToActiveCategory()
      }
    }
  },
  { immediate: true } // 添加立即执行
)

// 监听内部值变化并触发事件
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue !== currentCategory.value) {
      currentCategory.value = newValue;
      if (props.autoScroll !== false) {
        scrollToActiveCategory();
      }
    }
  },
  { immediate: true }  // 添加 immediate: true 确保初始值同步
);

// 监听滚动位置，显示/隐藏滚动指示器
const handleScroll = () => {
  if (!scrollWrapper.value) return;
  
  const { scrollLeft, scrollWidth, clientWidth } = scrollWrapper.value;
  scrollPosition.value = scrollLeft;
  
  // 显示左侧指示器（当不是最左侧时）
  showLeftIndicator.value = scrollLeft > 10;
  
  // 显示右侧指示器（当不是最右侧时）
  showRightIndicator.value = scrollLeft < scrollWidth - clientWidth - 10;
};

// 处理分类点击
const handleCategoryChange = (categoryId: string) => {
  currentCategory.value = categoryId;
  emit('update:modelValue', categoryId);
  emit('category-click', categoryId);
};

// 触摸开始处理
const handleTouchStart = (e: TouchEvent) => {
  isTouching.value = true;
  touchStartX.value = e.touches[0].clientX;
};

// 触摸结束处理
const handleTouchEnd = (e: TouchEvent) => {
  isTouching.value = false;
  const touchEndX = e.changedTouches[0].clientX;
  const diffX = touchEndX - touchStartX.value;
  
  // 滑动超过一定距离视为切换操作
  if (Math.abs(diffX) > 30) {
    const currentIndex = props.categories.findIndex(c => c.id === currentCategory.value);
    if (diffX > 0 && currentIndex > 0) {
      // 向左滑动，切换到上一个分类
      handleCategoryChange(props.categories[currentIndex - 1].id);
    } else if (diffX < 0 && currentIndex < props.categories.length - 1) {
      // 向右滑动，切换到下一个分类
      handleCategoryChange(props.categories[currentIndex + 1].id);
    }
  }
};

// 滚动到左侧
const scrollLeft = () => {
  if (scrollWrapper.value) {
    scrollWrapper.value.scrollBy({ left: -200, behavior: 'smooth' });
  }
};

// 滚动到右侧
const scrollRight = () => {
  if (scrollWrapper.value) {
    scrollWrapper.value.scrollBy({ left: 200, behavior: 'smooth' });
  }
};

// 滚动到当前选中的分类
const scrollToActiveCategory = async () => {
  await nextTick(); // 等待DOM更新
  
  const activeTab = categoryTabs.value.find(tab => 
    tab.classList.contains('active')
  );
  
  if (activeTab && scrollWrapper.value) {
    // 计算滚动位置，使选中项居中
    const tabRect = activeTab.getBoundingClientRect();
    const wrapperRect = scrollWrapper.value.getBoundingClientRect();
    const scrollPosition = scrollWrapper.value.scrollLeft + 
      (tabRect.left - wrapperRect.left) - 
      (wrapperRect.width / 2) + 
      (tabRect.width / 2);
    
    scrollWrapper.value.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  }
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

// 组件挂载时初始化
onMounted(() => {
  if (scrollWrapper.value) {
    scrollWrapper.value.addEventListener('scroll', handleScroll);
    // 初始检查滚动位置
    handleScroll();
    
    // 初始滚动到选中项
    if (props.autoScroll !== false) {
      setTimeout(scrollToActiveCategory, 100);
    }
  }
  
  // 监听窗口大小变化，重新检查滚动指示器状态
  window.addEventListener('resize', handleScroll);
  
  // 清理函数
  return () => {
    if (scrollWrapper.value) {
      scrollWrapper.value.removeEventListener('scroll', handleScroll);
    }
    window.removeEventListener('resize', handleScroll);
  };
});
</script>
  
<style scoped>
.category-tabs-container {
  background-color: inherit;
  position: relative;
}

.tabs-scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch; /* 平滑滚动 */
  position: relative;
}

.tabs-inner {
  display: flex;
  padding: 6px 12px;
  min-width: 100%;
  gap: 8px;
  transition: transform 0.3s ease-out;
}

/* 隐藏滚动条但保留功能 */
.tabs-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.tabs-scroll-wrapper {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 滚动指示器 */
.scroll-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30px;
  z-index: 10;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.scroll-indicator.left {
  left: 0;
  background: linear-gradient(to right, white 70%, transparent 100%);
}

.scroll-indicator.right {
  right: 0;
  background: linear-gradient(to left, white 70%, transparent 100%);
}

.category-tab {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0); /* 硬件加速 */
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 图标样式 */
.category-icon {
  font-size: 14px;
}

/* 触摸反馈 */
.category-tab:active {
  transform: scale(0.96);
}

.category-tab:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* 运动主题样式 */
.category-tab.sport {
  background-color: rgba(6, 182, 212, 0.1);
  color: #06B6D4;
}

.category-tab.sport.active {
  background-color: #0596b1; /* 更深的蓝色 */
  color: white;
  box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4); /* 更明显的阴影 */
  transform: translateY(-2px); /* 上移更多 */
}

/* 音乐主题样式 */
.category-tab.music {
  background-color: rgba(185, 85, 211, 0.1);
  color: #b955d3;
}

.category-tab.music.active {
  background-color: #a04aa8; /* 更深的紫色 */
  color: white;
  box-shadow: 0 6px 16px rgba(185, 85, 211, 0.4); /* 更明显的阴影 */
  transform: translateY(-2px); /* 上移更多 */
}

/* 添加分享主题样式 */
.category-tab.share {
  background-color: rgba(138, 43, 226, 0.1);
  color: #8A2BE2;
}

.category-tab.share.active {
  background-color: #7a29c7; /* 更深的紫色 */
  color: white;
  box-shadow: 0 6px 16px rgba(138, 43, 226, 0.4);
  transform: translateY(-2px);
}

/* 确保所有主题的激活状态都有明显的视觉差异 */
.category-tab.active {
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
/* 响应式调整 */
@media (max-width: 480px) {
  .category-tab {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .scroll-indicator {
    width: 20px;
  }
}

@media (max-width: 360px) {
  .tabs-inner {
    padding: 4px 8px;
    gap: 6px;
  }
  
  .category-tab {
    padding: 5px 10px;
    font-size: 12px;
  }
}
</style>
