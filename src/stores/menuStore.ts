import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ThemeType,defaultTheme } from '@/styles/theme';

export const useMenuStore = defineStore('menu', () => {
  // 状态
  const isOpen = ref(false);
  const theme = ref<ThemeType>(defaultTheme); // 默认主题
  
  // 操作方法
  const toggleMenu = () => {
    isOpen.value = !isOpen.value;
  };
  
  const openMenu = () => {
    isOpen.value = true;
  };
  
  const closeMenu = () => {
    isOpen.value = false;
  };
  
  const setTheme = (newTheme: ThemeType) => {
    theme.value = newTheme;
  };
  
  return {
    isOpen,
    theme,
    toggleMenu,
    openMenu,
    closeMenu,
    setTheme
  };
});