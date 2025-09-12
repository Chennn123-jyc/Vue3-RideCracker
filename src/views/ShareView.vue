<!-- views/ShareView.vue -->
<template>
  <div class="share-view" :style="viewStyle">
    <StatusBar :theme="statusBarTheme" />
    
    <!-- 顶部导航标签 -->
    <div class="navigation-tabs">
      <router-link 
        to="/share/public" 
        class="tab-link"
        :class="{ active: $route.name === 'share-public' }"
      >
        公共分享
      </router-link>
      <router-link 
        to="/share/personal" 
        class="tab-link"
        :class="{ active: $route.name === 'share-personal' }"
      >
        个人笔记
      </router-link>
    </div>
    
    <div class="share-container">
      <!-- 公共分享页面的搜索和分类 -->
      <template v-if="$route.path === '/share/public'">
        <!-- 美化后的搜索栏 -->
        <div class="search-section">
          <div class="search-bar-wrapper">
            <i class="fas fa-search search-icon"></i>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="搜索精彩内容..."
              class="search-input"
              @input="handleSearch"
            />
            <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <!-- 分类标签 -->
        <CategoryTabs 
          :categories="categories"
          v-model:modelValue="currentCategory"
          @category-click="handleCategoryChange"
          class="category-tabs"
        />
      </template>
      
      <!-- 路由视图 -->
      <router-view 
        v-slot="{ Component }"
        v-bind="routeProps"
        @create-note="showNoteForm = true"
        @edit-note="handleEditNote"
      >
        <transition name="fade-slide" mode="out-in">
          <component :is="Component"/>
        </transition>
      </router-view>
    </div>
    
    <!-- 添加笔记的浮动按钮 (仅在个人笔记页面显示) -->
    <button 
      v-if="$route.path === '/share/personal'" 
      class="floating-add-btn"
      @click="showNoteForm = true"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
    
    <!-- 底部导航 -->
    <BottomNavigation />
    
    <!-- 笔记表单模态框 -->
    <NoteForm 
      :isVisible="showNoteForm"
      :noteToEdit="noteToEdit"
      @close="closeNoteForm"
      @saved="handleNoteSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusBar from '@/components/StatusBar.vue'
import BottomNavigation from '@/components/BottomNavigation.vue'
import CategoryTabs from '@/components/share/CategoryTabs.vue'
import NoteForm from '@/components/share/NoteForm.vue'
import { useTheme } from '@/composables/useTheme'
import { useMenuStore } from '@/stores/menuStore'
import { useNoteStore, type Note } from '@/stores/noteStore'

// 定义接口
interface Share {
  id: number;
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  liked: boolean;
  comments: any[];
  category: string;
}

// 初始化状态
const menuStore = useMenuStore();
const noteStore = useNoteStore();
const { currentTheme, themeVariables, applyTheme } = useTheme();
const route = useRoute();
const router = useRouter();

// 响应式状态
const activeTab = ref('public');
const currentCategory = ref('all');
const searchQuery = ref('');
const showNoteForm = ref(false);
const noteToEdit = ref<Note | null>(null);
const filteredSharesData = ref<Share[]>([]);

// 计算属性，根据当前路由返回不同的属性
const routeProps = computed(() => {
  if (route.name === 'share-public') {
    return { filteredShares: filteredSharesData.value }
  } else if (route.name === 'share-personal') {
    return { notes: noteStore.notes }
  }
  return {}
})

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

// 方法
const fetchShares = async () => {
  // 这里应该是从API获取数据的逻辑
  filteredSharesData.value = [
    {
      id: 1,
      user: {
        id: 1,
        username: "测试用户",
        avatar: "/default-avatar.png"
      },
      content: "这是一个测试分享内容",
      timestamp: new Date().toISOString(),
      likes: 5,
      liked: false,
      comments: [],
      category: "sport"
    }
  ];
};

const handleSearch = () => {
  console.log('搜索:', searchQuery.value)
}

const clearSearch = () => {
  searchQuery.value = ''
}

const handleCategoryChange = (categoryId: string) => {
  currentCategory.value = categoryId
}

// 处理编辑笔记
const handleEditNote = (note: Note) => {
  noteToEdit.value = note
  showNoteForm.value = true
}

// 处理笔记保存
const handleNoteSaved = (note: Note) => {
  console.log('笔记已保存:', note)
  // 这里可以添加其他逻辑，比如显示成功消息等
}

// 关闭笔记表单
const closeNoteForm = () => {
  showNoteForm.value = false
  noteToEdit.value = null
}

// 路由监听
watch(() => route.path, (newPath) => {
  if (newPath === '/share/public') {
    activeTab.value = 'public'
  } else if (newPath === '/share/personal') {
    activeTab.value = 'personal'
  }
})

// 初始化路由
if (route.path === '/share') {
  router.replace('/share/public')
}

// 应用主题
onMounted(() => {
  applyTheme();
  fetchShares();
  menuStore.setTheme('share');
});

// 监听主题变化
watch(currentTheme, () => {
  applyTheme();
});
</script>

<style scoped>
/* 保持原有的样式不变 */
.share-view {
  min-height: 100vh;
  background-color: var(--background-color);
  color: var(--text-color);
  padding-bottom: env(safe-area-inset-bottom);
  transition: all 0.3s ease;
}

.navigation-tabs {
  display: flex;
  background-color: var(--card-color);
  border-bottom: 1px solid var(--tertiary-color);
  padding: 0 16px;
  position: sticky;
  top: 60px;
  z-index: 10;
}

.tab-link {
  flex: 1;
  text-align: center;
  padding: 16px 0;
  font-weight: 500;
  color: var(--light-text-color);
  text-decoration: none;
  position: relative;
  transition: color 0.3s ease;
}

.tab-link.active {
  color: var(--primary-color);
  font-weight: 600;
}

.tab-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 3px 3px 0 0;
}

.share-container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 20px;
}

.search-bar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--card-color);
  border-radius: 24px;
  padding: 8px 16px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  transition: box-shadow 0.3s ease;
}

.search-bar-wrapper:focus-within {
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.25);
}

.search-icon {
  color: var(--light-text-color);
  margin-right: 12px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-color);
  font-size: 16px;
  padding: 8px 0;
}

.search-input::placeholder {
  color: var(--light-text-color);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--light-text-color);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.clear-btn:hover {
  background-color: rgba(139, 92, 246, 0.1);
  color: var(--primary-color);
}

.category-tabs {
  margin-bottom: 24px;
}

.floating-add-btn {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.floating-add-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.5);
}

.floating-add-btn:active {
  transform: translateY(0) scale(0.95);
}

.floating-add-btn svg {
  width: 24px;
  height: 24px;
  stroke: white;
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
  .share-container {
    padding: 12px;
  }
  
  .navigation-tabs {
    padding: 0 12px;
  }
  
  .tab-link {
    padding: 14px 0;
    font-size: 14px;
  }
  
  .floating-add-btn {
    bottom: 80px;
    right: 16px;
    width: 56px;
    height: 56px;
  }
  
  .floating-add-btn svg {
    width: 20px;
    height: 20px;
  }
}
</style>