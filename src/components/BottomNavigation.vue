<template>
    <div class="bottom-navigation">
        <div class="nav-items-container">
            <nav-item
                icon="bicycle"
                label="运动"
                route="/"
                :is-active="activeTab === 'sport'"
                @click="setActiveTab('sport')"
                active-color="#3B82F6"
            />
            <nav-item 
                icon="share-alt" 
                label="分享" 
                route="/share"
                :is-active="activeTab === 'share'"
                @click="setActiveTab('share')"
                active-color="#10B981"
            />
            <nav-item 
                icon="music" 
                label="音乐" 
                route="/music"
                :is-active="activeTab === 'music'"
                @click="setActiveTab('music')"
                active-color="#8B5CF6"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavItem from './NavItem.vue';

const route = useRoute();
const router = useRouter();
const activeTab = ref('sport');

// 根据当前路由设置激活状态
const updateActiveTab = () => {
  if (route.name === 'sport' || route.name === 'sport-main') {
    activeTab.value = 'sport';
  } else if (route.name === 'music' || route.name?.toString().startsWith('music')) {
    activeTab.value = 'music';
  } else if (route.name === 'share' || route.name?.toString().startsWith('share')) {
    activeTab.value = 'share';
  }
};

// 点击导航项的处理
const setActiveTab = async (tabId: string) => {
  activeTab.value = tabId;
  localStorage.setItem('activeTab', tabId);
  
  try {
    // 使用setTimeout确保DOM更新完成后再进行路由跳转
    setTimeout(() => {
      if (tabId === 'sport') {
        router.push('/');
      } else if (tabId === 'music') {
        router.push('/music');
      } else if (tabId === 'share') {
        router.push('/share/public');
      }
    }, 50);
  } catch (error) {
    console.error('路由跳转错误:', error);
  }
};

// 监听路由变化
watch(() => route.name, updateActiveTab, { immediate: true });

onMounted(() => {
  const savedTab = localStorage.getItem('activeTab');
  if (savedTab) {
    activeTab.value = savedTab;
  }
});
</script>

<style scoped>
.bottom-navigation{
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #111827;
    z-index: 50;
    padding-bottom: env(safe-area-inset-bottom);
    border-top: 1px solid #1f2937;
    width: 100%;
    margin: 0;
    max-width: 100vw;
}
.nav-items-container{
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 4rem;
    padding: 0 8px;
    box-sizing: border-box;
}
</style>