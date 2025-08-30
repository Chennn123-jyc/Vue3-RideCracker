// src/shims-vue.d.ts
declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
  }
  
  // 添加 menuStore 的声明
  declare module '@/stores/menuStore' {
    export const useMenuStore: () => any
  }