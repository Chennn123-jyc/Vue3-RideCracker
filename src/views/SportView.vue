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
import { sportService, type GPSPoint } from '@/services/sportService';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
const currentSessionId = ref<number | null>(null);
const gpsTracks = ref<GPSPoint[]>([]);

const menuStore = useMenuStore();

// GPS相关状态
const { 
  position, 
  error, 
  startTracking, 
  stopTracking, 
  formattedSpeed, 
  distance,
  getCurrentPosition  // 使用修复后的方法
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
const startWorkout = async () => {
  if (!userStore.isLoggedIn) {
    alert('请先登录以保存运动数据');
    return;
  }

  isActive.value = true;
  isPaused.value = false;
  
  try {
    // 开始GPS追踪
    startTracking();
    
    // 创建运动会话
    const sessionData = {
      sport_type: activeMode.value,
      start_time: new Date().toISOString()
    };
    
    const result = await sportService.startSession(sessionData, userStore.token!);
    currentSessionId.value = result.sessionId;
    
    // 开始计时器
    if (startTime.value === null) {
      startTime.value = Date.now();
      elapsedTime.value = 0;
    } else if (isPaused.value) {
      const currentTime = Date.now();
      const pauseDuration = currentTime - pausedTime.value;
      startTime.value += pauseDuration;
    }
    
    timer.value = window.setInterval(async () => {  // 添加 async
      if (startTime.value !== null) {
        elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
        
        if (elapsedTime.value > 0) {
          avgSpeed.value = (distance.value / 1000) / (elapsedTime.value / 3600);
        }
        
        // 每5秒更新一次运动数据
        if (elapsedTime.value % 5 === 0) {
          updateWorkoutData();
        }
        
        // 记录GPS轨迹点（每分钟记录一次）
        if (elapsedTime.value % 60 === 0) {
          const trackPoint = getCurrentPosition();
          if (trackPoint) {
            gpsTracks.value.push(trackPoint);
            
            // 实时上传轨迹点（可选）
            if (currentSessionId.value) {
              try {
                await sportService.recordGPSTracks(
                  currentSessionId.value, 
                  [trackPoint], 
                  userStore.token!
                );
              } catch (error) {
                console.error('上传轨迹点失败:', error);
                // 不阻止主流程，只记录错误
              }
            }
          }
        }
      }
    }, 1000);
    
  } catch (error) {
    console.error('开始运动失败:', error);
    alert('开始运动失败，请重试');
    isActive.value = false;
    stopTracking();
  }
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
// 结束运动
const endWorkout = async () => {
  isActive.value = false;
  isPaused.value = false;
  
  if (timer.value) clearInterval(timer.value);
  timer.value = null;
  
  try {
    if (currentSessionId.value && elapsedTime.value > 0) {
      // 计算卡路里（简化计算）
      const calories = calculateCalories(activeMode.value, elapsedTime.value, avgSpeed.value);
      
      console.log('👤 当前用户:', userStore.currentUser?.id, userStore.currentUser?.username);
      console.log('📊 运动数据:', {
        duration: elapsedTime.value,
        distance: distance.value,
        avgSpeed: avgSpeed.value,
        calories: calories
      });
      
      // 结束运动会话
      await sportService.endSession(
        currentSessionId.value,
        {
          end_time: new Date().toISOString(),
          calories: calories,
          distance: distance.value / 1000,
          steps: calculateSteps(activeMode.value, distance.value)
        },
        gpsTracks.value,
        userStore.token!
      );
      
      console.log('✅ 运动数据已保存到数据库，关联用户:', userStore.currentUser?.id);
      
      // 重要：立即刷新历史记录，从后端加载最新数据
      setTimeout(() => {
        historyCardsRef.value?.refreshData();
      }, 1000);
    }
    
    // 同时保存到本地历史记录（按用户隔离）
    const modeLabel = modes.value.find(m => m.id === activeMode.value)?.label || '运动';
    const activity = {
      type: modeLabel,
      date: '刚刚',
      distance: parseFloat((distance.value / 1000).toFixed(1)),
      duration: formattedTime.value,
      avgSpeed: parseFloat(avgSpeed.value.toFixed(1)),
      color: 'primary',
      calories: calculateCalories(activeMode.value, elapsedTime.value, avgSpeed.value)
    };

    historyCardsRef.value?.addActivity(activity);
    
    console.log('📝 运动记录已添加到本地历史');
    
  } catch (error) {
    console.error('❌ 结束运动失败:', error);
    alert('保存运动数据失败，但本地记录已保存');
  } finally {
    stopTracking();
    resetWorkoutData();
    currentSessionId.value = null;
    gpsTracks.value = [];
  }
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

// 添加辅助计算方法
const calculateCalories = (sportType: string, duration: number, speed: number): number => {
  // 简化的卡路里计算，实际应用中应该更精确
  const baseCalories = {
    cycling: 0.05,
    running: 0.08,
    hiking: 0.06,
    walking: 0.04,
    swimming: 0.07,
    basketball: 0.08
  };
  
  const multiplier = baseCalories[sportType as keyof typeof baseCalories] || 0.05;
  return Math.round(multiplier * duration * speed);
};

const calculateSteps = (sportType: string, distance: number): number => {
  // 简化的步数计算
  if (sportType === 'running' || sportType === 'walking') {
    return Math.round(distance / 0.0007); // 假设平均步长0.7米
  }
  return 0;
};
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