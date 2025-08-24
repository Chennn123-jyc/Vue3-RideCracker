<template>
  <div class="progress-bar">
    <span class="time">{{ formattedCurrentTime }}</span>
    <div 
      class="progress-container" 
      :class="{ 'dragging': isDragging }"
      ref="progressContainer"  
      @click="handleClick"
      @mousedown="handleDragStart"
      @touchstart="handleDragStart"
    >
      <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      <div 
        class="progress-thumb" 
        :style="{ left: progressPercentage + '%' }"
      ></div>
    </div>
    <span class="time">{{ formattedDuration }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted ,watch} from 'vue';
import { storeToRefs } from 'pinia';
import { useMusicStore } from '@/stores/musicStore';
import useAudioPlayer from '@/composables/useAudioPlayer';

const musicStore = useMusicStore();
const player = useAudioPlayer();

// 使用 storeToRefs 获取响应式属性
const { 
  duration, 
  formattedCurrentTime, 
  formattedDuration,
  progressPercentage: storeProgress,
  currentTime
} = storeToRefs(musicStore);

const progressContainer = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const lastSetTime = ref (0); //记录上次设置的时间戳
const tempProgressPercentage = ref(0);
const targetTime = ref(0);

// 关键修复：确保在拖拽/点击时使用临时进度，其他时间使用存储进度
const progressPercentage = computed(() => {
  return isDragging.value ? tempProgressPercentage.value : storeProgress.value;
});

// 计算点击位置对应的百分比
const calculateProgress = (clientX: number) => {
  if (!progressContainer.value || duration.value === 0) return 0;
  
  const rect = progressContainer.value.getBoundingClientRect();
  let position = clientX - rect.left;
  
  // 确保位置在进度条范围内
  position = Math.max(0, Math.min(rect.width, position));
  
  return (position / rect.width) * 100;
};

// 点击进度条跳转（优化：避免闪烁）
const handleClick = (e: MouseEvent | TouchEvent) => {
  if (isDragging.value) return;
  
  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
  const percent = calculateProgress(clientX);
  
  // 记录目标时间并设置拖拽状态
  targetTime.value = (percent / 100) * duration.value;
  tempProgressPercentage.value = percent;
  isDragging.value = true;
  
  // 设置音频时间
  player.setCurrentTime(targetTime.value);
  
  // 等待音频跳转完成（添加150ms缓冲）
  setTimeout(() => {
    isDragging.value = false;
  }, 150);
};

// 拖拽开始
const handleDragStart = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  isDragging.value = true;
  
  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
  tempProgressPercentage.value = calculateProgress(clientX);
  
  // 记录初始目标时间
  targetTime.value = (tempProgressPercentage.value / 100) * duration.value;
  
  // 添加全局事件监听器
  window.addEventListener('mousemove', handleDrag);
  window.addEventListener('touchmove', handleDrag, { passive: false });
  window.addEventListener('mouseup', handleDragEnd);
  window.addEventListener('touchend', handleDragEnd);
};

// 拖拽中
const handleDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;
  e.preventDefault();
  
  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
  tempProgressPercentage.value = calculateProgress(clientX);
  
  // 更新目标时间
  targetTime.value = (tempProgressPercentage.value / 100) * duration.value;
};

// 拖拽结束
const handleDragEnd = () => {
  if (!isDragging.value) return;
  
  window.removeEventListener('mousemove', handleDrag);
  window.removeEventListener('touchmove', handleDrag);
  window.removeEventListener('mouseup', handleDragEnd);
  window.removeEventListener('touchend', handleDragEnd);

  // 设置最终目标时间
  player.setCurrentTime(targetTime.value);
  lastSetTime.value = Date.now(); // 记录设置时间
  
  // 关键修复：立即更新store中的currentTime
  musicStore.setCurrentTime(targetTime.value);
  
  // 不再延迟解除拖拽状态
  isDragging.value = false;
};


//监听currentTime变化时增加防抖判断
watch(currentTime, (newTime) => {
  if (isDragging.value) {
    if (Math.abs(newTime - targetTime.value) < 0.5) {
      isDragging.value = false;
    }
    else if (
      Math.abs(newTime - lastSetTime.value) > 0.5 || 
      Date.now() - lastSetTime.value > 300
    ) {
      tempProgressPercentage.value = (newTime / duration.value) * 100;
    }
  }
});

// 处理窗口大小变化
const handleResize = () => {
  if (isDragging.value) {
    // 重新计算进度位置
    tempProgressPercentage.value = Math.min(100, Math.max(0, tempProgressPercentage.value));
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  // 兜底：确保事件移除
  window.removeEventListener('mousemove', handleDrag);
  window.removeEventListener('touchmove', handleDrag);
  window.removeEventListener('mouseup', handleDragEnd);
  window.removeEventListener('touchend', handleDragEnd);
});
</script>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
}

.time {
  font-size: 14px;
  color: #d8bfd8;
  width: 50px;
  text-align: center;
  flex-shrink: 0;
}

.progress-container {
  flex: 1;
  height: 4px;
  background-color: rgba(216, 191, 216, 0.2);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  touch-action: none; /* 禁用触摸滚动 */
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #b955d3, #8a2be2);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #b955d3;
  box-shadow: 0 0 5px rgba(185, 85, 211, 0.8);
  transition: left 0.3s ease;
  z-index: 10;
}
</style>