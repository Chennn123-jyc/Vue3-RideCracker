<template>
  <div class="app-container">
    <RouterView class="router-view"/>
  </div>
  <BottomNavigation class="bottom-nav"/>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import BottomNavigation from './components/BottomNavigation.vue';
import { useUserStore } from './stores/userStore';


// 初始化用户状态
const userStore = useUserStore();
userStore.init();
</script>

<style scoped>
.app-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #121826;
  width: 100vw;
  height: 100vh;
}

.router-view {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; 
  width: 100%;
  height: calc(100vh - 4rem);
  padding-bottom: env(safe-area-inset-bottom); 
  scrollbar-width: none; 
  -ms-overflow-style: none;
}

.router-view::-webkit-scrollbar {
  display: none;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background-color: #111827;
  padding-bottom: env(safe-area-inset-bottom);
}

html,body,#app{
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>