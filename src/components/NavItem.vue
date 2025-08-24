<template>
    <button 
      @click="$router.push(route)"
      class="nav-item"
    >
      <font-awesome-icon 
        :icon="['fas', icon]" 
        class="nav-icon"
        :class=" {'active':isActive}"
      />
      <span 
        class="nav-label"
        :class=" {'active':isActive}"
      >
        {{ label }}
      </span>
    </button>
  </template>

<script setup lang="ts" name="NavItem">

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
  }
})
</script>

<style scoped>
button {
  background: none;
  border: none;
}

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
}
.nav-item:active {
  transform: scale(0.95);
}
.nav-icon {
  font-size: 1.25rem; /* 20px */
  margin-bottom: 0.25rem; /* 4px */
  color: #9CA3AF; /* 默认图标颜色 - gray-400 */
  transition: color 0.2s ease;
}
.nav-icon.active {
  color: #3B82F6; /* 激活状态颜色 - blue-500 */
}
.nav-label {
  font-size: 0.75rem; /* 12px */
  font-weight: 500; /* medium font weight */
  color: #9CA3AF; /* 默认文字颜色 - gray-400 */
  transition: color 0.2s ease;
  letter-spacing: 0.025em; /* 轻微字母间距 */
  text-transform: uppercase; /* 大写文本 */
}
.nav-label.active {
  color: #3B82F6; /* 激活状态颜色 - blue-500 */
  font-weight: 600; /* 激活状态更粗 */
}
</style>