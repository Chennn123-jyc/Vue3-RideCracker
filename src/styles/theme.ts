export type ThemeType = 'sport' | 'music' | 'health';

// 定义主题配置的类型
export type ThemeConfig = {
  [key in ThemeType]: {
    '--theme-primary': string;
    '--theme-secondary': string;
    '--theme-bg': string;
    '--theme-card-bg': string;
    '--theme-border': string;
    '--theme-text': string;
    '--theme-text-light': string;
    '--theme-hover-bg': string;
  };
};

// 使用新定义的类型
export const themeConfig: ThemeConfig = {
  sport: {
    '--theme-primary': '#06B6D4',
    '--theme-secondary': '#3B82F6',
    '--theme-bg': 'linear-gradient(to bottom, #0f172a, #1e293b)',
    '--theme-card-bg': 'rgba(30, 41, 59, 0.7)',
    '--theme-border': 'rgba(6, 182, 212, 0.3)',
    '--theme-text': '#e2e8f0',
    '--theme-text-light': '#94a3b8',
    '--theme-hover-bg': 'rgba(6, 182, 212, 0.2)',
  },
  music: {
    '--theme-primary': '#b955d3',
    '--theme-secondary': '#8a2be2',
    '--theme-bg': 'linear-gradient(to bottom, #1a0520, #2d0a31)',
    '--theme-card-bg': 'rgba(45, 10, 49, 0.7)',
    '--theme-border': 'rgba(185, 85, 211, 0.3)',
    '--theme-text': '#d8bfd8',
    '--theme-text-light': '#b088b6',
    '--theme-hover-bg': 'rgba(185, 85, 211, 0.2)',
  },
  health: {
    '--theme-primary': '#10B981',
    '--theme-secondary': '#34D399',
    '--theme-bg': 'linear-gradient(to bottom, #064e3b, #059669)',
    '--theme-card-bg': 'rgba(5, 150, 105, 0.2)',
    '--theme-border': 'rgba(16, 185, 129, 0.3)',
    '--theme-text': '#d1fae5',
    '--theme-text-light': '#6ee7b7',
    '--theme-hover-bg': 'rgba(16, 185, 129, 0.2)',
  },
};

export const defaultTheme: ThemeType = 'sport';