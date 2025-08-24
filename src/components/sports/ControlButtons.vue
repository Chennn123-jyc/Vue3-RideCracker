<template>
  <div class="control-buttons">
    <!-- 运动模式切换 -->
    <div class="mode-selector">
      <button 
        v-for="mode in filteredModes" 
        :key="mode.id"
        :class="['mode-btn', activeMode === mode.id ? 'active' : 'inactive']"
        @click="$emit('setActiveMode', mode.id)"
        :disabled="isActive && !isPaused"
      >
        <i :class="`fa ${mode.icon}`"></i>
        <span>{{ mode.label }}</span>
      </button>
    </div>
    
    <!-- 核心操作按钮 -->
    <button 
      class="start-btn"
      @click="handleStart"
      v-if="!isActive"
    >
      <span>开始</span>
    </button>
    
    <div class="action-buttons" v-else>
      <!-- 暂停/继续按钮 -->
      <button 
        class="pause-resume-btn"
        @click="$emit('togglePause')"
      >
        <i :class="isPaused ? 'fa fa-play' : 'fa fa-pause'"></i>
        <span>{{ isPaused ? '继续' : '暂停' }}</span>
      </button>
      
      <!-- 结束按钮（长按） -->
      <button 
        class="end-btn"
        @touchstart="startLongPress"
        @touchend="endLongPress"
        @mousedown="startLongPress"
        @mouseup="endLongPress"
        @mouseleave="endLongPress"
        :disabled="longPressInProgress"
      >
        <!-- 长按进度环 -->
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
    
    <!-- 次要控制按钮 -->
    <div class="secondary-controls">
      <button class="history-btn">
        <i class="fa fa-history"></i>
        <span>历史</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts" name="ControlButtons">
import { computed , ref } from 'vue';

const props = defineProps<{
  isActive: boolean;
  isPaused: boolean;
  activeMode: string;
  modes: Array<{
    id: string;
    label: string;
    icon: string;
  }>;
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

// 过滤出只需要的两个模式：骑行和跑步
const filteredModes = computed(() => {
  return props.modes.filter(mode => 
    mode.id === 'cycling' || mode.id === 'running'
  );
});

const handleStart = () => {
  emit('startWorkout');
};

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
</script>

<style scoped>
.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  gap: 8px;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  flex-wrap: wrap;
}

.mode-selector {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 20px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 70px;
}

.mode-btn.active {
  background: linear-gradient(90deg, #10B981, #34D399);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.mode-btn.inactive {
  background-color: #1E293B;
  color: #d1d5db;
  border: 1px solid rgba(127, 137, 151, 0.5);
}

.mode-btn.inactive:hover:not(:disabled) {
  background-color: rgba(30, 41, 59, 0.8);
}

.mode-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.start-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(90deg, #06B6D4, #3B82F6);
  color: white;
  border: none;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
              0 2px 4px -1px rgba(0, 0, 0, 0.06),
              0 0 20px rgba(59, 130, 246, 0.5);
  cursor: pointer;
  transition: transform 0.3s;
  z-index: 10;
}

.start-btn:hover {
  transform: scale(1.05);
}

.action-buttons {
  display: flex;
  gap: 16px;
  align-items: center;
}

.pause-resume-btn, .end-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px;
  border-radius: 50%;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  width: 70px;
  height: 70px;
  position: relative;
  transition: transform 0.2s;
}

.pause-resume-btn {
  background: linear-gradient(90deg, #F59E0B, #FBBF24);
  color: white;
}

.end-btn {
  background: linear-gradient(90deg, #EF4444, #F87171);
  color: white;
}

.end-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.progress-ring {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 80px;
  height: 80px;
  transform: rotate(-90deg);
  pointer-events: none;
}

.secondary-controls {
  display: flex;
  flex: 1;
  justify-content: flex-end;
}

.history-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 20px;
  background-color: #1E293B;
  color: #d1d5db;
  border: 1px solid rgba(127, 137, 151, 0.5);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  min-width: 70px;
}

.history-btn:hover {
  background-color: rgba(30, 41, 59, 0.8);
}

@media (max-width: 480px) {
  .mode-btn, .history-btn {
    padding: 6px 10px;
    min-width: 60px;
    font-size: 12px;
  }
  
  .start-btn, .pause-resume-btn, .end-btn {
    width: 60px;
    height: 60px;
    font-size: 16px;
  }
  
  .progress-ring {
    width: 70px;
    height: 70px;
    top: -5px;
    left: -5px;
  }
  .control-buttons{
    flex-wrap: wrap;
  }
  .mode-selector{
    flex-wrap: wrap;
  }

  
}
</style>