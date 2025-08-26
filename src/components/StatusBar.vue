<template>
  <header 
    class="header" 
    :style="{
      backgroundColor: statusTheme.bgColor, // 动态背景色（透明）
      color: statusTheme.textColor,
      height: statusTheme.height,
    }"
  >
    <div class="header-container">
      <div class="header-left">
        <button class="menu-btn">
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
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const currentTime = ref('');
let timeInterval: NodeJS.Timeout | null = null;

// 主题配置：默认透明背景 + 音乐界面紫色按钮
const statusTheme = ref({
  bgColor: 'transparent', // 默认透明背景
  textColor: '#e5e7eb',
  menuIconColor: '#06B6D4', // 运动界面菜单图标色（青色）
  userIconColor: '#06B6D4', // 运动界面用户图标色（青色）
  height: '56px',
  padding: '0 16px'
});

// 更新主题配置（路由元信息优先）
const updateStatusTheme = () => {
  if (route.meta.statusBarTheme) {
    statusTheme.value = { ...statusTheme.value, ...route.meta.statusBarTheme };
  }
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

/* 按钮样式优化 */
.menu-btn, .user-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px; 
  padding: 8px ;
  border-radius: 8px;
  transition: all 0.3s ease;
}

/* 运动界面按钮 hover 效果（青色） */
.menu-btn:hover:not(.music-theme), 
.user-btn:hover:not(.music-theme) {
  background-color: rgba(6, 182, 212, 0.1); /* 青色透明背景 */
  transform: scale(1.05);
}


.menu-btn:hover.music-theme, 
.user-btn:hover.music-theme {
  background-color: var(--hover-bg);
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

/* 响应式适配 */
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