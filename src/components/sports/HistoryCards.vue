<template>
  <div class="history-cards">
    <h2 class="section-title">
      <i class="fa fa-history"></i>
      运动记录
    </h2>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <i class="fa fa-spinner fa-spin"></i>
      <p>加载中...</p>
    </div>
    
    <!-- 空状态提示 -->
    <div v-else-if="activities.length === 0" class="empty-state">
      <i class="fa fa-running"></i>
      <p>暂时还没有运动记录哦</p>
      <span>开始你的第一次运动吧！</span>
    </div>
    
    <!-- 有记录时的显示 -->
    <div v-else class="cards-container">
      <div 
        v-for="(activity, index) in activities" 
        :key="activity.id || index"
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
              @click="showDeleteConfirm(activity.id || index)"
              aria-label="删除记录"
              v-if="userStore.isLoggedIn"
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
          <!-- 显示卡路里消耗 -->
          <div class="activity-calories" v-if="activity.calories">
            <i class="fa fa-fire"></i>
            <span>消耗 {{ activity.calories }} 卡路里</span>
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
import { ref, onMounted, watch } from 'vue';
import { SPORT_MODES, SportMode } from '@/constants/sports';
import { sportService } from '@/services/sportService';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

interface ActivityRecord {
  id?: number;
  type: SportMode['label'];
  date: string;
  distance: number;
  duration: string;
  avgSpeed: number;
  color: SportMode['color'];
  calories?: number;
}

const activities = ref<ActivityRecord[]>([]);
const loading = ref(false);
const showModal = ref(false);
const currentDeleteId = ref<number | string | null>(null);

// 监听登录状态变化，重新加载数据
watch(() => userStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    loadActivitiesFromBackend();
  } else {
    loadActivitiesFromLocalStorage();
  }
});

// 从后端加载历史记录 - 修复版本
const loadActivitiesFromBackend = async () => {
  if (!userStore.isLoggedIn) {
    console.log('❌ 用户未登录，回退到本地存储');
    loadActivitiesFromLocalStorage();
    return;
  }

  loading.value = true;
  try {
    console.log('🔄 开始从后端加载运动历史...');
    
    const history = await sportService.getSportHistory(1, 20, userStore.token!);
    
    console.log('📊 后端返回的数据:', history);
    
    if (history && Array.isArray(history.items)) {
      // 转换后端数据格式为前端格式
      const backendActivities: ActivityRecord[] = history.items.map((session: any) => ({
        id: session.id,
        type: getSportLabel(session.sport_type),
        date: formatDate(session.start_time),
        distance: parseFloat(session.distance || 0),
        duration: formatDuration(session.duration || 0),
        avgSpeed: calculateAvgSpeed(session.distance, session.duration),
        color: getSportColor(session.sport_type),
        calories: session.calories || 0
      }));
      
      activities.value = backendActivities;
      console.log('✅ 用户个人运动记录加载成功，数量:', activities.value.length);
    } else {
      console.log('ℹ️ 用户暂无运动记录');
      activities.value = [];
    }
    
  } catch (error: any) {
    console.error('❌ 加载个人运动历史失败:', error);
    
    // 修改错误处理逻辑
    if (error.message.includes('使用本地存储模式') || 
        error.message.includes('无法连接到后端服务') ||
        error.message.includes('Failed to fetch')) {
      console.warn('⚠️ 后端服务不可用，自动切换到本地存储模式');
      loadActivitiesFromLocalStorage();
    } else {
      // 其他错误仍然显示错误信息
      console.error('错误详情:', error.message);
      // 提供用户友好的错误信息
      loadActivitiesFromLocalStorage(); // 确保即使出错也回退到本地存储
    }
  } finally {
    loading.value = false;
    console.log('🏁 加载完成，当前记录数:', activities.value.length);
  }
};

// 从本地存储加载活动
const loadActivitiesFromLocalStorage = () => {
  const userId = userStore.isLoggedIn ? userStore.currentUser?.id : 'anonymous';
  const storageKey = `sportActivities_${userId}`;
  
  const savedActivities = localStorage.getItem(storageKey);
  if (savedActivities) {
    try {
      const parsedActivities = JSON.parse(savedActivities) as ActivityRecord[];
      // 加载时验证数据有效性
      const validActivities = parsedActivities.filter(activity => 
        SPORT_MODES.some(mode => mode.label === activity.type) &&
        SPORT_MODES.some(mode => mode.color === activity.color)
      );
      activities.value = validActivities;
      console.log('📱 从本地存储加载用户运动记录，数量:', activities.value.length);
    } catch (e) {
      console.error('解析本地运动记录失败:', e);
      activities.value = [];
    }
  } else {
    activities.value = [];
    console.log('📱 本地暂无运动记录');
  }
};

// 辅助方法
const getSportLabel = (sportType: string): string => {
  const mode = SPORT_MODES.find(m => m.id === sportType);
  return mode?.label || sportType;
};

const getSportColor = (sportType: string): string => {
  const mode = SPORT_MODES.find(m => m.id === sportType);
  return mode?.color || 'primary';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (minutes < 1) return '刚刚';
  if (hours < 1) return `${minutes}分钟前`;
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const calculateAvgSpeed = (distance: number, duration: number): number => {
  if (duration === 0) return 0;
  const speed = (distance / (duration / 3600));
  return parseFloat(speed.toFixed(1));
};

// 动态匹配运动图标
const getSportIcon = (sportType: ActivityRecord['type']) => {
  const matchedMode = SPORT_MODES.find(mode => mode.label === sportType);
  return matchedMode ? matchedMode.icon : 'fa-running';
};

// 显示删除确认弹窗
const showDeleteConfirm = (id: number | string) => {
  currentDeleteId.value = id;
  showModal.value = true;
};

// 确认删除
const confirmDelete = async () => {
  if (currentDeleteId.value !== null) {
    try {
      // 如果是数字ID，说明是数据库记录，需要调用后端API删除
      if (typeof currentDeleteId.value === 'number' && userStore.isLoggedIn) {
        // 这里需要添加删除后端记录的API调用
        // await sportService.deleteSession(currentDeleteId.value);
        console.log('删除数据库记录:', currentDeleteId.value);
      }
      
      // 从前端列表中移除
      activities.value = activities.value.filter(activity => 
        activity.id !== currentDeleteId.value
      );
      
      // 更新本地存储
      saveActivitiesToLocalStorage();
      
    } catch (error) {
      console.error('删除记录失败:', error);
    } finally {
      showModal.value = false;
      currentDeleteId.value = null;
    }
  }
};

// 添加新活动
const addActivity = (newActivity: ActivityRecord) => {
  console.log('➕ 添加新活动:', newActivity);
  
  const isTypeValid = SPORT_MODES.some(mode => mode.label === newActivity.type);
  const isColorValid = SPORT_MODES.some(mode => mode.color === newActivity.color);
  
  if (isTypeValid && isColorValid) {
    // 添加到列表开头
    activities.value.unshift({
      ...newActivity,
      id: Date.now() // 为本地记录添加临时ID
    });
    saveActivitiesToLocalStorage();
    console.log('✅ 活动添加成功，当前记录数:', activities.value.length);
  } else {
    console.warn('添加的运动记录类型或颜色无效', newActivity);
  }
};

// 刷新数据（供父组件调用）
const refreshData = () => {
  console.log('🔄 手动刷新运动数据');
  if (userStore.isLoggedIn) {
    loadActivitiesFromBackend();
  } else {
    loadActivitiesFromLocalStorage();
  }
};

// 保存活动到本地存储
const saveActivitiesToLocalStorage = () => {
  const userId = userStore.isLoggedIn ? userStore.currentUser?.id : 'anonymous';
  const storageKey = `sportActivities_${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(activities.value));
  console.log('💾 保存用户运动记录到本地，数量:', activities.value.length);
};

// 初始化时加载数据
onMounted(() => {
  console.log('🏁 HistoryCards 组件初始化');
  if (userStore.isLoggedIn) {
    loadActivitiesFromBackend();
  } else {
    loadActivitiesFromLocalStorage();
  }
});

// 暴露方法给父组件
defineExpose({
  addActivity,
  refreshData
});
</script>

<style>
/* 颜色变量 */
:root {
  --primary-rgb: 6, 182, 212;
  --accent1-rgb: 236, 72, 153;
  --accent2-rgb: 59, 130, 246;
  --accent3-rgb: 245, 158, 11;
  --danger-rgb: 239, 68, 68;
  --dark-bg-rgb: 17, 24, 39;
}

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

/* 空状态样式 */
.empty-state, .loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  border-radius: 12px;
  background-color: rgba(30, 41, 59, 0.3);
  margin: 20px 0;
}

.empty-state i, .loading-state i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #475569;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 8px;
  color: #e2e8f0;
}

.empty-state span {
  font-size: 14px;
  color: #64748b;
}

.loading-state p {
  margin-top: 12px;
  color: #e2e8f0;
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

.card-content {
  margin-top: 8px;
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
  margin-bottom: 8px;
}

.activity-calories {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f59e0b;
  font-size: 13px;
}

.activity-calories i {
  font-size: 12px;
}

/* 弹窗样式 */
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