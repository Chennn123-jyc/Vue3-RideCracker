<template>
  <div class="vinyl-container">
    <div class="vinyl-record-wrapper" :class="{ 'playing': isPlaying }">
      <div class="vinyl-glow"></div>
      <div class="vinyl-record" :class="{ 'playing': isPlaying }">
        <div class="vinyl-texture"></div>
        <!-- 凹槽元素绑定ref，替代document查询 -->
        <div class="vinyl-grooves" ref="grooves"></div>
        <div class="album-cover">
          <img :src="coverUrl" alt="Album Cover">
        </div>
        <div class="vinyl-spindle"></div>
      </div>
      <!-- 唱臂元素绑定ref，替代document.querySelector -->
      <div class="tonearm" ref="tonearm">
        <div class="tonearm-head"></div>
        <div class="tonearm-needle"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue';

const props = defineProps<{
  isPlaying: boolean;
  coverUrl: string;
}>();

// 1. 用ref获取DOM元素，符合Vue组件化最佳实践
const grooves = ref<HTMLElement | null>(null);
const tonearm = ref<HTMLElement | null>(null);
// 2. 移除未使用的intervalId（原代码未实际使用，造成冗余）
const animationFrameId = ref<number | null>(null);
// 3. 新增旋转角度跟踪变量，避免从样式计算角度产生的累积误差
const rotationAngle = ref(0);

/**
 * 优化凹槽动画逻辑：
 * - 用独立变量track旋转角度，而非从DOM样式中反向计算
 * - 避免每次动画都解析CSS矩阵，提升性能
 */
const startGroovesAnimation = () => {
  if (!grooves.value) return;
  
  const animate = () => {
    if (!grooves.value || !props.isPlaying) return;
    
    // 累加旋转角度（每次0.5度，保持原动画速度）
    rotationAngle.value += 0.5;
    grooves.value.style.transform = `rotate(${rotationAngle.value}deg)`;
    
    // 仅在播放状态下继续请求下一帧
    animationFrameId.value = requestAnimationFrame(animate);
  };
  
  animationFrameId.value = requestAnimationFrame(animate);
};

/**
 * 监听播放状态变化：
 * - 用ref获取的tonearm替代document.querySelector，避免全局DOM查询
 * - 增加元素存在性判断，提升代码健壮性
 */
watch(() => props.isPlaying, (newVal) => {
  if (newVal) {
    // 播放：启动凹槽动画 + 唱臂落下
    startGroovesAnimation();
    tonearm.value?.classList.add('playing');
  } else {
    // 暂停：停止凹槽动画 + 唱臂抬起
    tonearm.value?.classList.remove('playing');
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value);
      animationFrameId.value = null; // 重置动画ID，避免内存泄漏
    }
  }
}, { 
  immediate: true, // 初始渲染时执行一次，确保初始状态正确
  flush: 'sync'    // 同步执行，避免状态更新延迟导致的动画闪烁
});

/**
 * 组件卸载清理：
 * - 仅清理动画帧（intervalId已移除，无需处理）
 * - 避免残留动画导致的性能问题
 */
onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
  }
});
</script>

<style scoped>
/* 黑胶唱片样式（保持原视觉效果，无修改） */
.vinyl-container {
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1000px;
  width: 100%;
  margin: 20px 0;
}

.vinyl-record-wrapper {
  position: relative;
  width: 100%;
  max-width: 380px;
  aspect-ratio: 1/1;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.vinyl-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(185, 85, 211, 0.2) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  filter: blur(15px);
  z-index: -1;
  opacity: 0.7;
}

.vinyl-record {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #111, #000, #111);
  box-shadow: 
    0 0 0 1px rgba(60, 60, 60, 0.8),
    0 0 25px rgba(0, 0, 0, 0.8),
    inset 0 0 40px rgba(0, 0, 0, 0.9);
  transform-style: preserve-3d;
  overflow: hidden;
}

.vinyl-texture {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: 
    radial-gradient(
      circle at center,
      transparent 0%,
      transparent 40%,
      rgba(255, 255, 255, 0.01) 40%,
      rgba(255, 255, 255, 0.01) 41%,
      transparent 41%,
      transparent 45%,
      rgba(255, 255, 255, 0.015) 45%,
      rgba(255, 255, 255, 0.015) 46%,
      transparent 46%
    ),
    repeating-radial-gradient(
      circle at center,
      transparent,
      transparent 1px,
      rgba(255, 255, 255, 0.02) 1px,
      rgba(255, 255, 255, 0.02) 2px
    );
  opacity: 0.8;
}

.vinyl-grooves {
  position: absolute;
  top: 8%;
  left: 8%;
  width: 84%;
  height: 84%;
  border-radius: 50%;
  background: 
    repeating-radial-gradient(
      circle,
      rgba(40, 40, 40, 0.8) 0%,
      rgba(40, 40, 40, 0.8) 0.5%,
      rgba(20, 20, 20, 0.9) 0.5%,
      rgba(20, 20, 20, 0.9) 1%
    );
  opacity: 0.9;
  /* 初始状态无旋转 */
  transform: rotate(0deg);
}

.album-cover {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 45%;
  height: 45%;
  border-radius: 50%;
  background: linear-gradient(135deg, #2a0a30, #1a0520);
  border: 3px solid #b955d3;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 
    inset 0 0 15px rgba(0, 0, 0, 0.8),
    0 0 10px rgba(185, 85, 211, 0.6);
  overflow: hidden;
  z-index: 12;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.vinyl-spindle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 7%;
  height: 7%;
  border-radius: 50%;
  background: #333;
  border: 1px solid #555;
  box-shadow: 
    inset 0 0 5px rgba(0, 0, 0, 0.8),
    0 0 5px rgba(255, 255, 255, 0.1);
  z-index: 13;
}

.tonearm {
  position: absolute;
  top: -40px;
  right: 10%;
  width: 45%;
  height: 20px;
  background: linear-gradient(to right, #444, #333, #444);
  border-radius: 10px;
  transform: rotate(-25deg); /* 初始抬起状态 */
  transform-origin: right center;
  z-index: 5;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
  transition: transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tonearm-head {
  position: absolute;
  left: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background: #555;
  border-radius: 50%;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8);
}

.tonearm-needle {
  position: absolute;
  left: -20px;
  top: 50%;
  width: 15px;
  height: 2px;
  background: #777;
  transform-origin: right center;
}

/* 播放状态动画：仅在playing类存在时生效 */
.vinyl-record.playing {
  animation: spin 20s linear infinite;
}

/* 唱臂播放状态：覆盖初始抬起角度 */
.vinyl-record-wrapper.playing .tonearm,
.tonearm.playing {
  transform: rotate(-20deg);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .vinyl-record-wrapper {
    width: 280px;
    height: 280px;
  }
  .tonearm {
    right: 10px;
  }
}
</style>