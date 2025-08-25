<template>
  <div class="vinyl-container">
    <div class="vinyl-record-wrapper" :class="{ 'playing': isPlaying }">
      <div class="vinyl-glow"></div>
      <div class="vinyl-record" ref="vinylRecord">
        <div class="vinyl-texture" ref="texture"></div>
        <div class="vinyl-grooves" ref="grooves"></div>
        <div class="album-cover">
          <img :src="coverUrl" alt="Album Cover">
        </div>
        <div class="vinyl-spindle"></div>
      </div>
      <div class="tonearm" ref="tonearm">
        <div class="tonearm-head"></div>
        <div class="tonearm-needle"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, onMounted, nextTick } from 'vue';

const props = defineProps<{
  isPlaying: boolean;
  coverUrl: string;
}>();

// 获取所有需要旋转的元素
const grooves = ref<HTMLElement | null>(null);
const texture = ref<HTMLElement | null>(null);
const vinylRecord = ref<HTMLElement | null>(null);
const tonearm = ref<HTMLElement | null>(null);
const animationFrameId = ref<number | null>(null);

// 旋转状态跟踪 - 使用更精确的数字类型
const rotationAngle = ref(0);
const lastUpdateTime = ref<number | null>(null);
const rotationSpeed = 0.008; // 旋转速度（度/毫秒）

/**
 * 精确应用旋转角度到所有元素
 */
const applyRotation = (angle: number) => {
  const rotation = `rotate(${angle}deg)`;
  
  if (grooves.value) {
    grooves.value.style.transform = rotation;
  }
  if (texture.value) {
    texture.value.style.transform = rotation;
  }
  if (vinylRecord.value) {
    vinylRecord.value.style.transform = rotation;
  }
};

/**
 * 启动旋转动画
 */
const startRotationAnimation = () => {
  // 确保所有元素都已加载
  if (!grooves.value || !vinylRecord.value || !texture.value) return;
  
  // 记录当前时间，用于精确计算旋转角度
  lastUpdateTime.value = Date.now();
  
  const animate = () => {
    // 如果不在播放状态，停止动画
    if (!props.isPlaying) return;
    
    // 再次检查元素是否存在
    if (!grooves.value || !vinylRecord.value || !texture.value) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - (lastUpdateTime.value || currentTime);
    lastUpdateTime.value = currentTime;
    
    // 计算旋转角度，使用更精确的计算方式
    rotationAngle.value = (rotationAngle.value + rotationSpeed * elapsed) % 360;
    
    // 应用旋转
    applyRotation(rotationAngle.value);
    
    // 继续动画
    animationFrameId.value = requestAnimationFrame(animate);
  };
  
  animationFrameId.value = requestAnimationFrame(animate);
};

/**
 * 停止旋转动画并精确保持当前角度
 */
const stopRotationAnimation = () => {
  if (animationFrameId.value) {
    // 在取消动画前，计算最后一刻的旋转角度
    if (lastUpdateTime.value && props.isPlaying) {
      const currentTime = Date.now();
      const elapsed = currentTime - lastUpdateTime.value;
      rotationAngle.value = (rotationAngle.value + rotationSpeed * elapsed) % 360;
      
      // 强制更新一次旋转状态，确保显示的是最后一刻的状态
      nextTick(() => {
        applyRotation(rotationAngle.value);
      });
    }
    
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }
  lastUpdateTime.value = null;
};

/**
 * 监听播放状态变化
 */
watch(() => props.isPlaying, (newVal) => {
  if (newVal) {
    // 播放状态：启动动画
    startRotationAnimation();
    tonearm.value?.classList.add('playing');
  } else {
    // 暂停状态：先停止动画，再更新唱臂
    stopRotationAnimation();
    tonearm.value?.classList.remove('playing');
  }
}, { immediate: true });

/**
 * 组件清理
 */
onUnmounted(() => {
  stopRotationAnimation();
});

/**
 * 初始化旋转状态
 */
onMounted(() => {
  applyRotation(rotationAngle.value);
});
</script>

<style scoped>
/* 样式保持不变，但优化了过渡效果 */
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
  /* 移除旋转过渡效果，避免暂停时的视觉延迟 */
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
  transform: rotate(0deg);
}

/* 其他样式保持不变 */
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
  transform: rotate(-25deg);
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

.vinyl-record-wrapper.playing .tonearm,
.tonearm.playing {
  transform: rotate(-20deg);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

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
