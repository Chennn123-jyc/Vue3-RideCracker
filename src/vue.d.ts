
declare module 'vue' {
    import { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
  }

  declare module 'vue' {
    import { CompatVue } from '@vue/runtime-dom'
    const Vue: CompatVue
    export default Vue
    export * from '@vue/runtime-dom'
    const { createApp } = Vue
    export { createApp }
  }