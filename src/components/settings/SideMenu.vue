<template>
  <div 
    class="side-menu-mask" 
    :class="{ 'menu-open': isOpen }"
    @click="closeMenu"
    :style="currentThemeVars"
  ></div>
  
  <!-- 菜单内容 -->
  <div 
  class="side-menu" 
  :class="[{ 'menu-open': isOpen }, menuStore.theme]"
  :style="currentThemeVars">
    <!-- 用户信息区域 -->
    <div class="user-info-section">
      <div class="user-avatar" @click="triggerAvatarClick">
        <img 
          v-if="userStore.currentUser?.avatar" 
          :src="userStore.currentUser?.avatar" 
          alt="用户头像"
        >
        <i v-else class="fa fa-user-circle"></i>
        <input 
          type="file" 
          ref="avatarInput" 
          accept="image/*" 
          @change="handleAvatarUpload"
          style="display: none"
        >
      </div>
      
      <div class="user-details">
        <h3 v-if="userStore.isLoggedIn">{{ userStore.currentUser!.username }}</h3>
        <h3 v-else>未登录</h3>
        <p v-if="userStore.isLoggedIn && userStore.currentUser!.email">
          {{ userStore.currentUser!.email }}
        </p>
        <p v-else>请登录以同步数据</p>
      </div>
    </div>
    
    <!-- 登录/注册表单 -->
    <div class="auth-section" v-if="!userStore.isLoggedIn">
      <div class="auth-tabs">
        <button 
          :class="['tab-btn', { active: authTab === 'login' }]"
          @click="authTab = 'login'"
        >
          登录
        </button>
        <button 
          :class="['tab-btn', { active: authTab === 'register' }]"
          @click="authTab = 'register'"
        >
          注册
        </button>
      </div>
      
      <form class="auth-form" @submit.prevent="handleAuth">
        <div class="form-group" v-if="authTab === 'register'">
          <input 
            type="text" 
            v-model="authData.username" 
            placeholder="用户名" 
            required
          >
        </div>
        
        <div class="form-group">
          <input 
            type="email" 
            v-model="authData.email" 
            placeholder="邮箱" 
            required
          >
        </div>
        
        <div class="form-group">
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="authData.password" 
            placeholder="密码" 
            required
          >
          <button 
            type="button" 
            class="toggle-password"
            @click="showPassword = !showPassword"
          >
            <i :class="['fa', showPassword ? 'fa-eye-slash' : 'fa-eye']"></i>
          </button>
        </div>
        
        <button type="submit" class="auth-submit-btn">
          {{ authTab === 'login' ? '登录' : '注册' }}
        </button>
      </form>
      
      <div class="auth-divider">
        <span>或使用第三方登录</span>
      </div>
      
      <div class="social-auth">
        <button class="social-btn wechat">
          <i class="fa fa-wechat"></i>
        </button>
        <button class="social-btn google">
          <i class="fa fa-google"></i>
        </button>
      </div>
    </div>
    
    <!-- 设置选项 -->
    <div class="settings-section" v-else>
      <h4>账户设置</h4>
      <ul class="settings-list">
        <li>
          <button @click="navigateToProfile">
            <i class="fa fa-user"></i>
            <span>个人资料</span>
            <i class="fa fa-chevron-right"></i>
          </button>
        </li>
        <li>
          <button @click="navigateToPreferences">
            <i class="fa fa-cog"></i>
            <span>偏好设置</span>
            <i class="fa fa-chevron-right"></i>
          </button>
        </li>

        <li>
          <button @click="navigateToData">
            <i class="fa fa-database"></i>
            <span>数据管理</span>
            <i class="fa fa-chevron-right"></i>
          </button>
        </li>
      </ul>
      
      <h4>更多</h4>
      <ul class="settings-list">
        <li>
          <button @click="navigateToAbout">
            <i class="fa fa-info-circle"></i>
            <span>关于应用</span>
            <i class="fa fa-chevron-right"></i>
          </button>
        </li>
        <li>
          <button @click="navigateToHelp">
            <i class="fa fa-question-circle"></i>
            <span>帮助与反馈</span>
            <i class="fa fa-chevron-right"></i>
          </button>
        </li>
      </ul>
    </div>
    
    <!-- 底部操作按钮 -->
    <div class="menu-footer">
      <button 
        v-if="userStore.isLoggedIn" 
        class="logout-btn" 
        @click="handleLogout"
      >
        <i class="fa fa-sign-out"></i>
        退出登录
      </button>
      <button class="close-menu-btn" @click="closeMenu">
        <i class="fa fa-times"></i>
        关闭菜单
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { themeConfig, ThemeType, defaultTheme } from '@/styles/theme'
import { computed } from 'vue'
import { useMenuStore } from '@/stores/menuStore'

const menuStore = useMenuStore();
const theme = computed(() => menuStore.theme);
const router = useRouter()
const userStore = useUserStore()

const props = defineProps<{
  isOpen: boolean
}>()

const currentThemeVars = computed(() => {
  const themeKey: ThemeType = 
    Object.keys(themeConfig).includes(menuStore.theme) 
      ? menuStore.theme as ThemeType 
      : defaultTheme;
  
  return themeConfig[themeKey];
});

const emit = defineEmits<{
  (e: 'close-menu'): void
}>()

const authTab = ref<'login' | 'register'>('login')
const showPassword = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)

const authData = reactive({
  username: '',
  email: '',
  password: ''
})

const closeMenu = () => {
  emit('close-menu')
}

const triggerAvatarClick = () => {
  if (avatarInput.value) {
    avatarInput.value.click()
  }
}

const handleAvatarUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      userStore.updateAvatar(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }
}

const handleAuth = async () => {
  let success = false
  if (authTab.value === 'login') {
    success = userStore.login(authData.email, authData.password)
  } else {
    success = userStore.register(authData.username, authData.email, authData.password)
  }
  if (success) {
    authData.username = ''
    authData.email = ''
    authData.password = ''
  } else {
    alert(authTab.value === 'login' ? '登录失败，请检查邮箱和密码' : '注册失败，邮箱可能已被使用')
  }
}

const handleLogout = () => {
  userStore.logout()
  closeMenu()
}

const navigateToProfile = () => {
  closeMenu()
  router.push('/profile')
}

const navigateToPreferences = () => {
  closeMenu()
  router.push('/preferences')
}

const navigateToData = () => {
  closeMenu()
  router.push('/data-management')
}

const navigateToAbout = () => {
  closeMenu()
  router.push('/about')
}

const navigateToHelp = () => {
  closeMenu()
  router.push('/help')
}

onMounted(() => {
  
});

</script>

<style scoped>
/* 遮罩层 */
.side-menu-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.side-menu-mask.menu-open {
  opacity: 1;
  visibility: visible;
}

/* 菜单容器 */
.side-menu {
  position: fixed;
  top: 0;
  left: -300px;
  width: 300px;
  height: 100%;
  z-index: 1000;
  overflow-y: auto;
  transition: left 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 5px 0 15px rgba(0, 0, 0, 0.3);
}

.side-menu.menu-open {
  left: 0;
}

/* 运动主题 */
.side-menu.sport {
  background: linear-gradient(to bottom, #0f172a, #1e293b);
}

.side-menu.sport .user-info-section {
  background-color: rgba(30, 41, 59, 0.7);
  border-bottom: 1px solid rgba(6, 182, 212, 0.3);
}

.side-menu.sport .auth-section,
.side-menu.sport .settings-section {
  border-bottom: 1px solid rgba(6, 182, 212, 0.3);
}

.side-menu.sport .auth-tabs {
  border-bottom: 1px solid rgba(6, 182, 212, 0.3);
}

.side-menu.sport .tab-btn.active {
  color: #06B6D4;
  border-bottom: 2px solid #06B6D4;
}

.side-menu.sport .auth-submit-btn {
  background: linear-gradient(135deg, #06B6D4, #3B82F6);
}

.side-menu.sport .settings-list button i:first-child {
  color: #06B6D4;
}

.side-menu.sport .toggle-switch input:checked + .slider {
  background-color: #06B6D4;
}

/* 音乐主题 */
.side-menu.music {
  background: linear-gradient(to bottom, #1a0520, #2d0a31);
}

.side-menu.music .user-info-section {
  background-color: rgba(45, 10, 49, 0.7);
  border-bottom: 1px solid rgba(185, 85, 211, 0.3);
}

.side-menu.music .auth-section,
.side-menu.music .settings-section {
  border-bottom: 1px solid rgba(185, 85, 211, 0.3);
}

.side-menu.music .auth-tabs {
  border-bottom: 1px solid rgba(185, 85, 211, 0.3);
}

.side-menu.music .tab-btn.active {
  color: #b955d3;
  border-bottom: 2px solid #b955d3;
}

.side-menu.music .auth-submit-btn {
  background: linear-gradient(135deg, #b955d3, #8a2be2);
}

.side-menu.music .settings-list button i:first-child {
  color: #b955d3;
}

.side-menu.music .toggle-switch input:checked + .slider {
  background-color: #b955d3;
}

/* 通用样式 */
.user-info-section {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar i {
  font-size: 50px;
}

.side-menu.sport .user-avatar {
  background-color: rgba(6, 182, 212, 0.3);
}

.side-menu.sport .user-avatar i {
  color: #06B6D4;
}

.side-menu.music .user-avatar {
  background-color: rgba(185, 85, 211, 0.3);
}

.side-menu.music .user-avatar i {
  color: #b955d3;
}

.user-details h3 {
  color: #fff;
  margin-bottom: 5px;
  font-size: 18px;
}

.user-details p {
  margin: 0;
  font-size: 14px;
}

.side-menu.sport .user-details p {
  color: #94a3b8;
}

.side-menu.music .user-details p {
  color: #b088b6;
}

/* 认证区域 */
.auth-section {
  padding: 20px;
}

.auth-tabs {
  display: flex;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.side-menu.sport .tab-btn {
  color: #94a3b8;
}

.side-menu.music .tab-btn {
  color: #b088b6;
}

.auth-form {
  margin-bottom: 20px;
}

.form-group {
  position: relative;
  margin-bottom: 15px;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border-radius: 8px;
  font-size: 14px;
}

.side-menu.sport .form-group input {
  border: 1px solid rgba(6, 182, 212, 0.3);
  background-color: rgba(30, 41, 59, 0.5);
  color: #fff;
}

.side-menu.music .form-group input {
  border: 1px solid rgba(185, 85, 211, 0.3);
  background-color: rgba(45, 10, 49, 0.5);
  color: #fff;
}

.form-group input:focus {
  outline: none;
}

.side-menu.sport .form-group input:focus {
  border-color: #06B6D4;
}

.side-menu.music .form-group input:focus {
  border-color: #b955d3;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
}

.side-menu.sport .toggle-password {
  color: #94a3b8;
}

.side-menu.music .toggle-password {
  color: #b088b6;
}

.auth-submit-btn {
  width: 100%;
  padding: 12px;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-submit-btn:hover {
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
}

.auth-divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.auth-divider span {
  padding: 0 10px;
  font-size: 12px;
  position: relative;
  z-index: 1;
}

.side-menu.sport .auth-divider span {
  background-color: #0f172a;
  color: #94a3b8;
}

.side-menu.music .auth-divider span {
  background-color: #1a0520;
  color: #b088b6;
}

.auth-divider:before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  z-index: 0;
}

.side-menu.sport .auth-divider:before {
  background-color: rgba(6, 182, 212, 0.3);
}

.side-menu.music .auth-divider:before {
  background-color: rgba(185, 85, 211, 0.3);
}

.social-auth {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.social-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.social-btn.wechat {
  background-color: #07C160;
  color: white;
}

.social-btn.google {
  background-color: #DB4437;
  color: white;
}

.social-btn:hover {
  transform: scale(1.1);
}

/* 设置区域 */
.settings-section {
  padding: 20px;
  flex-grow: 1;
}

.settings-section h4 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
}

.side-menu.sport .settings-section h4 {
  color: #06B6D4;
}

.side-menu.music .settings-section h4 {
  color: #b955d3;
}

.settings-list {
  list-style: none;
  padding: 0;
  margin: 0 0 25px 0;
}

.settings-list li {
  margin-bottom: 5px;
}

.settings-list button {
  width: 100%;
  padding: 12px 15px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 8px;
}

.side-menu.sport .settings-list button {
  color: #e2e8f0;
}

.side-menu.sport .settings-list button:hover {
  background-color: rgba(6, 182, 212, 0.2);
}

.side-menu.music .settings-list button {
  color: #d8bfd8;
}

.side-menu.music .settings-list button:hover {
  background-color: rgba(185, 85, 211, 0.2);
}

.settings-list button i:first-child {
  margin-right: 10px;
  width: 20px;
  text-align: center;
}

.settings-list button span {
  flex-grow: 1;
}

.settings-list button i:last-child {
  font-size: 12px;
}

.side-menu.sport .settings-list button i:last-child {
  color: #94a3b8;
}

.side-menu.music .settings-list button i:last-child {
  color: #b088b6;
}

/* 切换开关 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch .slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.toggle-switch .slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-switch input:checked + .slider:before {
  transform: translateX(26px);
}

/* 菜单底部 */
.menu-footer {
  padding: 15px 20px;
}

.side-menu.sport .menu-footer {
  border-top: 1px solid rgba(6, 182, 212, 0.3);
}

.side-menu.music .menu-footer {
  border-top: 1px solid rgba(185, 85, 211, 0.3);
}

.logout-btn, .close-menu-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.logout-btn {
  margin-bottom: 10px;
}

.side-menu.sport .logout-btn {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.side-menu.sport .logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.3);
}

.side-menu.music .logout-btn {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.side-menu.music .logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.3);
}

.side-menu.sport .close-menu-btn {
  background-color: rgba(30, 41, 59, 0.7);
  color: #94a3b8;
}

.side-menu.sport .close-menu-btn:hover {
  background-color: rgba(6, 182, 212, 0.2);
}

.side-menu.music .close-menu-btn {
  background-color: rgba(45, 10, 49, 0.7);
  color: #b088b6;
}

.side-menu.music .close-menu-btn:hover {
  background-color: rgba(185, 85, 211, 0.2);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .side-menu {
    width: 280px;
    left: -280px;
  }
  
  .user-info-section {
    padding: 15px;
  }
  
  .user-avatar {
    width: 50px;
    height: 50px;
  }
  
  .user-avatar i {
    font-size: 40px;
  }
  
  .auth-section, .settings-section {
    padding: 15px;
  }
}
</style>