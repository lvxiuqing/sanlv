# API 代理配置说明

## 🔧 问题解决

### 问题
前端和后端运行在不同端口（前端 3000/3004，后端 3001），导致 CORS 跨域问题和 API 404 错误。

### 解决方案
在 `vite.config.js` 中配置代理，将前端的 `/api` 请求转发到后端。

---

## 📝 配置详情

### vite.config.js 修改

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  },
  // ... 其他配置
})
```

### 前端代码修改

**修改前：**
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const response = await fetch(`${apiUrl}/api/analyze`, {
```

**修改后：**
```javascript
// 使用相对路径，Vite 会自动代理到后端
const response = await fetch('/api/analyze', {
```

---

## 🔄 工作流程

```
前端请求
  ↓
http://localhost:3000/api/analyze
  ↓
Vite 代理拦截
  ↓
转发到 http://localhost:3001/api/analyze
  ↓
后端处理
  ↓
返回响应
  ↓
前端接收
```

---

## ✅ 优势

1. **解决 CORS 问题** - 前后端同源
2. **简化配置** - 无需手动配置 API 地址
3. **开发友好** - 自动代理，无需修改代码
4. **生产兼容** - 生产环境可配置不同的后端地址

---

## 🚀 使用方式

### 本地开发

```bash
# 后端服务
npm run dev:server

# 前端服务（自动代理）
npm run dev
```

前端会自动将 `/api` 请求代理到后端。

### 生产环境

生产环境中，前后端通常部署在同一域名下，无需额外配置。

---

## 📋 相关文件

- `vite.config.js` - Vite 配置文件
- `src/pages/OverviewPage.jsx` - 前端页面（已修改）
- `server/index.js` - 后端服务器

---

## 🎯 现在可以

1. ✅ 前端和后端正常通信
2. ✅ AI 分析功能正常工作
3. ✅ 无 CORS 错误
4. ✅ 无 404 错误

---

## 💡 提示

- 修改代理配置后需要重启前端服务
- 后端服务需要始终运行
- 确保 `.env.local` 中配置了 `DEEPSEEK_API_KEY`

祝你使用愉快！🎉
