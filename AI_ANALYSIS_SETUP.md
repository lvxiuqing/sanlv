# AI 智能分析功能配置指南

## 功能概述

在"成绩总览"页面集成 AI 分析功能，可以自动生成教学质量分析报告。

### 功能特性
- 📊 分析班级成绩三率数据
- 📈 识别成绩两极分化现象
- 💡 提供教学改进建议
- ⚡ 流式输出，打字机效果显示

---

## 环境配置

### 1. 获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://www.deepseek.com)
2. 注册账户并登录
3. 进入 API 控制台
4. 创建 API Key
5. 复制 API Key 备用

### 2. 配置环境变量

#### 本地开发环境

创建 `.env.local` 文件（项目根目录）：

```bash
DEEPSEEK_API_KEY=your_api_key_here
```

#### Zeabur 部署环境

1. 登录 Zeabur 控制台
2. 进入项目设置
3. 添加环境变量：
   - 变量名：`DEEPSEEK_API_KEY`
   - 变量值：你的 API Key

---

## 安装依赖

```bash
npm install
```

新增依赖：
- `express` - 后端框架
- `cors` - 跨域支持
- `node-fetch` - HTTP 请求库

---

## 运行方式

### 开发环境

**方式1：分别运行前后端**

```bash
# 终端1：运行前端（Vite）
npm run dev

# 终端2：运行后端（Express）
npm run dev:server
```

**方式2：同时运行前后端**

```bash
npm run dev:all
```

### 生产环境

```bash
npm run build
npm start
```

---

## 使用流程

### 前端操作

1. 登录系统（管理员账号）
2. 进入"成绩总览"页面
3. 选择年级和日期
4. 点击右上角"生成AI智能分析报告"按钮
5. 等待 AI 分析完成
6. 查看分析结果，可复制文本

### 后端接口

**请求地址：** `POST /api/analyze`

**请求体：**
```json
{
  "analysisData": {
    "grade": "五",
    "date": "2024-11-23",
    "subjects": ["语文", "数学", "英语"],
    "classData": {
      "语文": [
        {
          "class": 1,
          "excellentRate": 0.65,
          "comprehensiveRate": 0.85,
          "passRate": 0.95,
          "totalRate": 2.45,
          "rank": 1
        }
      ]
    },
    "dispersalData": {
      "语文": {
        "1": 25.5,
        "2": 28.3
      }
    }
  }
}
```

**响应格式：** SSE（Server-Sent Events）流式响应

```
data: {"content":"分析内容..."}
data: {"content":"继续分析..."}
data: [DONE]
```

---

## 系统 Prompt

```
你是一个资深的教务分析专家，请根据传入的班级成绩数据，分析教学质量，指出两极分化严重的学科，并给出教学建议。
```

分析维度：
1. 班级成绩整体水平评价
2. 各科目成绩分布特点
3. 两极分化现象识别
4. 具体教学改进建议

---

## 故障排除

### 问题1：API 连接失败

**错误信息：** `API 请求失败`

**解决方案：**
- 检查后端服务是否运行（`npm run dev:server`）
- 确认后端运行在 `http://localhost:3001`
- 检查防火墙设置

### 问题2：API Key 无效

**错误信息：** `DeepSeek API Error`

**解决方案：**
- 验证 API Key 是否正确
- 检查 API Key 是否已过期
- 确认环境变量已正确配置

### 问题3：流式响应中断

**错误信息：** 分析文本不完整

**解决方案：**
- 检查网络连接
- 增加请求超时时间
- 查看浏览器控制台错误日志

---

## 性能优化建议

1. **缓存分析结果**：避免重复分析相同数据
2. **限流控制**：防止频繁调用 API
3. **超时设置**：设置合理的请求超时时间
4. **错误重试**：网络失败时自动重试

---

## 安全建议

1. ✅ **不要在前端暴露 API Key**
2. ✅ **使用环境变量管理敏感信息**
3. ✅ **在后端验证请求来源**
4. ✅ **限制 API 调用频率**
5. ✅ **定期轮换 API Key**

---

## 部署到 Zeabur

### 1. 更新 zbpack.json

```json
{
  "build": "npm install && npm run build",
  "install": "npm install",
  "output_dir": "dist",
  "framework": "vite",
  "start_cmd": "npm start"
}
```

### 2. 配置环境变量

在 Zeabur 控制台添加：
- `DEEPSEEK_API_KEY`: 你的 API Key
- `PORT`: 3001（可选，默认值）

### 3. 部署

```bash
git push origin main
```

Zeabur 会自动构建并部署。

---

## 常见问题

**Q: AI 分析需要多长时间？**
A: 通常 10-30 秒，取决于数据量和网络速度。

**Q: 可以离线使用吗？**
A: 不可以，需要 DeepSeek API 连接。

**Q: 分析结果准确度如何？**
A: 取决于输入数据的质量和 AI 模型的能力。建议结合人工审核。

**Q: 支持多语言吗？**
A: 当前仅支持中文，可修改 System Prompt 支持其他语言。

---

## 技术栈

- **前端**：React + Ant Design
- **后端**：Express.js + Node.js
- **AI 服务**：DeepSeek API
- **通信**：HTTP + SSE（Server-Sent Events）

---

## 相关文件

- `src/pages/OverviewPage.jsx` - 前端页面
- `server/index.js` - 后端服务器
- `server/ai-analysis.js` - AI 分析逻辑
- `package.json` - 项目配置

---

## 许可证

MIT
