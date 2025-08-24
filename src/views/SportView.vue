<template>
  <div class="sport-view">
    <!-- 顶部状态栏 -->
    <router-view name="status"></router-view>
    <main class="main-content">
      <div class="app-header">
        <h1>骑迹运动</h1>
      </div>
      
      <div class="stats-controls-container">
        <div class="stats-section">
          <router-view name="SportStats"
            :speed="speed" 
            :time="formattedTime" 
            :distance="distance" 
            :avgSpeed="avgSpeed"
            :power="power"
            :cadence="cadence"
            :temperature="temperature"
            :heartRate="heartRate"
            :isActive="isActive"
            :isPaused="isPaused"
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
        <router-view name='HistoryCards' :activities="activities" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts" name="SportView">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

// 运动状态管理
const isActive = ref(false);
const isPaused = ref(false);
const activeMode = ref('cycling');
const startTime = ref<number | null>(null);
const pausedTime = ref<number>(0); // 暂停时累计的时间
const elapsedTime = ref(0);
const timer = ref<number | null>(null);

// 运动数据
const speed = ref(0);
const distance = ref(0);
const avgSpeed = ref(0);
const temperature = ref('--');
const power = ref('--');
const heartRate = ref('--');
const cadence = ref('--');
const currentTime = ref('10:00');

// 运动模式
const modes = ref([
  { id: 'cycling', label: '骑行', icon: 'fa-bicycle' },
  { id: 'running', label: '跑步', icon: 'fa-running' },
  { id: 'hiking', label: '徒步', icon: 'fa-hiking' },
]);

// 历史活动数据
const activities = ref([
  { 
    type: '骑行', 
    date: '昨天',
    distance: 32.5,
    duration: '1:45:22',
    avgSpeed: 18.6,
    color: 'primary'
  },
  { 
    type: '跑步', 
    date: '前天',
    distance: 10.2,
    duration: '0:58:41',
    avgSpeed: 10.4,
    color: 'accent1'
  },
  { 
    type: '徒步', 
    date: '3天前',
    distance: 8.7,
    duration: '2:15:10',
    avgSpeed: 3.9,
    color: 'accent3'
  }
]);

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
  
  // 如果是第一次开始，重置时间
  if (startTime.value === null) {
    startTime.value = Date.now();
    elapsedTime.value = 0;
  } 
  // 如果是暂停后继续，调整开始时间
  else if (isPaused.value) {
    const currentTime = Date.now();
    const pauseDuration = currentTime - pausedTime.value;
    startTime.value += pauseDuration;
  }
  
  // 开始/继续计时
  timer.value = window.setInterval(() => {
    if (startTime.value !== null) {
      elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
      
      // 每5秒更新一次运动数据
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
    // 暂停运动
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
    // 记录暂停时间点
    pausedTime.value = Date.now();
  } else {
    // 继续运动
    startWorkout();
  }
};

// 结束运动（保存数据）
const endWorkout = () => {
  isActive.value = false;
  isPaused.value = false;
  
  // 清除定时器
  if (timer.value) clearInterval(timer.value);
  timer.value = null;
  
  // 添加新活动记录
  if (elapsedTime.value > 0) {
    const modeLabel = modes.value.find(m => m.id === activeMode.value)?.label || '运动';
    activities.value.unshift({
      type: modeLabel,
      date: '刚刚',
      distance: parseFloat(distance.value.toFixed(1)),
      duration: formattedTime.value,
      avgSpeed: parseFloat(avgSpeed.value.toFixed(1)),
      color: 'primary'
    });
  }
  
  // 重置数据
  resetWorkoutData();
};

// 更新运动数据
const updateWorkoutData = () => {
  // 模拟速度变化
  const speedChange = (Math.random() - 0.5) * 2;
  speed.value = Math.max(0, Math.min(60, speed.value + speedChange));
  
  // 计算距离 (速度 km/h * 时间小时)
  const hours = elapsedTime.value / 3600;
  distance.value = parseFloat((speed.value * hours).toFixed(2));
  
  // 计算平均速度
  avgSpeed.value = hours > 0 ? parseFloat((distance.value / hours).toFixed(1)) : 0;
  
  // 模拟其他传感器数据
  temperature.value = Math.floor(Math.random() * 15 + 20).toString();
  power.value = Math.floor(Math.random() * 100 + 100).toString();
  heartRate.value = Math.floor(Math.random() * 40 + 120).toString();
  cadence.value = Math.floor(Math.random() * 20 + 70).toString();
};

// 重置运动数据
const resetWorkoutData = () => {
  speed.value = 0;
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
  // 只能在未开始或暂停时切换模式
  if (!isActive.value || isPaused.value) {
    activeMode.value = mode;
    // 切换模式时重置数据
    if (!isActive.value) {
      resetWorkoutData();
    }
  }
};

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  currentTime.value = `${hours}:${minutes}`;
};

// 初始化
onMounted(() => {
  updateCurrentTime();
  setInterval(updateCurrentTime, 60000); // 每分钟更新一次时间
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

/* 新增：状态栏容器样式，确保与音乐界面一致 */
.status-container {
  width: 100%;
  box-sizing: border-box;
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
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

/* 统一两个界面在大屏幕上的最大宽度 */
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

/* 移除可能影响状态栏宽度的样式 */
.header {
  padding: 0 !important;
  margin: 0 !important;
}
</style>
    