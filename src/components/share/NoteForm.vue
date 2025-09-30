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
          
          <!-- 媒体上传区域 -->
          <div class="form-group">
            <label>添加媒体内容（可选）</label>
            
            <!-- 图片上传 -->
            <div class="media-section">
              <h4>图片</h4>
              <div class="image-upload-container">
                <div 
                  v-for="(image, index) in formData.images" 
                  :key="index" 
                  class="image-preview-item"
                >
                  <img :src="image.url" :alt="image.caption || '图片'">
                  <div class="image-actions">
                    <input 
                      type="text" 
                      v-model="image.caption" 
                      placeholder="图片说明"
                      class="caption-input"
                    >
                    <button type="button" @click="removeImage(index)" class="remove-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <label v-if="formData.images.length < 5" class="image-upload-btn">
                  <input type="file" accept="image/*" @change="handleImageUpload" multiple>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <path d="M21 15l-5-5L5 21"></path>
                  </svg>
                  <span>添加图片</span>
                </label>
              </div>
            </div>
            
            <!-- 音乐上传 -->
            <div class="media-section">
              <h4>音乐</h4>
              <div v-if="formData.music" class="music-preview">
                <div class="music-info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                  </svg>
                  <div class="music-details">
                    <input 
                      type="text" 
                      v-model="formData.music.title" 
                      placeholder="音乐标题"
                      class="music-input"
                    >
                    <input 
                      type="text" 
                      v-model="formData.music.artist" 
                      placeholder="艺术家"
                      class="music-input"
                    >
                  </div>
                  <button type="button" @click="removeMusic" class="remove-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              <label v-else class="music-upload-btn">
                <input type="file" accept="audio/*" @change="handleMusicUpload">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
                <span>添加音乐</span>
              </label>
            </div>
            
            <!-- 视频上传 -->
            <div class="media-section">
              <h4>视频</h4>
              <div v-if="formData.video" class="video-preview">
                <div class="video-info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                  <div class="video-details">
                    <input 
                      type="text" 
                      v-model="formData.video.title" 
                      placeholder="视频标题"
                      class="video-input"
                    >
                  </div>
                  <button type="button" @click="removeVideo" class="remove-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              <label v-else class="video-upload-btn">
                <input type="file" accept="video/*" @change="handleVideoUpload">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                <span>添加视频</span>
              </label>
            </div>
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

// 定义媒体类型接口
interface Image {
  url: string;
  caption?: string;
}

interface Music {
  url: string;
  type: string;
  title?: string;
  artist?: string;
  duration?: number;
}

interface Video {
  url: string;
  type: string;
  thumbnail?: string;
  title?: string;
  duration?: number;
}

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
  tags: [] as string[],
  images: [] as Image[],
  music: null as Music | null,
  video: null as Video | null
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

// 处理图片上传
const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  
  const files = Array.from(input.files)
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const image: Image = {
        url: e.target?.result as string,
        caption: ''
      }
      formData.images.push(image)
    }
    reader.readAsDataURL(file)
  })
  
  // 清空input以允许重复选择相同文件
  input.value = ''
}

// 移除图片
const removeImage = (index: number) => {
  formData.images.splice(index, 1)
}

// 处理音乐上传
const handleMusicUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.music = {
      url: e.target?.result as string,
      type: file.type,
      title: file.name.replace(/\.[^/.]+$/, ""), // 移除文件扩展名作为默认标题
      artist: '',
      duration: 0
    }
  }
  reader.readAsDataURL(file)
  
  // 清空input
  input.value = ''
}

// 移除音乐
const removeMusic = () => {
  formData.music = null
}

// 处理视频上传
const handleVideoUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.video = {
      url: e.target?.result as string,
      type: file.type,
      title: file.name.replace(/\.[^/.]+$/, ""), // 移除文件扩展名作为默认标题
      duration: 0
    }
    
    // 生成视频缩略图
    generateVideoThumbnail(file).then(thumbnail => {
      if (formData.video) {
        formData.video.thumbnail = thumbnail
      }
    })
  }
  reader.readAsDataURL(file)
  
  // 清空input
  input.value = ''
}

// 生成视频缩略图
const generateVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    video.src = URL.createObjectURL(file)
    video.addEventListener('loadeddata', () => {
      // 设置视频时间到中间点
      video.currentTime = video.duration / 2
    })
    
    video.addEventListener('seeked', () => {
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg'))
      }
      URL.revokeObjectURL(video.src)
    })
  })
}

// 移除视频
const removeVideo = () => {
  formData.video = null
}

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
  formData.images = []
  formData.music = null
  formData.video = null
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
      tags: formData.tags,
      images: formData.images,
      music: formData.music,
      video: formData.video
    })
    noteData = noteStore.notes.find(note => note.id === props.noteToEdit!.id)!
  } else {
    // 创建新笔记
    noteData = noteStore.addNote({
      title: formData.title,
      content: formData.content,
      tags: formData.tags,
      images: formData.images,
      music: formData.music,
      video: formData.video
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
    formData.images = newNote.images ? [...newNote.images] : []
    formData.music = newNote.music ? { ...newNote.music } : null
    formData.video = newNote.video ? { ...newNote.video } : null
    
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
    formData.images = props.noteToEdit.images ? [...props.noteToEdit.images] : []
    formData.music = props.noteToEdit.music ? { ...props.noteToEdit.music } : null
    formData.video = props.noteToEdit.video ? { ...props.noteToEdit.video } : null
    
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
  max-width: 600px;
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

/* 媒体上传样式 */
.media-section {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.media-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #555;
}

.image-upload-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-preview-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px;
  display: flex;
  gap: 4px;
}

.caption-input {
  flex: 1;
  padding: 2px 4px;
  font-size: 11px;
  border: none;
  border-radius: 4px;
  background: white;
}

.remove-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.remove-btn svg {
  width: 12px;
  height: 12px;
}

.image-upload-btn,
.music-upload-btn,
.video-upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
  text-align: center;
}

.image-upload-btn:hover,
.music-upload-btn:hover,
.video-upload-btn:hover {
  border-color: var(--theme-primary, #06B6D4);
}

.image-upload-btn input,
.music-upload-btn input,
.video-upload-btn input {
  display: none;
}

.image-upload-btn svg,
.music-upload-btn svg,
.video-upload-btn svg {
  width: 24px;
  height: 24px;
  color: #999;
  margin-bottom: 8px;
}

.image-upload-btn span,
.music-upload-btn span,
.video-upload-btn span {
  font-size: 12px;
  color: #666;
}

.music-preview,
.video-preview {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.music-info,
.video-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.music-info svg,
.video-info svg {
  width: 24px;
  height: 24px;
  color: var(--theme-primary, #06B6D4);
  flex-shrink: 0;
}

.music-details,
.video-details {
  flex: 1;
}

.music-input,
.video-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 4px;
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
  
  .image-preview-item,
  .image-upload-btn {
    width: 80px;
    height: 80px;
  }
}
</style>