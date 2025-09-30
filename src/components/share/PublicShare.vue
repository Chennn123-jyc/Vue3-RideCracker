<template>
  <div class="public-share">
    <!-- 分类标签 -->
    <CategoryTabs 
      :categories="categories"
      v-model:modelValue="currentCategory"
      @category-click="handleCategoryChange"
      class="category-tabs"
    />
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>加载中...</p>
    </div>
    
    <!-- 有数据时渲染列表 -->
    <ShareList 
      v-else-if="filteredShares.length > 0"
      :shares="filteredShares"
      @like="handleLike"
      @comment="handleComment"
      @view-detail="handleViewDetail"
    />
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <font-awesome-icon icon="share-alt" />
      <p>还没有分享内容</p>
      <p>成为第一个分享的人吧！</p>
    </div>
    
    <!-- 分享详情模态框 -->
    <ShareDetailModal 
      v-if="selectedShare"
      :share="selectedShare"
      @close="selectedShare = null"
      @like="handleLike"
      @comment="handleCommentWithContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ShareList from './ShareList.vue'
import ShareDetailModal from './ShareDetailModal.vue'
import CategoryTabs from './CategoryTabs.vue'

// 定义媒体类型接口
interface Image {
  url: string;
  caption?: string; // 图片说明
}

interface Music {
  url: string;
  type: string;
  title?: string;
  artist?: string;
  duration?: number; // 时长(秒)
}

interface Video {
  url: string;
  type: string;
  thumbnail?: string; // 缩略图
  title?: string;
  duration?: number; // 时长(秒)
}

interface Comment {
  id?: number;
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes?: number;
  liked?: boolean;
}

// 扩展分享数据类型，添加多种媒体可选属性
interface Share {
  id: number;
  user: {
    id: number;
    username: string;
    avatar?: string;
    verified?: boolean; // 认证标识
  };
  content: string;
  timestamp: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
  category: string;
  
  // 媒体内容 - 所有都是可选的，可组合存在
  images?: Image[];
  music?: Music;
  video?: Video;
  
  // 额外可选属性
  location?: string; // 地点
  tags?: string[]; // 标签
  views?: number; // 浏览量
}

// 定义分类键类型
type CategoryKey = 'beginner' | 'intermediate' | 'expert' | 'casual';

// 分类数据
const categories = [
  { id: 'all', name: '全部' },
  { id: 'beginner', name: '新手小白' },
  { id: 'intermediate', name: '进阶' },
  { id: 'expert', name: '大神' },
  { id: 'casual', name: '休闲运动' }
] as const;

// 路由与响应式变量
const route = useRoute()
const router = useRouter()
const selectedShare = ref<Share | null>(null)
const currentCategory = ref('all')
const loading = ref(false)

// 模拟数据（响应式存储）- 增加了丰富的媒体类型和可选属性
const mockShares = ref<Record<CategoryKey, Share[]>>({
  beginner: [
    {
      id: 1,
      user: { 
        id: 1, 
        username: "运动新手", 
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80",
        verified: false
      },
      content: "今天第一次跑步，感觉还不错！希望能坚持下去💪",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likes: 5,
      liked: false,
      comments: [
        {
          user: { id: 3, username: "进阶跑者" },
          content: "加油！坚持就是胜利",
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
        }
      ],
      category: 'beginner',
      images: [
        {
          url: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80",
          caption: "我的跑步路线"
        }
      ],
      location: "城市公园",
      tags: ["跑步", "新手", "坚持"],
      views: 124
    },
    {
      id: 2,
      user: { 
        id: 2, 
        username: "健身小白", 
        avatar: "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80"
      },
      content: "刚开始做力量训练，求大神指点正确的姿势和计划🙏",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      likes: 8,
      liked: false,
      comments: [],
      category: 'beginner',
      video: {
        url: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-stretching-after-running-40753-large.mp4",
        type: "video/mp4",
        thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80",
        title: "我的训练视频",
        duration: 125
      },
      tags: ["力量训练", "求助"],
      views: 98
    }
  ],
  intermediate: [
    {
      id: 3,
      user: { 
        id: 3, 
        username: "进阶跑者", 
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80",
        verified: true
      },
      content: "完成了第一个10公里,用时55分钟,继续努力！",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      likes: 12,
      liked: false,
      comments: [],
      category: 'intermediate',
      images: [
        {
          url: "https://images.unsplash.com/photo-1594882645126-14020914d58d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
          caption: "终点留念"
        },
        {
          url: "https://images.unsplash.com/photo-1596357395217-80de13130e9b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80",
          caption: "跑步数据"
        }
      ],
      location: "滨江跑道",
      tags: ["10公里", "跑步", "突破"],
      views: 215
    },
    {
      id: 4,
      user: { 
        id: 4, 
        username: "健身爱好者", 
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80"
      },
      content: "深蹲突破80kg了!坚持了3个月的力量训练终于看到成果了",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      likes: 15,
      liked: false,
      comments: [],
      category: 'intermediate',
      music: {
        url: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
        type: "audio/mp3",
        title: "训练动力音乐",
        artist: "运动音乐团队",
        duration: 180
      },
      tags: ["力量训练", "深蹲", "健身"],
      views: 178
    }
  ],
  expert: [
    {
      id: 5,
      user: { 
        id: 5, 
        username: "马拉松大神", 
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80",
        verified: true
      },
      content: "刚刚完成了全马训练,配速4:30/公里，备战下个月的比赛",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      likes: 25,
      liked: false,
      comments: [
        {
          user: { id: 3, username: "进阶跑者" },
          content: "太厉害了！向大神学习",
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          likes: 3
        }
      ],
      category: 'expert',
      video: {
        url: "https://assets.mixkit.co/videos/preview/mixkit-runner-training-on-running-machine-40749-large.mp4",
        type: "video/mp4",
        thumbnail: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80",
        title: "全马训练记录",
        duration: 245
      },
      location: "奥林匹克体育中心",
      tags: ["马拉松", "全马", "训练"],
      views: 342
    },
    {
      id: 6,
      user: { 
        id: 6, 
        username: "健身教练", 
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80",
        verified: true
      },
      content: "分享一套高效的核心训练计划，适合有一定基础的朋友尝试",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likes: 18,
      liked: false,
      comments: [],
      category: 'expert',
      images: [
        {
          url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80",
          caption: "平板支撑变式"
        },
        {
          url: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80",
          caption: "俄罗斯转体"
        },
        {
          url: "https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80",
          caption: "悬挂举腿"
        }
      ],
      music: {
        url: "https://assets.mixkit.co/music/preview/mixkit-drums-of-the-amazon-1240.mp3",
        type: "audio/mp3",
        title: "核心训练节奏",
        duration: 210
      },
      tags: ["核心训练", "健身", "教程"],
      views: 289
    }
  ],
  casual: [
    {
      id: 7,
      user: { 
        id: 7, 
        username: "周末徒步者", 
        avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80"
      },
      content: "周末去郊外徒步，呼吸新鲜空气，放松身心🌲",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      likes: 10,
      liked: false,
      comments: [],
      category: 'casual',
      images: [
        {
          url: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
          caption: "山间美景"
        }
      ],
      music: {
        url: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",
        type: "audio/mp3",
        title: "自然之声",
        artist: "大自然",
        duration: 300
      },
      location: "青山国家森林公园",
      tags: ["徒步", "自然", "周末"],
      views: 156
    },
    {
      id: 8,
      user: { 
        id: 8, 
        username: "瑜伽爱好者", 
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80"
      },
      content: "晨起瑜伽，开启美好的一天。分享几个适合初学者的体式",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      likes: 7,
      liked: false,
      comments: [],
      category: 'casual',
      video: {
        url: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-yoga-40756-large.mp4",
        type: "video/mp4",
        thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80",
        title: "晨间瑜伽练习",
        duration: 180
      },
      tags: ["瑜伽", "早晨", "健康"],
      views: 132
    }
  ]
});

// 从路由参数获取分类的函数
const getCategoryFromRoute = () => {
  const categoryParam = route.params.category
  return categoryParam ? categoryParam.toString() : 'all'
}

// 计算属性：自动根据 currentCategory 过滤数据
const filteredShares = computed(() => {
  console.log('当前分类:', currentCategory.value);
  
  if (currentCategory.value === 'all') {
    const allShares = Object.values(mockShares.value).flat();
    console.log('全部分类数据:', allShares.length);
    return allShares;
  } else {    
    const categoryKey = currentCategory.value as CategoryKey;
    const categoryShares = mockShares.value[categoryKey] || [];
    console.log(`分类 ${categoryKey} 数据:`, categoryShares.length);
    return categoryShares;
  }
});

// 初始化时设置当前分类
onMounted(() => {
  currentCategory.value = getCategoryFromRoute()
  console.log('初始化分类:', currentCategory.value)
})

// 监听路由参数变化
watch(
  () => route.params.category,
  (newCategory) => {
    const category = newCategory ? newCategory.toString() : 'all'
    if (category !== currentCategory.value) {
      currentCategory.value = category
      console.log('路由变化，更新分类为:', currentCategory.value)
    }
  }
)

// 处理分类切换
const handleCategoryChange = (categoryId: string) => {
  // 更新当前分类
  currentCategory.value = categoryId
  
  // 更新路由（如果分类不是'all'，则添加参数）
  if (categoryId === 'all') {
    router.push({ name: 'share-public' })
  } else {
    router.push({ 
      name: 'share-public',
      params: { category: categoryId }
    })
  }
  
  console.log('分类切换至:', categoryId)
}

// 确保组件卸载时清理
onUnmounted(() => {
  selectedShare.value = null
})

// 事件处理：操作原始数据（确保计算属性自动响应）
// 处理点赞
const handleLike = (shareId: number) => {
  let targetShare: Share | undefined
  
  // 使用 Object.keys 并添加类型断言
  const categories = Object.keys(mockShares.value) as CategoryKey[]
  for (const category of categories) {
    targetShare = mockShares.value[category].find(s => s.id === shareId)
    if (targetShare) break
  }
  
  if (targetShare) {
    targetShare.liked = !targetShare.liked
    targetShare.likes += targetShare.liked ? 1 : -1
  }
}

// 处理评论（前置逻辑）
const handleComment = (shareId: number) => {
  console.log('准备评论分享 ID:', shareId)
}

// 处理"查看详情"
const handleViewDetail = (share: Share) => {
  selectedShare.value = share
}

// 处理带内容的评论提交
const handleCommentWithContent = (shareId: number, content: string) => {
  let targetShare: Share | undefined
  
  // 使用 Object.keys 并添加类型断言
  const categories = Object.keys(mockShares.value) as CategoryKey[]
  for (const category of categories) {
    targetShare = mockShares.value[category].find(s => s.id === shareId)
    if (targetShare) break
  }
  
  if (targetShare) {
    targetShare.comments.push({
      id: Date.now(), // 使用时间戳作为临时ID
      user: { id: 1, username: '当前用户', avatar: '/current-user-avatar.png' },
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      liked: false
    })
    // 更新选中的分享对象，确保视图更新
    if (selectedShare.value?.id === shareId) {
      selectedShare.value = { ...targetShare }
    }
  }
}
</script>
<style scoped>
.public-share {
  padding: 16px 0;
  overflow: hidden; /* 修改为hidden避免滚动冲突 */
  min-height: calc(100vh - 120px); /* 精确计算：56px header + 64px nav = 120px */
}

:deep() .vue-recycle-scroller.direction-vertical:not(.page-mode) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep() .vue-recycle-scroller.direction-vertical:not(.page-mode)::-webkit-scrollbar {
  display: none;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
  color: #ccc;
}

.empty-state p {
  margin: 8px 0;
  font-size: 16px;
}

/* 加载状态样式 */
.loading-state {
  text-align: center;
  padding: 40px 0;
}

.loading-state i {
  font-size: 24px;
  margin-bottom: 8px;
  color: #666;
}

.scroll-container {
  overflow-y: auto;
  height: calc(100vh - 200px); /* 根据实际布局调整 */
  -webkit-overflow-scrolling: touch;
}

/* 隐藏滚动条但保留功能 */
.scroll-container::-webkit-scrollbar {
  display: none;
}

.scroll-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>