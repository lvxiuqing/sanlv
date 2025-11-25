import express from 'express'
import cors from 'cors'
import { analyzeWithAI } from './ai-analysis.js'

const app = express()
const PORT = process.env.PORT || 3002

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// AI 分析接口
app.post('/api/analyze', async (req, res) => {
  try {
    console.log('收到 AI 分析请求')
    const { analysisData } = req.body
    // 优先使用环境变量，如果没有则使用硬编码的 API Key（仅用于测试）
    const apiKey = process.env.DASHSCOPE_API_KEY || 'sk-ce7a8a0348a6469fa26bef780dd0b50f'

    if (!apiKey) {
      console.error('错误：未配置 DEEPSEEK_API_KEY')
      return res.status(400).json({ error: '未配置 DeepSeek API Key' })
    }
    
    console.log('使用 API Key:', apiKey.substring(0, 10) + '...')

    if (!analysisData) {
      console.error('错误：缺少分析数据')
      return res.status(400).json({ error: '缺少分析数据' })
    }

    console.log('开始调用 DeepSeek API...')

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    // 调用 AI 分析
    const stream = await analyzeWithAI(analysisData, apiKey)

    // 处理流式响应
    try {
      for await (const chunk of stream) {
        // 处理思考过程（如果有）
        const reasoningContent = chunk.choices?.[0]?.delta?.reasoning_content
        if (reasoningContent) {
          res.write(`data: ${JSON.stringify({ content: reasoningContent, type: 'thinking' })}\n\n`)
        }

        // 处理回复内容
        const content = chunk.choices?.[0]?.delta?.content
        if (content) {
          res.write(`data: ${JSON.stringify({ content, type: 'answer' })}\n\n`)
        }

        // 处理 token 使用情况（流结束时）
        if (chunk.usage) {
          res.write(`data: ${JSON.stringify({ usage: chunk.usage, type: 'usage' })}\n\n`)
        }
      }
      // 发送完成信号
      res.write('data: [DONE]\n\n')
    } finally {
      res.end()
    }
  } catch (error) {
    console.error('AI 分析错误:', error.message)
    console.error(error.stack)
    res.status(500).json({ error: error.message })
  }
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 处理
app.use((req, res) => {
  console.warn(`404: ${req.method} ${req.path}`)
  res.status(404).json({ error: '路由不存在' })
})

// 启动服务器
const server = app.listen(PORT, () => {
  console.log('')
  console.log('╔════════════════════════════════════════╗')
  console.log('║    AI 分析服务已启动                   ║')
  console.log(`║    地址: http://localhost:${PORT}${' '.repeat(PORT.toString().length > 4 ? 0 : 4 - PORT.toString().length)}║`)
  console.log('║    API: POST /api/analyze              ║')
  console.log('║    健康检查: GET /health               ║')
  console.log('╚════════════════════════════════════════╝')
  console.log('')
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭...')
  server.close(() => {
    console.log('服务已关闭')
    process.exit(0)
  })
})
