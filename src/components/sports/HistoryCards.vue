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
            <i 
              class="fa"
              :class="activity.type === '骑行' ? 'fa-bicycle' : activity.type === '跑步' ? 'fa-running' : 'fa-hiking'"
              :style="`color: rgb(var(--${activity.color}-rgb));`"
            ></i>
          </div>
          <span class="activity-date">{{ activity.date }}</span>
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
  </div>
</template>

<script setup lang="ts" name="HistoryCards">

const props = defineProps<{
  activities: Array<{
    type: string;
    date: string;
    distance: number;
    duration: string;
    avgSpeed: number;
    color: string;
  }>;
}>();
</script>

<style>
/* 定义颜色变量 */
:root {
  --primary-rgb: 6, 182, 212;
  --accent1-rgb: 236, 72, 153;
  --accent2-rgb: 59, 130, 246;
  --accent3-rgb: 245, 158, 11;
}

.history-cards {
  margin-top: 24px;
  
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
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
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
</style>