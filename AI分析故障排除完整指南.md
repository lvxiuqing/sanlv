# AI 分析故障排除 - 完整指南

## 📌 快速诊断

如果遇到 **"API 请求失败"** 或 **"404 Not Found"** 错误，按以下步骤操作：

### 第1步：验证后端服务

```bash
# 打开新的终端窗口，运行：
npm run dev:server

# 预期输出：
# ╔════════════════════════════════════════╗
# ║    AI 分析服务已启动                   ║
# ║    地址: http://localhost:3001         ║
# ║    API: POST /api/analyze              ║
# ║    健康检查: GET /health               ║
# ╚════════════════════════════════════════╝
```

### 第2步：验证环境变量

```bash
# 查看 .env.local 文件
type .env.local

# 应该包含：
# DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
```

### 第3步：测试 API 连接

```bash
# 在浏览器中访问：
http://localhost:3001/health

# 预期响应：
# {"status":"ok","timestamp":"2024-11-23T05:22:00.000Z"}
```

### 第4步：运行完整测试

```bash
# 运行测试脚本
node 测试后端API.js
```

---

## 🔴 常见错误及解决方案

### 错误1：API 请求失败 / 404 Not Found

**症状：**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
AI 分析错误: Error: API 请求失败
```

**原因：**
- ❌ 后端服务未启动
- ❌ 后端启动失败
- ❌ 端口 3001 被占用

**解决方案：**

1. **启动后端服务：**
   ```bash
   npm run dev:server
   ```

2. **检查端口占用：**
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # macOS/Linux
   lsof -i :3001
   ```

3. **杀死占用进程：**
   ```bash
   # Windows（假设 PID 为 12345）
   taskkill /PID 12345 /F
   
   # macOS/Linux
   kill -9 12345
   ```

4. **重新启动后端：**
   ```bash
   npm run dev:server
   ```

---

### 错误2：未配置 DeepSeek API Key

**症状：**
```
AI 分析错误: Error: 未配置 DeepSeek API Key
```

**原因：**
- ❌ `.env.local` 文件不存在
- ❌ `DEEPSEEK_API_KEY` 未配置
- ❌ API Key 为空

**解决方案：**

1. **创建 `.env.local` 文件：**
   ```bash
   copy .env.example .env.local
   ```

2. **编辑 `.env.local`：**
   ```
   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
   ```

3. **重启后端服务：**
   ```bash
   npm run dev:server
   ```

---

### 错误3：DeepSeek API 错误

**症状：**
```
DeepSeek API Error: Invalid API Key
DeepSeek API Error: Insufficient balance
DeepSeek API Error: Rate limit exceeded
```

**原因：**
- ❌ API Key 无效或过期
- ❌ 账户余额不足
- ❌ 请求过于频繁

**解决方案：**

1. **验证 API Key：**
   - 登录 DeepSeek 官网
   - 检查 API Key 是否有效
   - 确认账户余额充足

2. **重新生成 API Key：**
   - 在 DeepSeek 控制台删除旧 Key
   - 创建新 Key
   - 更新 `.env.local`

3. **等待后重试：**
   - 如果是限流错误，等待几分钟后重试

---

### 错误4：分析文本不完整

**症状：**
```
AI 分析中途中断，文本不完整
```

**原因：**
- ❌ 网络连接不稳定
- ❌ 后端服务异常
- ❌ DeepSeek API 超时

**解决方案：**

1. **检查网络连接：**
   ```bash
   ping api.deepseek.com
   ```

2. **查看浏览器控制台：**
   - 按 F12 打开开发者工具
   - 查看 Console 标签的错误信息
   - 查看 Network 标签的请求状态

3. **查看后端日志：**
   - 观察后端终端窗口的输出
   - 查看是否有错误信息

4. **重新生成分析：**
   - 等待几秒后重新点击按钮

---

### 错误5：前端无法连接到后端

**症状：**
```
浏览器控制台显示连接超时或拒绝
```

**原因：**
- ❌ 后端服务未运行
- ❌ 防火墙阻止
- ❌ 前端 API 地址配置错误

**解决方案：**

1. **确保后端运行：**
   ```bash
   npm run dev:server
   ```

2. **检查防火墙：**
   - Windows：允许 Node.js 通过防火墙
   - 或暂时关闭防火墙测试

3. **验证 API 地址：**
   - 检查 OverviewPage.jsx 中的 API URL
   - 应该是 `http://localhost:3001`

4. **测试连接：**
   ```bash
   curl http://localhost:3001/health
   ```

---

## 🧪 诊断工具

### 工具1：快速验证脚本

```bash
快速验证.bat
```

自动检查：
- ✅ 后端服务是否运行
- ✅ 环境变量是否配置
- ✅ 前端服务是否运行

### 工具2：完整诊断脚本

```bash
诊断AI分析问题.bat
```

详细检查：
- ✅ Node.js 环境
- ✅ npm 包管理器
- ✅ 项目依赖
- ✅ 环境变量
- ✅ 后端文件
- ✅ 前端文件
- ✅ 端口占用
- ✅ 后端连接

### 工具3：API 测试脚本

```bash
node 测试后端API.js
```

测试内容：
- ✅ 健康检查
- ✅ API Key 配置
- ✅ AI 分析接口
- ✅ 流式响应

---

## 📋 完整排查清单

按照以下顺序逐一检查：

```
□ 第1步：后端服务
  □ 运行 npm run dev:server
  □ 查看启动信息
  □ 确认没有错误

□ 第2步：环境变量
  □ .env.local 文件存在
  □ DEEPSEEK_API_KEY 已配置
  □ API Key 格式正确（sk-开头）

□ 第3步：端口检查
  □ 端口 3001 未被占用
  □ 端口 3000 未被占用
  □ 防火墙允许连接

□ 第4步：API 连接
  □ 访问 http://localhost:3001/health 成功
  □ 返回 JSON 响应
  □ 状态为 "ok"

□ 第5步：前端服务
  □ 运行 npm run dev
  □ 浏览器自动打开
  □ 可以正常访问

□ 第6步：功能测试
  □ 登录系统（管理员）
  □ 进入"成绩总览"页面
  □ 点击"生成AI智能分析报告"
  □ 等待分析完成
  □ 查看分析结果
```

---

## 🔄 完整启动流程

### 第一次启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
copy .env.example .env.local
# 编辑 .env.local，填入 DEEPSEEK_API_KEY

# 3. 启动后端（终端1）
npm run dev:server

# 4. 启动前端（终端2）
npm run dev

# 5. 浏览器自动打开 http://localhost:3000
```

### 后续启动

```bash
# 终端1：后端
npm run dev:server

# 终端2：前端
npm run dev

# 或者一键启动（Windows）
启动AI分析.bat
```

---

## 📊 预期输出示例

### 后端启动成功

```
╔════════════════════════════════════════╗
║    AI 分析服务已启动                   ║
║    地址: http://localhost:3001         ║
║    API: POST /api/analyze              ║
║    健康检查: GET /health               ║
╚════════════════════════════════════════╝

[2024-11-23T05:22:00.000Z] POST /api/analyze
收到 AI 分析请求
开始调用 DeepSeek API...
```

### 前端启动成功

```
  VITE v5.4.20  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### API 测试成功

```
🧪 开始测试后端 API...

【测试1】健康检查
✅ 后端服务正常运行
   状态: ok
   时间: 2024-11-23T05:22:00.000Z

【测试2】API Key 配置检查
✅ DEEPSEEK_API_KEY 已配置

【测试3】AI 分析接口
✅ API 连接成功，开始接收流式数据...

【AI 分析结果】

根据数据分析，五年级整体成绩表现良好...
```

---

## 🎯 成功标志

当你看到以下现象时，说明一切正常：

1. ✅ 后端终端显示：`AI 分析服务已启动`
2. ✅ 前端浏览器显示：系统主页
3. ✅ 浏览器访问 `/health` 返回 JSON
4. ✅ 点击按钮后，弹窗出现
5. ✅ AI 分析文本逐字显示（打字机效果）
6. ✅ 分析完成后显示完整报告

---

## 📞 获取帮助

如果仍然无法解决，请：

1. **查看相关文档：**
   - `AI分析快速开始.md` - 快速启动指南
   - `AI_ANALYSIS_SETUP.md` - 详细配置文档
   - `API404错误排查.md` - 404 错误专项指南

2. **运行诊断工具：**
   - `快速验证.bat` - 快速检查
   - `诊断AI分析问题.bat` - 完整诊断
   - `测试后端API.js` - API 测试

3. **查看日志：**
   - 后端终端窗口的输出
   - 浏览器控制台（F12）
   - 浏览器 Network 标签

4. **检查文件：**
   - `.env.local` 是否存在
   - `server/index.js` 是否存在
   - `server/ai-analysis.js` 是否存在

---

## 🎉 总结

AI 分析功能的常见问题都可以通过以下方式解决：

1. **启动后端服务** - `npm run dev:server`
2. **配置 API Key** - 编辑 `.env.local`
3. **运行诊断工具** - `快速验证.bat`
4. **查看日志信息** - 终端和浏览器控制台
5. **重新启动服务** - 停止后重新启动

祝你使用愉快！🚀
