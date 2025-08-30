import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  // 服务器配置
  server: {
    host: '0.0.0.0', // 监听所有网络接口
    port: 5173,      // 确保端口可用
    strictPort: true // 严格使用指定端口
  },
  // 插件配置
  plugins: [vue()],
  // 路径解析配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  define:{
    'process.env':{}
  }
})