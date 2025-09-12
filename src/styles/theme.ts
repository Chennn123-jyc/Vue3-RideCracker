export type ThemeType = 'sport' | 'music' | 'share';

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
  share: {
    '--theme-primary': '#8A2BE2', // 蓝紫色
    '--theme-secondary': '#9370DB',
    '--theme-bg': 'linear-gradient(to bottom, #2d1a42, #4a2d7a)',
    '--theme-card-bg': 'rgba(74, 45, 122, 0.7)',
    '--theme-border': 'rgba(138, 43, 226, 0.3)',
    '--theme-text': '#e6e6fa',
    '--theme-text-light': '#b8a1d6',
    '--theme-hover-bg': 'rgba(138, 43, 226, 0.2)',
  },
};

export const defaultTheme: ThemeType = 'sport';