// main.ts
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from "./router"
import 'font-awesome/css/font-awesome.min.css'
import { createPinia } from 'pinia'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'

import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'


//状态导入
import { useUserStore } from '@/stores/userStore'
import { useSportStore } from '@/stores/sportStore'
import { useMusicStore } from '@/stores/musicStore'
import { useShareStore } from '@/stores/shareStore'
import { useNoteStore } from '@/stores/noteStore'
import { useCommentStore } from '@/stores/commentStore'
import { useSearchStore } from '@/stores/searchStore'

import {
  // 1. 基础功能与导航类
  faSpinner,    // 加载状态
  faTimes,      // 关闭/取消
  faPlus,       // 添加/新增
  faSearch,     // 搜索
  faBars,       // 菜单展开
  faChevronRight,// 右向箭头（跳转/展开）

  // 2. 运动专项类
  faBicycle,       // 自行车（骑行）
  faRunning,       // 跑步
  faHiking,        // 徒步
  faWalking,       // 步行
  faSwimmer,       // 游泳
  faBasketballBall,// 篮球

  // 3. 用户操作与身份类
  faUser,         // 通用用户
  faUserCircle,   // 圆形用户头像
  faSignOut,      // 退出登录

  // 4. 内容交互类
  faHeart,        // 点赞/收藏
  faComment,      // 评论
  faShare,        // 基础分享
  faShareAlt,     // 增强版分享
  faPlay,         //视频播放

  // 5. 系统与提示类
  faCog,          // 设置（齿轮）
  faDatabase,     // 数据库
  faInfoCircle,   // 信息提示
  faQuestionCircle,// 帮助疑问

  // 6. 媒体与信息展示类
  faImage,        // 图片
  faMusic,        // 音乐
  faMapMarkerAlt, // 地图位置标记
  faEye,          // 查看/显示
  faEyeSlash      // 隐藏/不显示
} from '@fortawesome/free-solid-svg-icons'

// 按分类添加图标到库（顺序与导入一致，便于对应）
library.add(
  // 1. 基础功能与导航类
  faSpinner, faTimes, faPlus, faSearch, faBars, faChevronRight,

  // 2. 运动专项类
  faBicycle, faRunning, faHiking, faWalking, faSwimmer, faBasketballBall,

  // 3. 用户操作与身份类
  faUser, faUserCircle, faSignOut,

  // 4. 内容交互类
  faHeart, faComment, faShare, faShareAlt,faPlay,

  // 5. 系统与提示类
  faCog, faDatabase, faInfoCircle, faQuestionCircle,

  // 6. 媒体与信息展示类
  faImage, faMusic, faMapMarkerAlt, faEye, faEyeSlash
)

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(VueVirtualScroller)

// 注册 Font Awesome 组件
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')