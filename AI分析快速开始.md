# AI 智能分析 - 快速开始指南

## 🚀 5分钟快速启动

### 第1步：获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://www.deepseek.com)
2. 注册并登录账户
3. 进入 API 控制台
4. 创建 API Key 并复制

### 第2步：配置环境变量

**Windows 用户：**

1. 在项目根目录找到 `.env.example` 文件
2. 复制为 `.env.local`
3. 用记事本打开 `.env.local`
4. 找到这一行：
   ```
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```
5. 替换为你的 API Key：
   ```
   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
   ```
6. 保存文件

### 第3步：启动服务

**最简单的方式 - 双击启动脚本：**

```
启动AI分析.bat
```

这个脚本会自动：
- ✅ 检查 Node.js 环境
- ✅ 安装依赖包
- ✅ 启动前端服务（端口 3000）
- ✅ 启动后端服务（端口 3001）

**或者手动启动：**

打开两个终端窗口：

```bash
# 终端1：启动前端
npm run dev

# 终端2：启动后端
npm run dev:server
```

### 第4步：使用 AI 分析

1. 浏览器自动打开 `http://localhost:3000`
2. 使用管理员账号登录
3. 进入"成绩总览"页面
4. 选择年级和日期
5. 点击右上角"生成AI智能分析报告"按钮
6. 等待 AI 分析完成

---

## 🔧 故障排除

### 问题1：启动脚本无法运行

**症状：** 双击 `启动AI分析.bat` 没有反应

**解决方案：**
1. 右键点击 `启动AI分析.bat`
2. 选择"以管理员身份运行"
3. 或者在 PowerShell 中运行：
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\启动AI分析.bat
   ```

### 问题2：API 请求失败

**症状：** 点击"生成AI智能分析报告"后显示 "API 请求失败"

**原因和解决方案：**

| 原因 | 解决方案 |
|------|--------|
| 后端服务未运行 | 运行 `npm run dev:server` |
| 端口 3001 被占用 | 关闭占用该端口的程序 |
| 防火墙阻止 | 允许 Node.js 通过防火墙 |
| API 地址错误 | 检查 `.env.local` 中的 `VITE_API_URL` |

**快速诊断：**

运行诊断工具：
```
诊断AI分析问题.bat
```

### 问题3：DeepSeek API 错误

**症状：** 显示 "DeepSeek API Error"

**原因和解决方案：**

| 错误信息 | 原因 | 解决方案 |
|--------|------|--------|
| Invalid API Key | API Key 错误 | 检查 `.env.local` 中的 API Key |
| Insufficient balance | 账户余额不足 | 充值 DeepSeek 账户 |
| Rate limit exceeded | 请求过于频繁 | 等待后重试 |

### 问题4：分析文本不完整

**症状：** AI 分析中途中断

**解决方案：**
1. 检查网络连接
2. 查看浏览器控制台（F12）的错误信息
3. 尝试重新生成分析
4. 检查后端日志

---

## 📊 使用示例

### 场景1：分析五年级成绩

1. 登录系统（管理员）
2. 进入"成绩总览"
3. 选择"五年级"
4. 点击"生成AI智能分析报告"
5. 查看分析结果

**AI 会分析：**
- 各班级成绩整体水平
- 各科目的优秀率、综合率、及格率
- 成绩两极分化现象（极差）
- 教学改进建议

### 场景2：对比历史数据

1. 选择年级
2. 选择历史日期（如上月的考试日期）
3. 生成 AI 分析
4. 对比本月和上月的分析结果

---

## 💡 常见问题

**Q: 为什么需要后端服务？**
A: 后端服务负责与 DeepSeek API 通信，保护 API Key 不暴露在前端。

**Q: 可以在生产环境使用吗？**
A: 可以。部署到 Zeabur 时需要配置 `DEEPSEEK_API_KEY` 环境变量。

**Q: AI 分析需要多长时间？**
A: 通常 10-30 秒，取决于数据量和网络速度。

**Q: 分析结果准确吗？**
A: AI 分析基于输入数据，建议结合人工审核。

**Q: 支持离线使用吗？**
A: 不支持，需要 DeepSeek API 连接。

---

## 🔐 安全提示

1. ✅ **不要在 GitHub 上提交 `.env.local`**
   - `.env.local` 已在 `.gitignore` 中

2. ✅ **定期轮换 API Key**
   - 在 DeepSeek 控制台重新生成

3. ✅ **限制 API 调用频率**
   - 避免频繁点击"生成分析"按钮

4. ✅ **监控 API 使用量**
   - 定期检查 DeepSeek 账户消费

---

## 📝 文件说明

| 文件 | 说明 |
|------|------|
| `启动AI分析.bat` | 一键启动脚本（Windows） |
| `诊断AI分析问题.bat` | 故障诊断工具（Windows） |
| `.env.example` | 环境变量模板 |
| `.env.local` | 环境变量配置（本地） |
| `server/index.js` | 后端服务器 |
| `server/ai-analysis.js` | AI 分析逻辑 |
| `src/pages/OverviewPage.jsx` | 前端页面 |
| `AI_ANALYSIS_SETUP.md` | 详细配置文档 |

---

## 🆘 需要帮助？

1. 查看 `AI_ANALYSIS_SETUP.md` 了解详细配置
2. 运行 `诊断AI分析问题.bat` 进行诊断
3. 查看浏览器控制台（F12）的错误信息
4. 检查后端服务日志

---

## 🎯 下一步

- [ ] 配置 DEEPSEEK_API_KEY
- [ ] 运行 `启动AI分析.bat`
- [ ] 测试 AI 分析功能
- [ ] 部署到 Zeabur（可选）

祝你使用愉快！🎉
