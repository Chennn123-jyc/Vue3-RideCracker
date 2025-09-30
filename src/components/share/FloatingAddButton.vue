<template>
    <button 
      class="floating-add-btn"
      @click="$emit('click')"
    >
      <font-awesome-icon icon="plus" />
    </button>
  </template>
  
  <script setup lang="ts">
  defineEmits(['click']);
  </script>
  
  <style scoped>
  .floating-add-btn {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    border: none;
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .floating-add-btn:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.5);
  }
  
  .floating-add-btn:active {
    transform: translateY(0) scale(0.95);
  }
  
  @media (max-width: 768px) {
    .floating-add-btn {
      bottom: 80px;
      right: 16px;
      width: 56px;
      height: 56px;
    }
  }
  </style>