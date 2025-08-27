<template>
  <div class="control-buttons">
    <!-- 运动模式滑动选择器 -->
    <div class="mode-selector-container">
      <div class="mode-selector-scroll" ref="modeScroll">
        <div 
          v-for="mode in modes" 
          :key="mode.id"
          :class="['mode-item', activeMode === mode.id ? 'active' : 'inactive']"
          @click="$emit('setActiveMode', mode.id)"
          :disabled="isActive && !isPaused"
        >
          <!-- 使用官方 font-awesome-icon 组件渲染 SVG 图标 -->
          <font-awesome-icon :icon="mode.icon" class="mode-icon" />
          <span>{{ mode.label }}</span>
        </div>
      </div>
      <!-- 滑动指示器 -->
      <div class="scroll-indicator">
        <div class="indicator-dot" v-for="(_, index) in modes" :key="index" 
             :class="{ active: Math.floor(currentScrollPosition / 100) === index }"></div>
      </div>
    </div>
    
    <!-- 核心操作按钮区域 -->
    <div class="main-controls-area">
      <div class="main-controls-centered">
        <div class="controls-container"> 
          <button 
            class="start-btn"
            @click="handleStart"
            v-if="!isActive"
          >
            <span>开始运动</span>
          </button>
          
          <div class="action-buttons" v-else>
            <button 
              class="pause-resume-btn"
              @click="$emit('togglePause')"
            >
              <i :class="isPaused ? 'fa fa-play' : 'fa fa-pause'"></i>
              <span>{{ isPaused ? '继续' : '暂停' }}</span>
            </button>
            
            <button 
              class="end-btn"
              @touchstart="startLongPress"
              @touchend="endLongPress"
              @mousedown="startLongPress"
              @mouseup="endLongPress"
              @mouseleave="endLongPress"
              :disabled="longPressInProgress"
            >
              <svg class="progress-ring" width="70" height="70" viewBox="0 0 70 70">
                <circle 
                  cx="35" cy="35" r="32" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.3)" 
                  stroke-width="4"
                />
                <circle 
                  cx="35" cy="35" r="32" 
                  fill="none" 
                  stroke="#10B981" 
                  stroke-width="4"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="circumference - (pressProgress * circumference)"
                  transform="rotate(-90 35 35)"
                />
              </svg>
              <i class="fa fa-flag-checkered"></i>
              <span>结束</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ControlButtons">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { SPORT_MODES } from '@/constants/sports';
import type { SportMode } from '@/constants/sports'; 

const props = defineProps<{
  isActive: boolean;
  isPaused: boolean;
  activeMode: string;
  modes: SportMode[];
}>();

const emit = defineEmits<{
  (e: 'startWorkout'): void;
  (e: 'togglePause'): void;
  (e: 'endWorkout'): void;
  (e: 'setActiveMode', mode: string): void;
}>();

// 长按计时器
let pressTimer = ref<NodeJS.Timeout | null>(null);
const pressProgress = ref(0);
const longPressInProgress = ref(false);
const circumference = 2 * Math.PI * 32; // 圆环周长
const modeScroll = ref<HTMLElement | null>(null);
const currentScrollPosition = ref(0);

// 监听 activeMode 变化，仅更新滚动位置记录
watch(() => props.activeMode, (newMode) => {
  const targetIndex = props.modes.findIndex(mode => mode.id === newMode);
  if (targetIndex !== -1) {
    currentScrollPosition.value = targetIndex * (100 + 12); 
  }
}, { immediate: true });

// 开始长按
const startLongPress = () => {
  if (pressTimer.value) return;
  
  longPressInProgress.value = true;
  pressProgress.value = 0;
  pressTimer.value = setInterval(() => {
    pressProgress.value += 0.05;
    if (pressProgress.value >= 1) {
      endLongPress();
      emit('endWorkout');
    }
  }, 50);
};

// 结束长按
const endLongPress = () => {
  if (pressTimer.value) {
    clearInterval(pressTimer.value);
    pressTimer.value = null;
    pressProgress.value = 0;
    longPressInProgress.value = false;
  }
};

const handleStart = () => {
  emit('startWorkout');
};

// 处理滑动事件
const setupScrollListener = () => {
  if (!modeScroll.value) return;
  
  modeScroll.value.addEventListener('scroll', () => {
    if (modeScroll.value) {
      currentScrollPosition.value = modeScroll.value.scrollLeft;
    }
  });
};

onMounted(() => {
  setupScrollListener();
});

onUnmounted(() => {
  if (pressTimer.value) {
    clearInterval(pressTimer.value);
  }
});
</script>

<style scoped>
/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px; 
  gap: 32px; 
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

.mode-selector-container {
  width: 100%;
  position: relative;
  z-index: 10;
}

.mode-selector-scroll {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 12px;
  padding: 8px 0 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.mode-item {
  scroll-snap-align: center;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 16px;
  min-width: 100px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.mode-item.active {
  background: linear-gradient(135deg, #06B6D4, #3B82F6);
  color: white;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
  transform: translateY(-2px);
}

.mode-item.inactive {
  background-color: rgba(30, 41, 59, 0.7);
  color: #d1d5db;
  border: 1px solid rgba(127, 137, 151, 0.3);
}

.mode-item.inactive:hover:not(:disabled) {
  background-color: rgba(30, 41, 59, 0.9);
  transform: translateY(-1px);
}

.mode-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 图标样式优化 */
.mode-icon {
  font-size: 24px; /* 调整图标大小 */
}

.mode-item span {
  font-size: 14px;
  font-weight: 500;
}

.scroll-indicator {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.indicator-dot.active {
  background-color: #06B6D4;
  width: 12px;
  border-radius: 3px;
}

.main-controls-area {
  display: flex;
  width: 100%;
  justify-content: center;
  position: relative;
  z-index: 20;
  padding: 10px 0;
}

.main-controls-centered {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.controls-container {
  width: 220px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.start-btn {
  width: 180px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(135deg, #06B6D4, #3B82F6);
  color: white;
  border: none;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  z-index: 30;
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
}

.action-buttons {
  display: flex;
  gap: 24px;
  align-items: center;
}

.pause-resume-btn, .end-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  border-radius: 50%;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  width: 80px;
  height: 80px;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 30;
}

.pause-resume-btn {
  background: linear-gradient(135deg, #F59E0B, #FBBF24);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.end-btn {
  background: linear-gradient(135deg, #EF4444, #F87171);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.end-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.pause-resume-btn:hover, .end-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.progress-ring {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 90px;
  height: 90px;
  transform: rotate(-90deg);
  pointer-events: none;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .control-buttons {
    padding: 24px 12px;
    gap: 24px;
  }
  
  .mode-item {
    min-width: 85px;
    padding: 10px 16px;
  }
  
  .mode-icon {
    font-size: 20px;
  }
  
  .mode-item span {
    font-size: 12px;
  }
  
  .controls-container {
    width: 180px;
    height: 70px;
  }
  
  .start-btn {
    width: 160px;
    height: 55px;
    font-size: 16px;
  }
  
  .pause-resume-btn, .end-btn {
    width: 70px;
    height: 70px;
    font-size: 13px;
  }
  
  .progress-ring {
    width: 80px;
    height: 80px;
  }
  
  .action-buttons {
    gap: 20px;
  }
}

@media (max-width: 380px) {
  .mode-item {
    min-width: 75px;
    padding: 8px 12px;
  }
  
  .controls-container {
    width: 160px;
    height: 65px;
  }
  
  .action-buttons {
    gap: 16px;
  }
  
  .pause-resume-btn, .end-btn {
    width: 65px;
    height: 65px;
  }
  
  .progress-ring {
    width: 75px;
    height: 75px;
  }
}
</style>
