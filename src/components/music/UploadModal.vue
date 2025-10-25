<template>
  <div class="upload-modal-overlay" @click="closeModal">
    <div class="upload-modal" @click.stop>
      <div class="modal-header">
        <h3>上传音乐</h3>
        <button class="close-btn" @click="closeModal">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 文件选择区域 -->
        <div 
          class="upload-area"
          :class="{ 'drag-over': isDragOver, 'has-file': selectedFile }"
          @click="triggerFileInput"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <input
            ref="fileInput"
            type="file"
            accept="audio/*"
            @change="handleFileSelect"
            class="file-input"
          />
          
          <div class="upload-content">
            <i class="fa fa-cloud-upload upload-icon"></i>
            <p v-if="!selectedFile" class="upload-text">
              点击选择或拖拽音乐文件到此区域
            </p>
            <div v-else class="file-info">
              <i class="fa fa-music file-icon"></i>
              <div class="file-details">
                <p class="file-name">{{ selectedFile.name }}</p>
                <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <button class="remove-file" @click.stop="removeFile">
                <i class="fa fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 元数据表单 -->
        <div v-if="selectedFile" class="metadata-form">
          <h4>音乐信息</h4>
          <div class="form-group">
            <label for="title">歌曲标题 *</label>
            <input
              id="title"
              v-model="metadata.title"
              type="text"
              placeholder="请输入歌曲标题"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="artist">艺术家 *</label>
            <input
              id="artist"
              v-model="metadata.artist"
              type="text"
              placeholder="请输入艺术家名称"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="album">专辑</label>
            <input
              id="album"
              v-model="metadata.album"
              type="text"
              placeholder="请输入专辑名称"
              class="form-input"
            />
          </div>

          <!-- 封面图片上传 -->
          <div class="form-group">
            <label>封面图片（可选）</label>
            <div class="cover-upload">
              <div 
                class="cover-preview"
                :class="{ 'has-cover': coverPreview }"
                @click="triggerCoverInput"
              >
                <img v-if="coverPreview" :src="coverPreview" alt="封面预览" />
                <i v-else class="fa fa-image cover-placeholder"></i>
                <input
                  ref="coverInput"
                  type="file"
                  accept="image/*"
                  @change="handleCoverSelect"
                  class="cover-input"
                />
              </div>
              <div class="cover-actions">
                <button 
                  v-if="coverPreview" 
                  class="cover-remove-btn"
                  @click="removeCover"
                >
                  移除封面
                </button>
                <p class="cover-hint">建议尺寸：500x500px</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 上传进度 -->
        <div v-if="uploading" class="upload-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: uploadProgress + '%' }"
            ></div>
          </div>
          <p class="progress-text">
            上传中... {{ Math.round(uploadProgress) }}%
          </p>
        </div>

        <!-- 错误信息 -->
        <div v-if="errorMessage" class="error-message">
          <i class="fa fa-exclamation-triangle"></i>
          {{ errorMessage }}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-cancel" @click="closeModal">
          取消
        </button>
        <button 
          class="btn btn-upload" 
          :disabled="!canUpload || uploading"
          @click="startUpload"
        >
          <i v-if="uploading" class="fa fa-spinner fa-spin"></i>
          <i v-else class="fa fa-upload"></i>
          {{ uploading ? '上传中...' : '开始上传' }}
        </button>
      </div>
      
      <!-- 添加成功提示弹窗 -->
      <div v-if="showSuccess" class="success-toast">
        <div class="success-content">
          <i class="fa fa-check-circle success-icon"></i>
          <div class="success-text">
            <h4>上传成功！</h4>
            <p>音乐已成功添加到您的库中</p>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';

// Props 和 Emits
interface Props {
  // 可以添加需要的 props
}

interface Emits {
  (e: 'close'): void;
  (e: 'upload-success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const fileInput = ref<HTMLInputElement | null>(null);
const coverInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isDragOver = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const errorMessage = ref('');
const showSuccess = ref(false);

// 定时器引用
let successTimer: NodeJS.Timeout | null = null;

// 元数据
const metadata = ref({
  title: '',
  artist: '',
  album: ''
});

// 封面图片
const coverFile = ref<File | null>(null);
const coverPreview = ref<string>('');

// 计算属性
const canUpload = computed(() => {
  return selectedFile.value && 
         metadata.value.title.trim() && 
         metadata.value.artist.trim() &&
         !uploading.value;
});

// 方法
const triggerFileInput = () => {
  fileInput.value?.click();
};

const triggerCoverInput = () => {
  coverInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0];
    // 自动从文件名提取元数据
    extractMetadataFromFileName(selectedFile.value.name);
    errorMessage.value = '';
  }
};

const handleCoverSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      errorMessage.value = '请选择图片文件';
      return;
    }
    
    // 检查文件大小（限制为 5MB）
    if (file.size > 5 * 1024 * 1024) {
      errorMessage.value = '图片文件大小不能超过 5MB';
      return;
    }
    
    coverFile.value = file;
    
    // 创建预览 URL
    const reader = new FileReader();
    reader.onload = (e) => {
      coverPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const removeFile = () => {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  metadata.value = { title: '', artist: '', album: '' };
};

const removeCover = () => {
  coverFile.value = null;
  coverPreview.value = '';
  if (coverInput.value) {
    coverInput.value.value = '';
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  
  const files = event.dataTransfer?.files;
  if (files && files[0] && files[0].type.startsWith('audio/')) {
    selectedFile.value = files[0];
    extractMetadataFromFileName(selectedFile.value.name);
    errorMessage.value = '';
  } else {
    errorMessage.value = '请选择音频文件';
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
};

const extractMetadataFromFileName = (fileName: string) => {
  // 从文件名提取艺术家和标题
  // 格式：艺术家 - 标题.mp3
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const parts = nameWithoutExt.split(' - ');
  
  if (parts.length >= 2) {
    metadata.value.artist = parts[0].trim();
    metadata.value.title = parts.slice(1).join(' - ').trim();
  } else {
    metadata.value.title = nameWithoutExt;
    metadata.value.artist = '未知艺术家';
  }
  
  metadata.value.album = '未知专辑';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const startUpload = async () => {
  if (!selectedFile.value || !canUpload.value) return;
  
  uploading.value = true;
  uploadProgress.value = 0;
  errorMessage.value = '';
  showSuccess.value = false;
  
  const token = localStorage.getItem('token');
  if (!token) {
    errorMessage.value = '请先登录';
    uploading.value = false;
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('music_file', selectedFile.value);
    formData.append('title', metadata.value.title);
    formData.append('artist', metadata.value.artist);
    formData.append('album', metadata.value.album);
    
    if (coverFile.value) {
      formData.append('cover_image', coverFile.value);
    }
    
    // 临时使用绝对 URL 测试
    const baseUrl = 'http://localhost:3000'; // 后端端口
    const uploadUrl = `${baseUrl}/api/music/my/upload`;
    
    console.log('上传请求 URL:', uploadUrl);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    console.log('上传响应状态:', response.status);
    console.log('响应 URL:', response.url);
    
    // 先检查响应类型
    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // 如果不是 JSON，读取文本内容
      const text = await response.text();
      console.log('非 JSON 响应:', text);
      throw new Error(`服务器返回了非 JSON 响应: ${text.substring(0, 100)}`);
    }
    
    console.log('上传响应数据:', result);
    
    if (response.ok && result.code === 200) {
      // 显示成功提示
      showSuccess.value = true;
      
      // 触发全局刷新事件
      window.dispatchEvent(new CustomEvent('music-uploaded'));
      
      // 2秒后自动关闭弹窗
      successTimer = setTimeout(() => {
        showSuccess.value = false;
        emit('upload-success');
        closeModal();
      }, 2000);
      
    } else {
      throw new Error(result.message || `上传失败 (${response.status})`);
    }
    
  } catch (error) {
    console.error('上传失败:', error);
    if (error instanceof SyntaxError) {
      errorMessage.value = '服务器响应格式错误，请检查后端服务';
    } else {
      errorMessage.value = error instanceof Error ? error.message : '上传失败，请重试';
    }
  } finally {
    uploading.value = false;
  }
};

// 清理定时器
const clearSuccessTimer = () => {
  if (successTimer) {
    clearTimeout(successTimer);
    successTimer = null;
  }
};

const closeModal = () => {
  clearSuccessTimer();
  if (!uploading.value) {
    emit('close');
  }
};

// 键盘事件监听
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

// 添加全局键盘事件监听
document.addEventListener('keydown', handleKeydown);

// 组件卸载时清理定时器
onUnmounted(() => {
  clearSuccessTimer();
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.upload-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.upload-modal {
  background: linear-gradient(to bottom, #2d0a31, #1a0520);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(138, 43, 226, 0.3);
}

.modal-header h3 {
  margin: 0;
  color: #fff;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: #d8bfd8;
  font-size: 20px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.upload-area {
  border: 2px dashed rgba(185, 85, 211, 0.5);
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(45, 10, 49, 0.5);
}

.upload-area:hover {
  border-color: #b955d3;
  background: rgba(185, 85, 211, 0.1);
}

.upload-area.drag-over {
  border-color: #b955d3;
  background: rgba(185, 85, 211, 0.2);
}

.upload-area.has-file {
  padding: 20px;
}

.file-input {
  display: none;
}

.upload-icon {
  font-size: 48px;
  color: #b955d3;
  margin-bottom: 15px;
}

.upload-text {
  color: #d8bfd8;
  margin: 0;
  font-size: 16px;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
}

.file-icon {
  font-size: 24px;
  color: #b955d3;
  margin-right: 15px;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-name {
  color: #fff;
  margin: 0 0 5px 0;
  font-weight: 500;
}

.file-size {
  color: #b088b6;
  margin: 0;
  font-size: 14px;
}

.remove-file {
  background: none;
  border: none;
  color: #ff6b6b;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.remove-file:hover {
  background: rgba(255, 107, 107, 0.1);
}

.metadata-form {
  margin-top: 25px;
}

.metadata-form h4 {
  color: #fff;
  margin: 0 0 15px 0;
  font-size: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #d8bfd8;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.form-input:focus {
  border-color: #b955d3;
}

.form-input::placeholder {
  color: #8a6d8f;
}

.cover-upload {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.cover-preview {
  width: 80px;
  height: 80px;
  border: 2px dashed rgba(185, 85, 211, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

.cover-preview:hover {
  border-color: #b955d3;
}

.cover-preview.has-cover {
  border-style: solid;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  font-size: 24px;
  color: #b955d3;
}

.cover-input {
  display: none;
}

.cover-actions {
  flex: 1;
}

.cover-remove-btn {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.cover-remove-btn:hover {
  background: rgba(255, 107, 107, 0.2);
}

.cover-hint {
  color: #8a6d8f;
  font-size: 12px;
  margin: 8px 0 0 0;
}

.upload-progress {
  margin-top: 20px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #b955d3, #8a2be2);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  color: #d8bfd8;
  font-size: 14px;
  text-align: center;
  margin: 8px 0 0 0;
}

.error-message {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 12px 15px;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(138, 43, 226, 0.3);
}

.btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #d8bfd8;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-upload {
  background: linear-gradient(135deg, #b955d3, #8a2be2);
  color: white;
}

.btn-upload:hover:not(:disabled) {
  box-shadow: 0 0 15px rgba(185, 85, 211, 0.5);
}

.btn-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 成功提示样式 */
.success-toast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(76, 175, 80, 0.95);
  color: white;
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(76, 175, 80, 0.3);
  z-index: 1001;
  animation: slideDown 0.3s ease;
}

.success-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.success-icon {
  font-size: 32px;
}

.success-text h4 {
  margin: 0 0 5px 0;
  font-size: 18px;
}

.success-text p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    transform: translateY(20px);
    opacity: 0.7;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}

/* 滚动条样式 */
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(45, 10, 49, 0.3);
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb {
  background-color: #b955d3;
  border-radius: 3px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .upload-modal {
    width: 95%;
    margin: 20px;
  }
  
  .modal-body {
    padding: 15px;
  }
  
  .upload-area {
    padding: 30px 15px;
  }
  
  .cover-upload {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .success-toast {
    width: 80%;
    padding: 15px 20px;
  }
}
</style>