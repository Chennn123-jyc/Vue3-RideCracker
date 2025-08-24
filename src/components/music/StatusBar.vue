<template>
  <div class="status-bar">
    <span class="time">14:30</span>
    <div class="status-icons">
      <i class="fa fa-signal"></i>
      <i class="fa fa-wifi"></i>
      <i class="fa fa-battery-three-quarters"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const time = ref('00:00');

const updateTime = () => {
  const now = new Date();
  time.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

onMounted(() => {
  updateTime();
  const timer = setInterval(updateTime, 60000);
  
  // 清理定时器
  onUnmounted(() => clearInterval(timer));
});
</script>

<style scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 12px;
  color: #fff;
}

.status-icons {
  display: flex;
  gap: 4px;
}
</style>
