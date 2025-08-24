import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from "./router"
// 注意：如果使用的是 font-awesome 的 CSS 方式，可能与 SVG 方式冲突，可根据实际需求保留
import 'font-awesome/css/font-awesome.min.css'; 
import { createPinia } from 'pinia';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBicycle, faMusic } from '@fortawesome/free-solid-svg-icons' 

const app = createApp(App)

// 创建 Pinia 并使用
const pinia = createPinia()
app.use(pinia)

// 使用路由
app.use(router)

// 添加 Font Awesome 图标到库
library.add(faBicycle, faMusic) 
// 注册 Font Awesome 组件
app.component('font-awesome-icon', FontAwesomeIcon)

// 挂载应用
app.mount('#app')