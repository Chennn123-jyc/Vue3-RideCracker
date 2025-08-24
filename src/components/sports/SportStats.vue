<template>
  <div class="sports-status-container">
    <div class="stats-card">
      <!-- 暂停状态指示器 -->
      <div class="paused-indicator" v-if="isPaused">
        <i class="fa fa-pause-circle"></i>
        <span>运动已暂停</span>
      </div>
      
      <!-- 速度圆环展示区域 -->
      <div class="speed-container">
        <div class="speed-display">
          <svg class="speed-ring" :width="ringSize" :height="ringSize" viewBox="0 0 100 100">
            <!-- 背景圆环 -->
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="#1a1a2e" 
              stroke-width="8"
            />
            
            <!-- 进度圆环（渐变色） -->
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="url(#speedGradient)" 
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="circumference - (speedPercentage * circumference)"
              transform="rotate(-90 50 50)"
              class="progress-ring"
            />
            
            <!-- 速度渐变定义 -->
            <defs>
              <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#4cc9f0" />
                <stop offset="100%" stop-color="#7209b7" />
              </linearGradient>
            </defs>
            
            <!-- 速度指示器圆点 -->
            <circle 
              :cx="indicatorX" 
              :cy="indicatorY" 
              r="5" 
              fill="url(#speedGradient)"
              class="speed-indicator"
            />
          </svg>
          
          <!-- 速度数值显示 -->
          <div class="speed-value">
            <span class="speed-number">{{ speed.toFixed(1) }}</span>
            <span class="speed-unit">km/h</span>
          </div>
        </div>
      </div>
      
      <!-- 辅助统计数据网格（两行两列） -->
      <div class="aux-stats-grid">
        <div class="stat-item">
          <span class="stat-label">温度</span>
          <span class="stat-value">{{ temperature }}°C</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">功率</span>
          <span class="stat-value">{{ power }}W</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">心率</span>
          <span class="stat-value">{{ heartRate }}<span class="unit-small">bpm</span></span>
        </div>
        <div class="stat-item">
          <span class="stat-label">踏频</span>
          <span class="stat-value">{{ cadence }}<span class="unit-small">rpm</span></span>
        </div>
      </div>
      
      <!-- 汇总统计数据（一行三列） -->
      <div class="summary-stats">
        <div class="summary-item">
          <span class="summary-label">时间</span>
          <span class="summary-value">{{ formattedTime }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">里程</span>
          <span class="summary-value">{{ distance.toFixed(1) }} km</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">平均速度</span>
          <span class="summary-value">{{ avgSpeed.toFixed(1) }} km/h</span>
        </div>
      </div>
      
      <!-- 运动状态指示器 -->
      <div class="status-indicator">
        <div class="status-dot" :class="{'active': isActive && !isPaused}"></div>
        <span>{{ workoutStatus }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="SportStats">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

// 组件属性定义
const props = defineProps({
  maxSpeed: {
    type: Number,
    default: 50 // 默认最大速度为50km/h
  },
  initialSpeed: {
    type: Number,
    default: 0
  },
  isActive: { // 接收运动状态
    type: Boolean,
    required: true
  },
  isPaused: { // 接收暂停状态
    type: Boolean,
    required: true
  }
});

// 响应式数据
const speed = ref(props.initialSpeed);
const distance = ref(0);
const timeInSeconds = ref(0);
const heartRate = ref(120); // 固定值
const cadence = ref(80);   // 固定值
const power = ref(200);    // 固定值
const temperature = ref(25); // 固定值
const avgSpeed = ref(0);
let workoutInterval: number | null = null;

// 圆环计算属性
const circumference = computed(() => 2 * Math.PI * 45); // 圆周长 = 2πr
const speedPercentage = computed(() => Math.min(Math.max(speed.value / props.maxSpeed, 0), 1));
const ringSize = computed(() => {
  const width = window.innerWidth;
  if (width < 480) return 150;  // 小屏幕
  if (width < 768) return 180;  // 中等屏幕
  return 200;                   // 大屏幕
});

// 计算指示器位置
const indicatorX = computed(() => {
  const angle = speedPercentage.value * 2 * Math.PI - Math.PI / 2;
  return 50 + 45 * Math.cos(angle);
});

const indicatorY = computed(() => {
  const angle = speedPercentage.value * 2 * Math.PI - Math.PI / 2;
  return 50 + 45 * Math.sin(angle);
});

// 格式化时间显示 (mm:ss)
const formattedTime = computed(() => {
  const minutes = Math.floor(timeInSeconds.value / 60);
  const seconds = timeInSeconds.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// 计算运动状态文本
const workoutStatus = computed(() => {
  if (!props.isActive) return '未开始';
  if (props.isPaused) return '已暂停';
  return '运动中';
});

// 根据运动状态更新数据
watch(() => props.isActive, (isActive) => {
  if (isActive && !props.isPaused) {
    // 开始运动
    workoutInterval = window.setInterval(() => {
      // 更新时间
      if (!props.isPaused) {
        timeInSeconds.value++;
      }
      
      // 随机小幅度变化速度（模拟真实运动）
      const change = (Math.random() - 0.5) * 2; // -1 到 1 之间的随机变化
      speed.value = Math.max(0, Math.min(props.maxSpeed, speed.value + change));
      
      // 根据速度更新距离 (km = km/h * h = km/h * (s/3600))
      if (!props.isPaused) {
        distance.value += speed.value / 3600;
      }
      
      // 更新平均速度
      avgSpeed.value = timeInSeconds.value > 0 ? 
        (distance.value / (timeInSeconds.value / 3600)) : 0;
    }, 1000);
  } else if (workoutInterval) {
    // 停止运动
    clearInterval(workoutInterval);
    workoutInterval = null;
  }
});

// 监听暂停状态
watch(() => props.isPaused, (isPaused) => {
  if (isPaused) {
    // 暂停时停止速度波动
    if (workoutInterval) {
      clearInterval(workoutInterval);
      workoutInterval = null;
    }
  } else if (props.isActive) {
    // 继续运动
    workoutInterval = window.setInterval(() => {
      // 更新时间
      timeInSeconds.value++;
      
      // 随机小幅度变化速度（模拟真实运动）
      const change = (Math.random() - 0.5) * 2; // -1 到 1 之间的随机变化
      speed.value = Math.max(0, Math.min(props.maxSpeed, speed.value + change));
      
      // 根据速度更新距离 (km = km/h * h = km/h * (s/3600))
      distance.value += speed.value / 3600;
      
      // 更新平均速度
      avgSpeed.value = timeInSeconds.value > 0 ? 
        (distance.value / (timeInSeconds.value / 3600)) : 0;
    }, 1000);
  }
});

// 清理定时器
onUnmounted(() => {
  if (workoutInterval) {
    clearInterval(workoutInterval);
  }
});
</script>

<style scoped>
.sports-status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 0;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.stats-card {
  background: linear-gradient(145deg, #1e293b, #0f172a);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.stats-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}

/* 暂停指示器 */
.paused-indicator {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #F59E0B, #FBBF24);
  color: white;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);
}

.paused-indicator i {
  font-size: 16px;
}

.speed-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  position: relative;
}

.speed-display {
  position: relative;
}

.speed-ring {
  display: block;
  margin: 0 auto;
}

.progress-ring {
  transition: stroke-dashoffset 0.5s ease-in-out;
}

.speed-indicator {
  transition: cx 0.5s ease-in-out, cy 0.5s ease-in-out;
}

.speed-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.speed-number {
  font-size: 2.2rem;
  font-weight: bold;
  background: linear-gradient(90deg, #4cc9f0, #7209b7);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.speed-unit {
  font-size: 1rem;
  color: #94a3b8;
  margin-left: 5px;
}

/* 辅助统计数据（两行两列） */
.aux-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 固定两列 */
  grid-template-rows: repeat(2, 1fr);    /* 固定两行 */
  gap: 15px;
  margin-bottom: 25px;
}

.stat-item {
  background-color: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  transition: background-color 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-item:hover {
  background-color: rgba(30, 41, 59, 0.8);
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 600;
  color: #e2e8f0;
}

.unit-small {
  font-size: 0.75rem;
  margin-left: 2px;
  color: #94a3b8;
}

/* 汇总统计数据（一行三列） */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 固定三列 */
  gap: 12px;
  margin-top: 10px;
}

.summary-item {
  text-align: center;
  padding: 12px;
  background-color: rgba(30, 41, 59, 0.3);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.summary-label {
  display: block;
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
}

/* 状态指示器 */
.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  padding: 8px;
  border-radius: 20px;
  background-color: rgba(30, 41, 59, 0.5);
  font-size: 0.9rem;
  color: #94a3b8;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #94a3b8;
}

.status-dot.active {
  background-color: #10B981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

/* 响应式调整（仅调整尺寸，不改变布局结构） */
@media (max-width: 768px) {
  .stats-card {
    padding: 15px;
  }
  
  .speed-number {
    font-size: 1.8rem;
  }
  
  .aux-stats-grid {
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .stat-item {
    padding: 12px;
  }
  
  .stat-value {
    font-size: 1.1rem;
  }
  
  .summary-stats {
    gap: 8px;
  }
  
  .summary-item {
    padding: 10px;
  }
  
  .summary-value {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .speed-number {
    font-size: 1.6rem;
  }
  
  .paused-indicator {
    font-size: 12px;
    padding: 5px 15px;
  }
}
</style>
