<!-- components/share/PersonalNotes.vue -->
<template>
  <div class="personal-notes">
    <div v-if="notes.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      <h3>还没有笔记</h3>
      <p>记录你的想法和灵感</p>
      <button class="create-note-btn" @click="$emit('create-note')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        创建笔记
      </button>
    </div>
    
    <div v-else class="notes-list">
      <div class="notes-header">
        <h2>我的笔记 ({{ notes.length }})</h2>
      </div>
      
      <div class="notes-grid">
        <div 
          v-for="note in notes" 
          :key="note.id" 
          class="note-card"
          @click="handleEditNote(note)"
        >
          <div class="note-header">
            <h3 class="note-title">{{ note.title }}</h3>
            <button class="note-delete-btn" @click.stop="handleDeleteNote(note.id)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
          
          <p class="note-content-preview">{{ truncateContent(note.content) }}</p>
          
          <div class="note-footer">
            <div class="note-tags" v-if="note.tags && note.tags.length">
              <span class="note-tag" v-for="(tag, index) in note.tags.slice(0, 3)" :key="index">
                #{{ tag }}
              </span>
              <span v-if="note.tags.length > 3" class="note-tag-more">
                +{{ note.tags.length - 3 }}更多
              </span>
            </div>
            
            <div class="note-date">
              {{ formatDate(note.updatedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNoteStore, type Note } from '@/stores/noteStore'

// 定义组件事件
const emit = defineEmits<{
  (e: 'create-note'): void;
  (e: 'edit-note', note: Note): void;
  (e: 'delete-note', noteId: number): void;
}>()

const noteStore = useNoteStore()
const notes = computed(() => noteStore.notes)

// 处理编辑笔记
const handleEditNote = (note: Note) => {
  emit('edit-note', note)
}

// 处理删除笔记
const handleDeleteNote = (noteId: number) => {
  if (confirm('确定要删除这个笔记吗？')) {
    noteStore.deleteNote(noteId)
    emit('delete-note', noteId)
  }
}

// 截断内容预览
const truncateContent = (content: string) => {
  if (content.length > 100) {
    return content.substring(0, 100) + '...'
  }
  return content
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<style scoped>
.personal-notes {
  padding: 16px;
  min-height: 60vh;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  margin-bottom: 16px;
  color: #ccc;
  display: block;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.create-note-btn {
  background-color: var(--theme-primary, #06B6D4);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  margin-top: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.create-note-btn:hover {
  background-color: var(--theme-primary-dark, #0891b2);
}

.create-note-btn svg {
  width: 16px;
  height: 16px;
}

.notes-header {
  margin-bottom: 20px;
}

.notes-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.note-card {
  background-color: var(--card-color);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--tertiary-color);
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.note-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  flex: 1;
  margin-right: 8px;
}

.note-delete-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-delete-btn:hover {
  background-color: rgba(255, 0, 0, 0.1);
  color: #ff4757;
}

.note-delete-btn svg {
  width: 16px;
  height: 16px;
}

.note-content-preview {
  margin: 0 0 12px 0;
  color: var(--light-text-color);
  font-size: 14px;
  line-height: 1.5;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.note-tag {
  background-color: rgba(6, 182, 212, 0.1);
  color: var(--theme-primary, #06B6D4);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 12px;
}

.note-tag-more {
  color: var(--light-text-color);
  font-size: 12px;
}

.note-date {
  color: var(--light-text-color);
  font-size: 12px;
}

@media (max-width: 768px) {
  .notes-grid {
    grid-template-columns: 1fr;
  }
  
  .personal-notes {
    padding: 12px;
  }
}
</style>