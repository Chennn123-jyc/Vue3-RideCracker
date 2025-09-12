// main.ts
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from "./router"
import 'font-awesome/css/font-awesome.min.css'
import { createPinia } from 'pinia'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'


//状态导入
import { useUserStore } from '@/stores/userStore'
import { useSportStore } from '@/stores/sportStore'
import { useMusicStore } from '@/stores/musicStore'
import { useShareStore } from '@/stores/shareStore'
import { useNoteStore } from '@/stores/noteStore'
import { useCommentStore } from '@/stores/commentStore'
import { useSearchStore } from '@/stores/searchStore'

// 导入所有需要的图标
import { 
  faBicycle, faRunning, faHiking, faWalking, faSwimmer, 
  faBasketballBall, faShareAlt, faMusic, faSearch, faTimes, 
  faHeart, faComment, faShare, faMapMarkerAlt, faImage, 
  faPlus, faStickyNote, faUserCircle, faBars, faShareSquare,
  faEdit, faTrash, faBook, faFileAlt, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'



const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 添加所有图标到库
library.add(
  faBicycle, faRunning, faHiking, faWalking, faSwimmer,
  faBasketballBall, faMusic, faShareAlt, faSearch, faTimes, 
  faHeart, faComment, faShare, faMapMarkerAlt, faImage, 
  faPlus, faStickyNote, faUserCircle, faBars, faShareSquare,
  faEdit, faTrash, faBook, faFileAlt, faCheckCircle
)

// 注册 Font Awesome 组件
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')