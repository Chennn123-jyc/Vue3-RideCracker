<template>
  <div class="history-cards">
    <h2 class="section-title">
      <i class="fa fa-history"></i>
      运动记录
    </h2>
    
    <div class="cards-container">
      <div 
        v-for="(activity, index) in activities" 
        :key="index"
        class="activity-card"
        :style="`
          background-color: rgba(var(--${activity.color}-rgb), 0.1);
          border-color: rgba(var(--${activity.color}-rgb), 0.2);
          box-shadow: 0 4px 6px -1px rgba(var(--${activity.color}-rgb), 0.1);
        `"
      >
        <div class="card-header">
          <div 
            class="activity-icon"
            :style="`background-color: rgba(var(--${activity.color}-rgb), 0.2);`"
          >
            <!-- 动态匹配运动图标：从 SPORT_MODES 中获取，无需硬编码 -->
            <i 
              class="fa"
              :class="getSportIcon(activity.type)"
              :style="`color: rgb(var(--${activity.color}-rgb));`"
            ></i>
          </div>
          <div class="header-actions">
            <span class="activity-date">{{ activity.date }}</span>
            <button 
              class="delete-btn" 
              @click="showDeleteConfirm(index)"
              aria-label="删除记录"
            >
              <i class="fa fa-trash-o"></i>
            </button>
          </div>
        </div>
        
        <div class="card-content">
          <h3 class="activity-title">
            {{ activity.distance }}km {{ activity.type }}
          </h3>
          <div class="activity-details">
            <span>{{ activity.duration }}</span>
            <span>平均速度 {{ activity.avgSpeed }} km/h</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 删除确认弹窗 -->
    <div class="modal-overlay" v-if="showModal">
      <div class="modal">
        <h3 class="modal-title">确认删除</h3>
        <p class="modal-message">您确定要删除这条运动记录吗？此操作不可撤销。</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showModal = false">取消</button>
          <button class="confirm-btn" @click="confirmDelete">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="HistoryCards">
import { ref, onMounted } from 'vue';
// 1. 引入运动常量和类型（从集中定义的 sports.ts 中导入）
import { SPORT_MODES, SportMode } from '@/constants/sports';

// 2. 定义运动记录类型（关联 SportMode，确保类型安全）
interface ActivityRecord {
  type: SportMode['label']; // 运动类型名称（与 SportMode.label 一致）
  date: string;
  distance: number;
  duration: string;
  avgSpeed: number;
  color: SportMode['color']; // 运动颜色（与 SportMode.color 一致）
}

// 3. 历史活动数据（初始数据也使用 SPORT_MODES 定义的颜色和类型）
const activities = ref<ActivityRecord[]>([
  { 
    type: '骑行', // 对应 SPORT_MODES 中 id: 'cycling' 的 label
    date: '昨天',
    distance: 32.5,
    duration: '1:45:22',
    avgSpeed: 18.6,
    color: 'primary' // 对应 SPORT_MODES 中 'cycling' 的 color
  },
  { 
    type: '跑步', // 对应 SPORT_MODES 中 id: 'running' 的 label
    date: '前天',
    distance: 10.2,
    duration: '0:58:41',
    avgSpeed: 10.4,
    color: 'accent1' // 对应 SPORT_MODES 中 'running' 的 color
  },
  { 
    type: '徒步', // 对应 SPORT_MODES 中 id: 'hiking' 的 label
    date: '3天前',
    distance: 8.7,
    duration: '2:15:10',
    avgSpeed: 3.9,
    color: 'accent3' // 对应 SPORT_MODES 中 'hiking' 的 color
  }
]);

// 弹窗相关状态
const showModal = ref(false);
const currentIndex = ref(-1);

// 4. 动态匹配运动图标：根据运动类型（label）从 SPORT_MODES 中获取对应 icon
const getSportIcon = (sportType: ActivityRecord['type']) => {
  // 从集中定义的 SPORT_MODES 中查找匹配的运动模式
  const matchedMode = SPORT_MODES.find(mode => mode.label === sportType);
  // 有匹配则返回对应 icon，无匹配返回默认图标
  return matchedMode ? matchedMode.icon : 'fa-sport';
};

// 显示删除确认弹窗
const showDeleteConfirm = (index: number) => {
  currentIndex.value = index;
  showModal.value = true;
};

// 确认删除
const confirmDelete = () => {
  if (currentIndex.value !== -1) {
    activities.value.splice(currentIndex.value, 1);
    saveActivitiesToLocalStorage();
    showModal.value = false;
    currentIndex.value = -1;
  }
};

// 5. 添加新活动（确保新记录的 color 与 SPORT_MODES 一致）
const addActivity = (newActivity: ActivityRecord) => {
  // 可选：验证新活动的类型和颜色是否在 SPORT_MODES 中存在（增强健壮性）
  const isTypeValid = SPORT_MODES.some(mode => mode.label === newActivity.type);
  const isColorValid = SPORT_MODES.some(mode => mode.color === newActivity.color);
  
  if (isTypeValid && isColorValid) {
    activities.value.unshift(newActivity);
    saveActivitiesToLocalStorage();
  } else {
    console.warn('添加的运动记录类型或颜色无效，参考 SPORT_MODES 定义', newActivity);
  }
};

// 从本地存储加载活动
const loadActivitiesFromLocalStorage = () => {
  const savedActivities = localStorage.getItem('sportActivities');
  if (savedActivities) {
    try {
      const parsedActivities = JSON.parse(savedActivities) as ActivityRecord[];
      // 加载时验证数据有效性（避免本地存储的旧数据格式错误）
      const validActivities = parsedActivities.filter(activity => 
        SPORT_MODES.some(mode => mode.label === activity.type) &&
        SPORT_MODES.some(mode => mode.color === activity.color)
      );
      activities.value = validActivities;
    } catch (e) {
      console.error('Failed to parse saved activities', e);
    }
  }
};

// 保存活动到本地存储
const saveActivitiesToLocalStorage = () => {
  localStorage.setItem('sportActivities', JSON.stringify(activities.value));
};

// 初始化时加载本地存储的活动
onMounted(() => {
  loadActivitiesFromLocalStorage();
});

// 暴露方法给父组件
defineExpose({
  addActivity
});
</script>

<style>
/* 定义颜色变量（与 SPORT_MODES 中的 color 对应） */
:root {
  --primary-rgb: 6, 182, 212;    /* 对应 SPORT_MODES 中 color: 'primary' */
  --accent1-rgb: 236, 72, 153;   /* 对应 SPORT_MODES 中 color: 'accent1' */
  --accent2-rgb: 59, 130, 246;   /* 对应 SPORT_MODES 中 color: 'accent2' */
  --accent3-rgb: 245, 158, 11;   /* 对应 SPORT_MODES 中 color: 'accent3' */
  --danger-rgb: 239, 68, 68;
  --dark-bg-rgb: 17, 24, 39;
}

/* 原有样式不变，无需修改 */
.history-cards {
  margin-top: 24px;
  position: relative;
}

.section-title {
  display: flex;
  align-items: center;
  color: #e5e7eb;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.section-title i {
  color: #06B6D4;
  margin-right: 8px;
}

.cards-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding-bottom: 1rem;
}

@media (min-width: 768px) {
  .cards-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

.activity-card {
  border-radius: 16px;
  padding: 16px;
  border: 1px solid;
  transition: all 0.3s;
  position: relative;
}

.activity-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
}

.activity-date {
  color: #9ca3af;
  font-size: 12px;
}

.delete-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s;
  padding: 4px;
  border-radius: 4px;
}

.delete-btn:hover {
  color: rgb(var(--danger-rgb));
  background-color: rgba(var(--danger-rgb), 0.1);
}

.activity-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: white;
}

.activity-details {
  display: flex;
  justify-content: space-between;
  color: #9ca3af;
  font-size: 14px;
}

/* 弹窗样式不变 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}

.modal {
  background-color: rgb(var(--dark-bg-rgb));
  border-radius: 12px;
  width: 90%;
  max-width: 350px;
  padding: 24px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
  animation: scaleIn 0.2s ease;
}

.modal-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
}

.modal-message {
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 24px;
  text-align: center;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 14px;
}

.cancel-btn {
  background-color: rgba(255, 255, 255, 0.1);
  color: #e5e7eb;
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.confirm-btn {
  background-color: rgb(var(--danger-rgb));
  color: white;
}

.confirm-btn:hover {
  background-color: rgba(var(--danger-rgb), 0.9);
  box-shadow: 0 4px 6px -1px rgba(var(--danger-rgb), 0.2);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>