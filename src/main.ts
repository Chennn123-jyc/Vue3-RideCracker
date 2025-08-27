import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from "./router"
import 'font-awesome/css/font-awesome.min.css'; 
import { createPinia } from 'pinia';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faMusic } from '@fortawesome/free-solid-svg-icons' 

// 导入所有需要的图标
import { 
  faBicycle,      // 骑行
  faRunning,      // 跑步
  faHiking,       // 徒步
  faWalking,      // 步行
  faSwimmer,      // 游泳
  faBasketballBall // 篮球
} from '@fortawesome/free-solid-svg-icons';

const app = createApp(App)

// 创建 Pinia 并使用
const pinia = createPinia()
app.use(pinia)

// 使用路由
app.use(router)

// 添加所有图标到库
library.add(
  faBicycle, 
  faRunning, 
  faHiking, 
  faWalking,
  faSwimmer,
  faBasketballBall,
  faMusic
)

// 注册 Font Awesome 组件
app.component('font-awesome-icon', FontAwesomeIcon)

// 挂载应用
app.mount('#app')