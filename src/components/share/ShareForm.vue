<template>
    <div class="share-form">
      <div class="form-header">
        <h3>分享你的想法</h3>
      </div>
      <div class="form-content">
        <textarea 
          v-model="shareContent" 
          placeholder="有什么新鲜事想分享吗？"
          maxlength="500"
          class="share-textarea"
        ></textarea>
        <div class="character-count">{{ shareContent.length }}/500</div>
        
        <div class="attachment-options">
          <button class="attachment-btn" @click="triggerImageUpload">
            <i class="fas fa-image"></i>
            <span>图片</span>
          </button>
          <button class="attachment-btn" @click="showLocationOptions">
            <i class="fas fa-map-marker-alt"></i>
            <span>位置</span>
          </button>
          <input 
            type="file" 
            ref="imageInput" 
            accept="image/*" 
            @change="handleImageUpload" 
            style="display: none;"
          >
        </div>
        
        <div v-if="selectedImage" class="image-preview">
          <img :src="selectedImage" alt="预览图片">
          <button class="remove-image-btn" @click="removeImage">×</button>
        </div>
        
        <div v-if="showLocation" class="location-selector">
          <select v-model="selectedLocation">
            <option value="" disabled selected>选择位置</option>
            <option value="gym">健身房</option>
            <option value="park">公园</option>
            <option value="home">家中</option>
            <option value="outdoor">户外</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button 
          :disabled="!shareContent.trim()" 
          @click="submitShare"
          class="share-btn"
        >
          分享
        </button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  
  const shareContent = ref('')
  const selectedImage = ref('')
  const showLocation = ref(false)
  const selectedLocation = ref('')
  const imageInput = ref<HTMLInputElement | null>(null)
  
  const triggerImageUpload = () => {
    imageInput.value?.click()
  }
  
  const handleImageUpload = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      const reader = new FileReader()
      reader.onload = (e) => {
        selectedImage.value = e.target?.result as string
      }
      reader.readAsDataURL(target.files[0])
    }
  }
  
  const removeImage = () => {
    selectedImage.value = ''
    if (imageInput.value) {
      imageInput.value.value = ''
    }
  }
  
  const showLocationOptions = () => {
    showLocation.value = !showLocation.value
    if (!showLocation.value) {
      selectedLocation.value = ''
    }
  }
  
  const submitShare = () => {
    // 这里处理分享提交逻辑
    const shareData = {
      content: shareContent.value,
      image: selectedImage.value,
      location: selectedLocation.value,
      timestamp: new Date().toISOString()
    }
    
    console.log('分享内容:', shareData)
    // 通常这里会调用API或触发store action
    
    // 重置表单
    shareContent.value = ''
    selectedImage.value = ''
    selectedLocation.value = ''
    showLocation.value = false
  }
  </script>
  
  <style scoped>
  .share-form {
    background-color: #1f2937;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
  }
  
  .form-header h3 {
    margin: 0 0 16px 0;
    color: #e5e7eb;
    font-size: 18px;
  }
  
  .share-textarea {
    width: 100%;
    min-height: 100px;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 8px;
    padding: 12px;
    color: #e5e7eb;
    resize: vertical;
    margin-bottom: 8px;
  }
  
  .share-textarea:focus {
    outline: none;
    border-color: #06B6D4;
  }
  
  .character-count {
    text-align: right;
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 16px;
  }
  
  .attachment-options {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .attachment-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: transparent;
    border: 1px solid #4b5563;
    border-radius: 20px;
    padding: 8px 16px;
    color: #e5e7eb;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .attachment-btn:hover {
    background-color: #374151;
  }
  
  .image-preview {
    position: relative;
    margin-bottom: 16px;
  }
  
  .image-preview img {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .remove-image-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .location-selector {
    margin-bottom: 16px;
  }
  
  .location-selector select {
    width: 100%;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 8px;
    padding: 8px 12px;
    color: #e5e7eb;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
  }
  
  .share-btn {
    background-color: #06B6D4;
    color: white;
    border: none;
    border-radius: 20px;
    padding: 10px 24px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .share-btn:disabled {
    background-color: #4b5563;
    cursor: not-allowed;
  }
  
  .share-btn:not(:disabled):hover {
    background-color: #0891b2;
  }
  </style>