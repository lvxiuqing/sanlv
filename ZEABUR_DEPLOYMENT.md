# Zeabur 分离部署指南

本项目采用**前后端分离部署**方案，需要在 Zeabur 上创建两个独立的项目。

## 前置条件

- GitHub 账号（已连接到 Zeabur）
- 仓库：`lvxiuqing/sanlv`
- Zeabur 账号

---

## 部署步骤

### 1️⃣ 部署前端（Vite React）

**在 Zeabur 上创建第一个项目：**

1. 访问 https://zeabur.com
2. 点击「New Project」
3. 选择「Import from Git」
4. 连接 GitHub 账号
5. 选择仓库：`lvxiuqing/sanlv`
6. **项目名称**：`sanlv-frontend`（或自定义）
7. 点击「Deploy」

**Zeabur 会自动检测到：**
- `zeabur.json` 配置（Vite builder）
- 自动构建：`npm run build`
- 自动输出目录：`dist`

**部署完成后：**
- 获得前端 URL，例如：`https://sanlv-frontend.zeabur.app`
- 记下这个 URL

---

### 2️⃣ 部署后端（Node.js Express）

**在 Zeabur 上创建第二个项目：**

1. 点击「New Project」
2. 选择「Import from Git」
3. 选择仓库：`lvxiuqing/sanlv`
4. **项目名称**：`sanlv-backend`（或自定义）
5. 点击「Deploy」

**配置后端：**

6. 部署完成后，进入项目设置
7. 找到「Root Directory」或「Build Settings」
8. **设置根目录为**：`server`
9. 点击「Save」

**添加环境变量：**

10. 进入后端项目的「Variables」或「Environment」
11. 添加新变量：
    - **Key**：`DASHSCOPE_API_KEY`
    - **Value**：`sk-ce7a8a0348a6469fa26bef780dd0b50f`
12. 点击「Save」
13. 后端会自动重新部署

**部署完成后：**
- 获得后端 URL，例如：`https://sanlv-backend.zeabur.app`
- 记下这个 URL

---

### 3️⃣ 配置前端连接后端

**更新前端的环境变量：**

1. 进入前端项目设置
2. 找到「Variables」或「Environment」
3. 添加或更新变量：
   - **Key**：`VITE_API_URL`
   - **Value**：`https://sanlv-backend.zeabur.app`（替换为你的后端 URL）
4. 点击「Save」
5. 前端会自动重新部署

---

## 验证部署

### 检查前端
- 访问：`https://sanlv-frontend.zeabur.app`
- 应该能看到登录页面

### 检查后端健康状态
- 访问：`https://sanlv-backend.zeabur.app/health`
- 应该返回：`{"status":"ok","timestamp":"..."}`

### 测试 AI 分析功能
1. 在前端登录
2. 进入「成绩总览」页面
3. 点击「生成AI智能分析报告」
4. 应该能看到 AI 生成的分析文本

---

## 常见问题

### Q: 前端显示 CORS 错误
**A:** 检查 `VITE_API_URL` 是否正确设置为后端 URL

### Q: 后端返回 500 错误
**A:** 检查后端是否配置了 `DASHSCOPE_API_KEY` 环境变量

### Q: 部署失败
**A:** 查看 Zeabur 的「Build Logs」和「Runtime Logs」，查找具体错误

---

## 项目结构

```
sanlv/
├── zeabur.json           # 前端配置
├── .env.production       # 前端生产环境变量
├── src/                  # 前端源代码
├── dist/                 # 前端构建输出
├── server/
│   ├── zeabur.json       # 后端配置
│   ├── package.json      # 后端依赖
│   ├── index.js          # 后端入口
│   └── ai-analysis.js    # AI 分析逻辑
└── package.json          # 前端依赖
```

---

## 环境变量总结

### 前端环境变量（Zeabur 前端项目）
```
VITE_API_URL=https://sanlv-backend.zeabur.app
```

### 后端环境变量（Zeabur 后端项目）
```
DASHSCOPE_API_KEY=sk-ce7a8a0348a6469fa26bef780dd0b50f
```

---

## 后续维护

- **更新代码**：推送到 GitHub main 分支
- **自动部署**：Zeabur 会自动检测到更新并重新部署
- **查看日志**：在 Zeabur 项目中查看「Build Logs」和「Runtime Logs」

