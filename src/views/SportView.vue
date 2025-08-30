<template>
  <div class="sport-view">
    <div class="status-container">
      <router-view name="status" />
    </div>

    <!-- GPS错误提示 -->
    <div v-if="error" class="gps-error">
      <i class="fa fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <main 
      class="main-content" 
      :class="{ 'main-content--shifted': menuStore.isOpen  }"  
    >
      <div class="app-header">
        <h1>骑迹运动</h1>
      </div>
      
      <div class="stats-controls-container">
        <div class="stats-section">
          <router-view name="SportStats"
            :gps-speed="formattedSpeed"
            :gps-distance="distance"
            :time="formattedTime" 
            :distance="distance/1000" 
            :avg-speed="avgSpeed"
            :power="power"
            :cadence="cadence"
            :temperature="temperature"
            :heart-rate="heartRate"
            :is-active="isActive"
            :is-paused="isPaused"
          />
        </div>
        
        <div class="controls-section">
          <router-view name='ControlButtons' 
            :isActive="isActive" 
            :isPaused="isPaused"
            :activeMode="activeMode"
            :modes="modes"
            @startWorkout="startWorkout"
            @togglePause="togglePause"
            @endWorkout="endWorkout"
            @setActiveMode="setActiveMode"
          />
        </div>
      </div>
      
      <div class="history-section">
        <HistoryCards ref="historyCardsRef" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts" name="SportView">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import useGPS from '@/composables/useGPS';
import HistoryCards from '@/components/sports/HistoryCards.vue';
import { SPORT_MODES, SPORT_DEFAULTS } from '@/constants/sports';
import { useMenuStore } from '@/stores/menuStore';

const menuStore = useMenuStore();

// GPS相关状态
const { 
  position, 
  error, 
  startTracking, 
  stopTracking, 
  formattedSpeed, 
  distance 
} = useGPS();

// 运动状态管理
const isActive = ref(false);
const isPaused = ref(false);
const activeMode = ref(SPORT_DEFAULTS.DEFAULT_MODE);
const startTime = ref<number | null>(null);
const pausedTime = ref<number>(0);
const elapsedTime = ref(0);
const timer = ref<number | null>(null);

// 运动数据
const avgSpeed = ref(0);
const temperature = ref('--');
const power = ref('--');
const heartRate = ref('--');
const cadence = ref('--');

// 运动模式
const modes = ref(SPORT_MODES);

// HistoryCards组件引用
const historyCardsRef = ref();

// 格式化时间
const formattedTime = computed(() => {
  const hours = Math.floor(elapsedTime.value / 3600);
  const minutes = Math.floor((elapsedTime.value % 3600) / 60);
  const seconds = elapsedTime.value % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// 开始运动
const startWorkout = () => {
  isActive.value = true;
  isPaused.value = false;
  startTracking();

  if (startTime.value === null) {
    startTime.value = Date.now();
    elapsedTime.value = 0;
  } else if (isPaused.value) {
    const currentTime = Date.now();
    const pauseDuration = currentTime - pausedTime.value;
    startTime.value += pauseDuration;
  }
  
  timer.value = window.setInterval(() => {
    if (startTime.value !== null) {
      elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
      
      if (elapsedTime.value > 0) {
        avgSpeed.value = (distance.value / 1000) / (elapsedTime.value / 3600);
      }
      
      if (elapsedTime.value % 5 === 0) {
        updateWorkoutData();
      }
    }
  }, 1000);
};

// 暂停/继续运动
const togglePause = () => {
  isPaused.value = !isPaused.value;
  
  if (isPaused.value) {
    stopTracking();
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
    pausedTime.value = Date.now();
  } else {
    startTracking();
    startWorkout();
  }
};

// 结束运动
const endWorkout = () => {
  isActive.value = false;
  isPaused.value = false;
  
  if (timer.value) clearInterval(timer.value);
  timer.value = null;
  
  if (elapsedTime.value > 0) {
    const modeLabel = modes.value.find(m => m.id === activeMode.value)?.label || '运动';
    historyCardsRef.value?.addActivity({
      type: modeLabel,
      date: '刚刚',
      distance: parseFloat((distance.value / 1000).toFixed(1)),
      duration: formattedTime.value,
      avgSpeed: parseFloat(avgSpeed.value.toFixed(1)),
      color: 'primary'
    });
  }
  
  stopTracking();
  resetWorkoutData();
};

// 更新运动数据
const updateWorkoutData = () => {
  temperature.value = Math.floor(Math.random() * 15 + 20).toString();
  power.value = Math.floor(Math.random() * 100 + 100).toString();
  heartRate.value = Math.floor(Math.random() * 40 + 120).toString();
  cadence.value = Math.floor(Math.random() * 20 + 70).toString();
};

// 重置运动数据
const resetWorkoutData = () => {
  distance.value = 0;
  avgSpeed.value = 0;
  elapsedTime.value = 0;
  startTime.value = null;
  pausedTime.value = 0;
  temperature.value = '--';
  power.value = '--';
  heartRate.value = '--';
  cadence.value = '--';
};

// 设置活动模式
const setActiveMode = (mode: string) => {
  if (!isActive.value || isPaused.value) {
    activeMode.value = mode;
    if (!isActive.value) {
      resetWorkoutData();
    }
  }
};

// 初始化
onMounted(() => {
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'geolocation' })
      .then(permissionStatus => {
        if (permissionStatus.state === 'prompt') {
          console.log('需要GPS权限来记录运动数据');
        } else if (permissionStatus.state === 'denied') {
          error.value = 'GPS权限已被拒绝,请在浏览器设置中启用';
        }
        
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'denied') {
            error.value = 'GPS权限已被拒绝,请在浏览器设置中启用';
          } else {
            error.value = null;
          }
        };
      });
  }
});

// 清理定时器
onBeforeUnmount(() => {
  if (timer.value) clearInterval(timer.value);
});
</script>

<style scoped>
.sport-view {
  background-color: #121826;
  color: #e5e7eb;
  min-height: 100vh;
  max-width: 100vw;
  overflow-x: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  position: relative; 
}

.status-container {
  width: 100%;
  box-sizing: border-box;
  padding: 0 !important;
  margin: 0 !important;
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;
  transition: transform 0.3s ease; 
}

.main-content--shifted {
  transform: translateX(clamp(80%, 300px, 100%));
}

.app-header {
  text-align: center;
  margin: 16px 0;
  padding: 0 16px;
}

.app-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #06B6D4;
}

.stats-section, .controls-section {
  width: 100%;
  padding: 0;
  margin: 0;
}

.stats-controls-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 0;
  flex-grow: 1;
  width: 100%;
  padding: 0 16px;
  overflow-x: hidden;
}

.history-section {
  padding: 0 16px;
  margin-top: 16px;
  margin-bottom: 90px;
}

@media (min-width: 768px) {
  .sport-view {
    max-width: 768px;
    margin: 0 auto;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
  }
  
  .stats-controls-container {
    flex-direction: row;
    gap: 16px;
  }
  
  .stats-section {
    flex: 3;
  }
  
  .controls-section {
    flex: 2;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.header {
  padding: 0 !important;
  margin: 0 !important;
}

.gps-error {
  background-color: #fef2f2;
  color: #dc2626;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
</style>