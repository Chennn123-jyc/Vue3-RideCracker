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
      theme:'sport',
      statusBarTheme: {
        bgColor: 'transparent',
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
          ControlButtons: ControlButtons,
          HistoryCards: HistoryCards,
          SportStats: SportStats,
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
      theme:'music',
      statusBarTheme: {
        bgColor: 'transparent',
        textColor: '#ffffff',
        menuIconColor: '#b955d3', 
        userIconColor: '#b955d3',
      }
    },
    children: [
      {
        path: '',
        name: 'music-main',
        components: {
          info: SongInfo,
          progress: ProgressBar, 
          controls: PlayControls,
          functions: FunctionBar,
          upload: UploadMusic,
          VinyRecord: VinyRecord,
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
  {
    path: '/share',
    name: 'share',
    component: () => import('@/views/ShareView.vue'), // 懒加载ShareView
    meta: { 
      showBottomNav: true,
      title: '分享',
      theme: 'share',
      statusBarTheme: {
        bgColor: 'transparent',
        textColor: '#ffffff',
        menuIconColor: '#8A2BE2',
        userIconColor: '#8A2BE2',
      }
    },
    children: [
      {
        path: 'public/:category?',
        name: 'share-public',
        component: () => import('@/components/share/PublicShare.vue') // 懒加载
      },
      {
        path: 'personal',
        name: 'share-personal', 
        component: () => import('@/components/share/PersonalNotes.vue') // 懒加载
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

  // 离开音乐界面时保存状态
  if (from.name?.toString().startsWith('music') && !to.name?.toString().startsWith('music')) {
    // 保存当前播放状态
    if (player.audio.value) {
      musicStore.setCurrentTime(player.audio.value.currentTime);
    }
    // 暂停播放但保持实例
  }

  // 进入音乐界面时恢复状态
  if (!from.name?.toString().startsWith('music') && to.name?.toString().startsWith('music')) {
    // 直接恢复播放状态，不需要setTimeout
    if (musicStore.isPlaying && player.audio.value) {
      player.play().catch(console.error);
    }
  }

  document.title = to.meta.title || 'Sport&Music'
})

export default router