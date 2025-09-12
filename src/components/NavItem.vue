<template>
  <router-link 
    :to="route"
    class="nav-item"
    :style="buttonStyle"
    @click="handleClick"
  >
    <font-awesome-icon 
      :icon="['fas', icon]" 
      class="nav-icon"
      :class="{'active': isActive}"
    />
    <span 
      class="nav-label"
      :class="{'active': isActive}"
    >
      {{ label }}
    </span>
  </router-link>
</template>

<script setup lang="ts" name="NavItem">
import { computed } from 'vue';

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  route: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  activeColor: {
    type: String,
    default: '#3B82F6'
  }
});

const emit = defineEmits(['click']);

const handleClick = () => {
  emit('click');
};

// 计算按钮样式
const buttonStyle = computed(() => {
  return {
    '--active-color': props.activeColor
  };
});
</script>

<style scoped>
.nav-item {
  background: none;
  border: none;
  outline: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex: 1;
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none; /* 移除链接下划线 */
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-icon {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
  color: #E5E7EB;
  transition: color 0.2s ease;
}

.nav-icon.active {
  color: var(--active-color, #3B82F6);
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #E5E7EB;
  transition: color 0.2s ease;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.nav-label.active {
  color: var(--active-color, #3B82F6);
  font-weight: 600;
}
</style>