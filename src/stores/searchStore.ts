import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNoteStore } from './noteStore'
import { useShareStore } from './shareStore'

export const useSearchStore = defineStore('search', () => {
  const route = useRoute()
  const noteStore = useNoteStore()
  const shareStore = useShareStore()
  
  const searchQuery = ref('')
  const searchResults = ref<any[]>([])
  const isSearching = ref(false)

  // 判断当前页面类型
  const isPersonalNotes = computed(() => route.path.includes('/personal'))
  const isPublicShare = computed(() => route.path.includes('/public'))

  // 执行搜索
  const performSearch = () => {
    if (!searchQuery.value.trim()) {
      searchResults.value = []
      return
    }

    isSearching.value = true
    
    if (isPersonalNotes.value) {
      searchPersonalNotes()
    } else if (isPublicShare.value) {
      searchPublicShares()
    }
    
    isSearching.value = false
  }

  // 搜索个人笔记
  const searchPersonalNotes = () => {
    const query = searchQuery.value.toLowerCase()
    searchResults.value = noteStore.notes.filter(note => 
      note.title.toLowerCase().includes(query) || 
      note.content.toLowerCase().includes(query) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }

  // 搜索公共分享
  const searchPublicShares = () => {
    const query = searchQuery.value.toLowerCase()
    searchResults.value = shareStore.shares.filter(share => 
      share.content.toLowerCase().includes(query) ||
      (share.user?.username.toLowerCase().includes(query)) || 
      share.category.toLowerCase().includes(query)
    )
  }

  // 清空搜索
  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
  }

  return {
    searchQuery,
    searchResults,
    isSearching,
    performSearch,
    clearSearch
  }
})