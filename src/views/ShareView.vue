<template>
  <div class="share-view" :style="viewStyle">
    <!-- 状态栏 - 会随页面正常滚动 -->
    <!-- <StatusBar :theme="statusBarTheme" /> -->
    
    <!-- 导航和分类标签容器 -->
    <div 
      class="nav-and-category-container" 
      :class="{ fixed: isContainerFixed }"
      :style="containerStyle"
      ref="containerRef"
    >
      <!-- 导航选项卡 -->
      <div class="navigation-tabs-container" v-if="!showSearch">
        <div class="tabs-center-wrapper">
          <NavigationTabs />
        </div>
        <button class="search-icon-btn" @click="toggleSearch">
          <font-awesome-icon icon="search" />
        </button>
      </div>
      
      <!-- 搜索框 -->
      <div class="search-container" v-else>
        <SearchBar
          v-model="searchQuery"
          placeholder="搜索精彩内容..."
          :show-search-button="false"
          @search="handleSearch"
          @clear="clearSearch"
          :container-styles="searchBarStyles"
          ref="searchBarRef"
        />
        <button class="cancel-search-btn" @click="toggleSearch">取消</button>
      </div>
      
    </div>
    
    <!-- 占位元素，当容器固定时保持布局稳定 -->
    <div 
      class="container-placeholder" 
      :style="{ height: containerHeight + 'px' }"
      v-if="isContainerFixed"
    ></div>
    
    <!-- 内容区域 -->
    <div class="share-content">
      <div class="router-view-container">
        <router-view 
          v-slot="{ Component }"
        >
          <transition name="fade-slide" mode="out-in">
            <component 
              :is="Component" 
              :currentCategory="currentCategory"
              @category-change="handleCategoryChange" 
            />
          </transition>
        </router-view>
      </div>
    </div>
    
    <!-- 其他组件 -->
    <FloatingAddButton 
      v-if="$route.path === '/share/personal'"
      @click="showNoteForm = true"
    />
    
    <BottomNavigation />
    
    <NoteForm 
      :isVisible="showNoteForm"
      :noteToEdit="noteToEdit"
      @close="closeNoteForm"
      @saved="handleNoteSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick,watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusBar from '@/components/StatusBar.vue'
import BottomNavigation from '@/components/BottomNavigation.vue'
import SearchBar from '@/components/SearchBar.vue'
import NavigationTabs from '@/components/share/NavigationTabs.vue'
import FloatingAddButton from '@/components/share/FloatingAddButton.vue'
import NoteForm from '@/components/share/NoteForm.vue'
import { useTheme } from '@/composables/useTheme'
import { useMenuStore } from '@/stores/menuStore'
import { useNoteStore, type Note } from '@/stores/noteStore'

// 初始化状态
const menuStore = useMenuStore();
const noteStore = useNoteStore();
const { themeVariables, applyTheme } = useTheme();
const route = useRoute();
const router = useRouter();

// 响应式状态
const activeTab = ref('public');
const currentCategory = ref('all');
const searchQuery = ref('');
const showNoteForm = ref(false);
const noteToEdit = ref<Note | null>(null);
const showSearch = ref(false);
const searchBarRef = ref<InstanceType<typeof SearchBar> | null>(null);

// 滚动固定相关状态
const containerRef = ref<HTMLElement | null>(null);
const isContainerFixed = ref(false);
const containerHeight = ref(0);
const containerTop = ref(0);

// 常量数据
const categories = [
  { id: 'all', name: '全部' },
  { id: 'sport', name: '运动' },
  { id: 'music', name: '音乐' },
  { id: 'food', name: '美食' },
  { id: 'travel', name: '旅行' }
]

// 计算属性
const statusBarTheme = computed(() => {
  const primaryColor = themeVariables.value['--theme-primary'];
  return {
    bgColor: 'transparent',
    textColor: '#ffffff',
    menuIconColor: primaryColor,
    userIconColor: primaryColor
  }
})

const viewStyle = computed(() => {
  return {
    '--primary-color': themeVariables.value['--theme-primary'],
    '--secondary-color': themeVariables.value['--theme-secondary'],
    '--tertiary-color': themeVariables.value['--theme-border'],
    '--text-color': themeVariables.value['--theme-text'],
    '--light-text-color': themeVariables.value['--theme-text-light'],
    '--background-color': themeVariables.value['--theme-bg'],
    '--card-color': themeVariables.value['--theme-card-bg']
  }
})

const containerStyle = computed(() => {
  if (isContainerFixed.value) {
    return {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '90',
      width: '100%'
    }
  }
  return {}
})

const categoryTabsStyle = computed(() => {
  return {
    borderBottom: isContainerFixed.value ? '1px solid var(--tertiary-color)' : 'none'
  }
})

const searchBarStyles = computed(() => ({
  padding: '0',
  borderBottom: 'none'
}))

// 方法
const handleScroll = () => {
  if (!containerRef.value) return
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const containerRect = containerRef.value.getBoundingClientRect()
  
  // 当容器顶部滚动到视口顶部时固定它
  if (scrollTop > containerTop.value && !isContainerFixed.value) {
    isContainerFixed.value = true
  } else if (scrollTop <= containerTop.value && isContainerFixed.value) {
    isContainerFixed.value = false
  }
}

const handleSearch = () => {
  console.log('搜索:', searchQuery.value)
}

const clearSearch = () => {
  searchQuery.value = ''
}

const handleCategoryChange = (categoryId: string) => {
  currentCategory.value = categoryId
}

const handleEditNote = (note: Note) => {
  noteToEdit.value = note
  showNoteForm.value = true
}

const handleNoteSaved = (note: Note) => {
  console.log('笔记已保存:', note)
}

const closeNoteForm = () => {
  showNoteForm.value = false
  noteToEdit.value = null
}

const toggleSearch = async () => {
  showSearch.value = !showSearch.value
  if (showSearch.value) {
    await nextTick()
    if (searchBarRef.value && searchBarRef.value.$el) {
      const input = searchBarRef.value.$el.querySelector('input')
      if (input) input.focus()
    }
  } else {
    searchQuery.value = ''
  }
  
  // 搜索状态变化后更新容器高度
  await nextTick()
  updateContainerDimensions()
}

const updateContainerDimensions = () => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.offsetHeight
    containerTop.value = containerRef.value.offsetTop
  }
}

// 生命周期
onMounted(() => {
  applyTheme();
  menuStore.setTheme('share');
  
  // 初始化容器尺寸
  updateContainerDimensions()
  
  // 添加滚动监听
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', updateContainerDimensions)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateContainerDimensions)
})

// 路由监听
watch(() => route.path, (newPath) => {
  if (newPath === '/share/public') {
    activeTab.value = 'public'
  } else if (newPath === '/share/personal') {
    activeTab.value = 'personal'
  }
  showSearch.value = false
})

// 初始化路由
if (route.path === '/share') {
  router.replace('/share/public')
}
</script>

<style scoped>
.share-view {
  min-height: 100vh;
  background-color: var(--background-color);
  color: var(--text-color);
  padding-bottom: env(safe-area-inset-bottom);
  transition: all 0.3s ease;
}

/* 导航和分类容器 */
.nav-and-category-container {
  background-color: var(--card-color);
  transition: all 0.3s ease;
  z-index: 90;
}

.nav-and-category-container.fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

/* 占位元素 */
.container-placeholder {
  width: 100%;
}

/* 导航选项卡容器 */
.navigation-tabs-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 60px;
}

.tabs-center-wrapper {
  display: flex;
  justify-content: center;
  flex: 1;
}

.search-icon-btn {
  background: none;
  border: none;
  color: var(--light-text-color);
  cursor: pointer;
  padding: 10px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
  margin-left: auto;
}

.search-icon-btn:hover {
  color: var(--primary-color);
}

/* 搜索容器 */
.search-container {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  height: 60px;
}

.cancel-search-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  padding: 10px 16px;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 500;
}

.share-content {
  padding: 0 16px;
}

.category-tabs {
  margin: 0;
}

.router-view-container {
  padding-bottom: 20px;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .share-content {
    padding: 0 12px;
  }
  
  .navigation-tabs-container {
    padding: 0 12px;
  }
  
  .search-container {
    padding: 10px 12px;
  }
}
</style>