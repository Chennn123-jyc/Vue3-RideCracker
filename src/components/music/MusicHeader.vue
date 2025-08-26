<template>
  <div class="music-header">
    <button class="back-btn" @click="$router.back()">
      <i class="fa fa-chevron-left"></i>
    </button>
    <h1 class="title">{{ title }}</h1>
    <div class="empty"></div>
  </div>
</template>

<script setup lang="ts">

const props = defineProps({
  title: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.music-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  padding-top: 20px;
  position: relative;
}

.back-btn {
  background: none;
  border: none;
  color: var(--music-text-secondary);
  font-size: 20px;
  cursor: pointer;
  /* 关键调整：绝对定位到左侧顶端 */
  position: absolute;
  left: 16px; /* 左侧空隙 */
  top: 12px;  /* 顶部空隙 */
  padding: 0;
  margin: 0;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--music-text-primary);
  margin: 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.empty {
  width: 24px;
}
</style>
  