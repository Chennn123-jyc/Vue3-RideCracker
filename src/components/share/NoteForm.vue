<!-- components/share/NoteForm.vue -->
<template>
    <div class="note-form-modal" v-if="isVisible">
      <div class="modal-overlay" @click.self="closeModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditing ? '编辑笔记' : '新建笔记' }}</h3>
          <button class="close-btn" @click="closeModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <!-- 标题输入 -->
            <div class="form-group">
              <label for="note-title">标题</label>
              <input
                id="note-title"
                type="text"
                v-model="formData.title"
                placeholder="输入笔记标题"
                required
                maxlength="100"
              />
              <span class="character-count">{{ formData.title.length }}/100</span>
            </div>
            
            <!-- 内容输入 -->
            <div class="form-group">
              <label for="note-content">内容</label>
              <textarea
                id="note-content"
                v-model="formData.content"
                placeholder="输入笔记内容..."
                rows="6"
                required
                maxlength="1000"
              ></textarea>
              <span class="character-count">{{ formData.content.length }}/1000</span>
            </div>
            
            <!-- 标签输入 -->
            <div class="form-group">
              <label for="note-tags">标签（用逗号分隔）</label>
              <input
                id="note-tags"
                type="text"
                v-model="tagsInput"
                placeholder="例如: 运动,健身,健康"
              />
              <div class="tags-preview" v-if="formData.tags && formData.tags.length">
                <span class="tag" v-for="(tag, index) in formData.tags" :key="index">
                  {{ tag }}
                </span>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeModal">
                取消
              </button>
              <button type="submit" class="save-btn" :disabled="!isFormValid">
                {{ isEditing ? '更新' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, computed, watch, onMounted } from 'vue'
  import { useNoteStore, type Note } from '@/stores/noteStore'
  
  const props = defineProps<{
    isVisible: boolean;
    noteToEdit?: Note | null;
  }>()
  
  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'saved', note: Note): void;
  }>()
  
  const noteStore = useNoteStore()
  const tagsInput = ref('')
  const isEditing = computed(() => !!props.noteToEdit)
  
  const formData = reactive({
    title: '',
    content: '',
    tags: [] as string[]
  })
  
  // 表单验证
  const isFormValid = computed(() => {
    return formData.title.trim().length > 0 && formData.content.trim().length > 0
  })
  
  // 处理标签输入变化
  watch(tagsInput, (newValue) => {
    if (newValue.trim()) {
      formData.tags = newValue.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    } else {
      formData.tags = []
    }
  })
  
  // 关闭模态框
  const closeModal = () => {
    emit('close')
    resetForm()
  }
  
  // 重置表单
  const resetForm = () => {
    formData.title = ''
    formData.content = ''
    formData.tags = []
    tagsInput.value = ''
  }
  
  // 处理表单提交
  const handleSubmit = () => {
    if (!isFormValid.value) return
    
    let noteData: Note
    
    if (isEditing.value && props.noteToEdit) {
      // 更新现有笔记
      noteStore.updateNote(props.noteToEdit.id, {
        title: formData.title,
        content: formData.content,
        tags: formData.tags
      })
      noteData = noteStore.notes.find(note => note.id === props.noteToEdit!.id)!
    } else {
      // 创建新笔记
      noteData = noteStore.addNote({
        title: formData.title,
        content: formData.content,
        tags: formData.tags
      })
    }
    
    emit('saved', noteData)
    closeModal()
  }
  
  // 初始化表单数据
  watch(() => props.noteToEdit, (newNote) => {
    if (newNote) {
      formData.title = newNote.title || ''
      formData.content = newNote.content || ''
      formData.tags = newNote.tags ? [...newNote.tags] : []
      
      // 将标签数组转换为字符串
      if (newNote.tags && newNote.tags.length) {
        tagsInput.value = newNote.tags.join(', ')
      } else {
        tagsInput.value = ''
      }
    } else {
      resetForm()
    }
  })
  
  // 监听模态框显示状态
  watch(() => props.isVisible, (visible) => {
    if (visible && props.noteToEdit) {
      formData.title = props.noteToEdit.title || ''
      formData.content = props.noteToEdit.content || ''
      formData.tags = props.noteToEdit.tags ? [...props.noteToEdit.tags] : []
      
      if (props.noteToEdit.tags && props.noteToEdit.tags.length) {
        tagsInput.value = props.noteToEdit.tags.join(', ')
      } else {
        tagsInput.value = ''
      }
    } else if (!visible) {
      resetForm()
    }
  })
  </script>
  
  <style scoped>
  .note-form-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
  }
  
  .modal-content {
    background-color: white;
    border-radius: 12px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 1001;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 10;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-btn:hover {
    background-color: #f5f5f5;
  }
  
  .close-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .form-group {
    margin-bottom: 20px;
    position: relative;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
  }
  
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  
  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--theme-primary, #06B6D4);
    box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.1);
  }
  
  .form-group textarea {
    resize: vertical;
    min-height: 120px;
    font-family: inherit;
  }
  
  .character-count {
    position: absolute;
    right: 10px;
    bottom: 10px;
    font-size: 12px;
    color: #999;
    background-color: white;
    padding: 0 4px;
  }
  
  .tags-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  
  .tag {
    background-color: rgba(6, 182, 212, 0.1);
    color: #06B6D4;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
  
  .cancel-btn,
  .save-btn {
    padding: 10px 20px;
    border-radius: 20px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .cancel-btn {
    background: none;
    border: 1px solid #ddd;
    color: #666;
  }
  
  .cancel-btn:hover {
    background-color: #f5f5f5;
  }
  
  .save-btn {
    background-color: var(--theme-primary, #06B6D4);
    border: none;
    color: white;
  }
  
  .save-btn:not(:disabled):hover {
    background-color: var(--theme-primary-dark, #0891b2);
  }
  
  .save-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  /* 响应式调整 */
  @media (max-width: 480px) {
    .modal-content {
      max-width: 100%;
      border-radius: 0;
      max-height: 100vh;
    }
    
    .form-actions {
      flex-direction: column;
    }
    
    .cancel-btn,
    .save-btn {
      width: 100%;
    }
  }
  </style>