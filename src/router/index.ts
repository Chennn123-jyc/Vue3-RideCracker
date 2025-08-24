import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import SportView from '@/views/SportView.vue'
import MusicView from '@/views/MusicView.vue'
import StatusBar from '@/components/StatusBar.vue' 

// 运动组件导入
import ControlButtons from '@/components/sports/ControlButtons.vue'
import HistoryCards from '@/components/sports/HistoryCards.vue'
import SportStats from '@/components/sports/SportStats.vue'

// 音乐组件导入
import SongInfo from '@/components/music/SongInfo.vue'
import PlayControls from '@/components/music/PlayControls.vue'
import LyricsPage from '@/components/music/LyricsPage.vue'
import FunctionBar from '@/components/music/FunctionBar.vue'
import ProgressBar from '@/components/music/ProgressBar.vue'
import UploadMusic from '@/components/music/UploadMusic.vue'
import VinyRecord from '@/components/music/VinyRecord.vue'

import { useMusicStore } from '@/stores/musicStore'
import useAudioPlayer from '@/composables/useAudioPlayer'

// 路由元信息类型扩展
declare module 'vue-router' {
  interface RouteMeta {
    showBottomNav?: boolean
    title?: string // 页面标题
    requiresAuth?: boolean // 是否需要登录
    // 新增：状态栏主题配置
    statusBarTheme?: {
      bgColor: string // 背景色
      textColor: string // 文字/图标颜色
      menuIconColor:string
      userIconColor:string
    }
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'sport',
    component: SportView,
    meta: { 
      showBottomNav: true,
      title: '运动模式',
      // 运动界面状态栏主题
      statusBarTheme: {
        bgColor: '#121826', 
        textColor: '#e5e7eb',
        menuIconColor: '#06B6D4', // 运动界面菜单图标青色
        userIconColor: '#06B6D4'  // 运动界面用户图标青色
      }
    },
    children: [
      {
        path: '',
        name: 'sport-main',
        components: {
          // 运动界面内容组件
          ControlButtons: ControlButtons,
          HistoryCards: HistoryCards,
          SportStats: SportStats,
          // 运动界面的状态栏子路由
          status: StatusBar 
        },
        meta: {
          title: '运动数据'
        }
      },
    ]
  },
  {
    path: '/music',
    name: 'music',
    component: MusicView,
    meta: { 
      showBottomNav: true,
      title: '音乐中心',
      // 音乐界面默认状态栏主题
      statusBarTheme: {
        bgColor: '#3b2d58', 
        textColor: '#ffffff',
        menuIconColor: '#4776e6', 
        userIconColor: '#4776e6',
      }
    },
    children: [
      {
        path: '',
        name: 'music-main',
        components: {
          // 音乐主界面内容组件
          info: SongInfo,
          progress: ProgressBar, 
          controls: PlayControls,
          functions: FunctionBar,
          upload: UploadMusic,
          VinyRecord: VinyRecord,
          // 音乐主界面的状态栏子路由
          status: StatusBar 
        },
        meta: {
          title: '正在播放'
        }
      },
      {
        path: 'lyrics',
        name: 'music-lyrics',
        components: {
          // 歌词页的状态栏子路由（可单独配置主题）
          status: StatusBar, 
          lyrics: LyricsPage
        },
        meta: {
          title: '歌词',
          // 歌词页单独的状态栏主题（可选）
          
        }
      },
      {
        path: 'playlist',
        name: 'music-playlist',
        components: {
          // 播放列表的状态栏子路由（继承父级主题）
          status: StatusBar, 
          playlist: () => import('@/components/music/Playlist.vue') // 懒加载
        },
        meta: {
          title: '播放列表'
        }
      }
    ]
  },
  // 404路由处理
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      showBottomNav: false,
      title: '页面未找到'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 路由切换滚动行为
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

// 全局路由守卫 - 处理页面标题
router.beforeEach((to, from) => {
  const musicStore = useMusicStore()
  const player = useAudioPlayer()

  // 1. 离开音乐界面：保存最新进度到 Pinia
  if (from.name?.toString().startsWith('music') && !to.name?.toString().startsWith('music')) {
    // 关键：从音频实例获取实时进度，而非依赖 Pinia 中的 currentTime
    const realTimeCurrentTime = player.getCurrentTime();
    musicStore.setCurrentTime(realTimeCurrentTime); // 更新 Pinia 进度
    console.log('离开音乐界面，保存进度：', realTimeCurrentTime); // 用于调试
  }

  // 2. 进入音乐界面：触发状态恢复（保持不变，但可增加日志）
  if (!from.name?.toString().startsWith('music') && to.name?.toString().startsWith('music')) {
    if (musicStore.currentSong) {
      // 增加延迟：确保音频实例初始化完成后再同步（避免实例未就绪）
      setTimeout(() => {
        musicStore.syncAudioWithState();
        console.log('进入音乐界面，恢复进度：', musicStore.currentTime); // 用于调试
      }, 100); 
    }
  }

  // 原有：设置页面标题
  document.title = to.meta.title || 'Sport&Music'
})

export default router