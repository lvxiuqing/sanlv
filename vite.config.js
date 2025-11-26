import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        // 添加哈希值到文件名，实现缓存破坏
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash][extname]',
        manualChunks: {
          // 将React相关库打包到一起
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将Ant Design打包到一起
          'antd-vendor': ['antd'],
          // 将图表库单独打包
          'chart-vendor': ['recharts'],
          // 将Excel处理库单独打包
          'xlsx-vendor': ['xlsx'],
        },
      },
    },
    // 使用esbuild压缩（比terser快，且内置）
    minify: 'esbuild',
    // 设置chunk大小警告的限值
    chunkSizeWarningLimit: 1000,
  },
})

