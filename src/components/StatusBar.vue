<template>
  <div class="status-bar-wrapper">
    <header 
      class="header" 
      :style="{
        backgroundColor: statusTheme.bgColor,
        color: statusTheme.textColor,
        height: statusTheme.height,
      }"
    >
      <div class="header-container">
        <div class="header-left">
          <button class="menu-btn" @click="toggleMenu">
            <i 
              class="fa fa-bars" 
              :style="{ color: statusTheme.menuIconColor }"  
            ></i>
          </button>
          <span class="current-time">{{ currentTime }}</span>
        </div>
        
        <div class="header-right">
          <button class="user-btn">
            <i 
              class="fa fa-user-circle" 
              :style="{ color: statusTheme.userIconColor }"  
            ></i>
          </button>
        </div>
      </div>
    </header>
    
    <!-- 侧边菜单 -->
    <SideMenu 
      :isOpen="menuStore.isOpen" 
      :theme="menuStore.theme"
      @close-menu="menuStore.closeMenu" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue';
import { useRoute } from 'vue-router';
import SideMenu from '@/components/settings/SideMenu.vue';
import { useMenuStore } from '@/stores/menuStore'; 
import { ThemeType } from '@/styles/theme'; 

const route = useRoute();
const menuStore = useMenuStore();
const currentTime = ref('');
let timeInterval: NodeJS.Timeout | null = null;

// 定义 props
defineProps({
  theme: {
    type: Object,
    default: () => ({
      bgColor: 'transparent',
      textColor: '#e5e7eb',
      menuIconColor: '#06B6D4',
      userIconColor: '#06B6D4',
      height: '56px',
      padding: '0 16px'
    })
  }
});

const emit = defineEmits<{
  (e: 'openMenu'): void
}>();

// 主题配置
const statusTheme = ref({
  bgColor: 'transparent',
  textColor: '#e5e7eb',
  menuIconColor: '#06B6D4',
  userIconColor: '#06B6D4',
  height: '56px',
  padding: '0 16px'
});

// 更新主题配置
const updateStatusTheme = () => {
  if (route.meta.statusBarTheme) {
    statusTheme.value = { ...statusTheme.value, ...route.meta.statusBarTheme };
  }
  
  // 新增：通过 matched 数组查找 theme
  let theme: ThemeType = 'sport'; // 默认主题
  for (const record of route.matched) {
    if (record.meta.theme) {
      theme = record.meta.theme as ThemeType;
      break;
    }
  }
  menuStore.setTheme(theme);
  console.log('设置主题:', theme);
};
watch(() => route.name, updateStatusTheme, { immediate: true });

// 切换菜单
const toggleMenu = () => {
  menuStore.toggleMenu();
  emit('openMenu'); 
};

// 时间更新逻辑
const updateCurrentTime = () => {
  const now = new Date();
  currentTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

onMounted(() => {
  updateCurrentTime();
  timeInterval = setInterval(updateCurrentTime, 60000);
  updateStatusTheme();
});

// 路由切换时更新主题
watch(() => route.meta.statusBarTheme, updateStatusTheme, { immediate: true });

// 组件卸载清理
onBeforeUnmount(() => {
  if (timeInterval) clearInterval(timeInterval);
});
</script>

<style scoped>
.status-bar-wrapper {
  position: relative;
  z-index: 1000;
}

/* 保持原有样式不变 */
.header {
    width: 100%;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px; 
    background-color: rgba(0, 0, 0, 0.4);
    color: #e5e7eb;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%; 
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 16px; 
}

.menu-btn, .user-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px; 
  padding: 8px ;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.menu-btn:hover, .user-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.current-time {
  font-size: 18px;
  font-weight: 500;
  color: inherit; 
}

.status-icon {
  color: inherit; 
  font-size: 18px; 
}

@media (max-width: 375px) {
  .header-left, .header-right {
    gap: 12px; 
  }
  
  .current-time, .status-icon {
    font-size: 16px; 
  }
  
  .menu-btn, .user-btn {
    font-size: 18px; 
    padding: 6px 10px;
  }
}
</style>