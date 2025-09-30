declare module 'vue-virtual-scroller' {
    // 导出默认模块（对应 main.ts 中 import VueVirtualScroller from 'vue-virtual-scroller'）
    const VueVirtualScroller: any;
    export default VueVirtualScroller;
  
    // 导出库中的核心组件（方便在组件中直接导入使用时，TypeScript 不报错）
    export const RecycleScroller: any;    // 固定高度虚拟滚动组件
    export const DynamicScroller: any;   // 动态高度虚拟滚动组件
    export const DynamicScrollerItem: any;// 动态高度列表项组件
  }