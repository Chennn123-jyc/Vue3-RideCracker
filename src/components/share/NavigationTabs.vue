<template>
  <div class="navigation-tabs">
    <router-link 
      v-for="tab in tabs"
      :key="tab.id"
      :to="tab.path" 
      class="tab-link"
      :class="{ active: isTabActive(tab) }"
      replace
    >
      {{ tab.name }}
    </router-link>
  </div>
</template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  
  const route = useRoute();
  
  const tabs = computed(() => [
    { id: 'public', name: '公共分享', path: '/share/public' },
    { id: 'personal', name: '个人笔记', path: '/share/personal' }
  ]);

  const isTabActive = (tab: any) => {
    if (tab.id === 'public') {
      // 公共分享标签激活条件：当前路径以'/share/public'开头
      return route.path.startsWith('/share/public');
    } else {
      // 个人笔记标签激活条件：精确匹配
      return route.path === tab.path;
    }
  };
  </script>
  

  <style scoped>
/* 导航选项卡容器 */
.navigation-tabs {
  display: flex;
  background-color: transparent; /* 完全透明背景，无框感 */
  padding: 0 20px; /* 左右留白，避免选项贴边 */
  gap: 40px; /* 选项间距放大，增强呼吸感 */
  position: sticky;
  top: 60px; /* 与顶部状态栏高度对齐 */
  z-index: 10; /* 确保在内容上方 */
}

/* 选项卡基础样式 */
.tab-link {
  padding: 18px 0; /* 垂直方向扩大点击区域 */
  font-size: 16px;
  font-weight: 500;
  color: var(--light-text-color); /* 未选中文字：浅色调，与背景融合 */
  text-decoration: none;
  position: relative; /* 用于下划线定位 */
  transition: color 0.25s ease; /* 颜色过渡动画 */
  white-space: nowrap; /* 防止文字换行 */
}

/* 当前页激活状态 */
.tab-link.active {
  color: var(--primary-color); /* 选中文字：主题主色，突出显示 */
  font-weight: 600;
}

/* 激活状态下划线（核心标识） */
.tab-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%; /* 下划线宽度与文字一致 */
  height: 3px;
  background-color: var(--primary-color); /* 下划线与文字同色 */
  border-radius: 3px 3px 0 0; /* 顶部圆角，柔和边缘 */
  transition: transform 0.25s ease; /* 下划线过渡动画 */
  transform-origin: bottom center;
}

/* 非激活状态hover效果 */
.tab-link:not(.active):hover {
  color: var(--primary-color); /* hover时文字变色，增强交互反馈 */
  opacity: 0.8; /* 略淡于激活状态，避免混淆 */
}

/* 小屏幕适配 */
@media (max-width: 768px) {
  .navigation-tabs {
    gap: 28px; /* 小屏幕缩减间距，避免溢出 */
    padding: 0 16px;
  }
  
  .tab-link {
    font-size: 15px;
    padding: 16px 0;
  }
  
  .tab-link.active::after {
    height: 2.5px; /* 小屏幕下划线稍细，更精致 */
  }
}
</style>