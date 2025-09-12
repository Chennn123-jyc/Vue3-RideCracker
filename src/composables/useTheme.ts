
import { computed } from 'vue';
import { useMenuStore } from '@/stores/menuStore';
import { themeConfig, ThemeType } from '@/styles/theme';

export const useTheme = () => {
  const menuStore = useMenuStore();
  
  const currentTheme = computed(() => menuStore.theme as ThemeType);
  
  const themeVariables = computed(() => {
    return themeConfig[currentTheme.value];
  });
  
  const applyTheme = () => {
    const root = document.documentElement;
    const variables = themeVariables.value;
    
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  };
  
  return {
    currentTheme,
    themeVariables,
    applyTheme
  };
};