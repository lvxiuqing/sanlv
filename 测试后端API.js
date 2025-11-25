/**
 * 后端 API 测试脚本
 * 用于测试 /api/analyze 接口是否正常工作
 */

const API_URL = 'http://localhost:3001'

// 测试数据
const testData = {
  analysisData: {
    grade: '五',
    date: '2024-11-23',
    subjects: ['语文', '数学'],
    classData: {
      '语文': [
        {
          class: 1,
          excellentRate: 0.65,
          comprehensiveRate: 0.85,
          passRate: 0.95,
          totalRate: 2.45,
          rank: 1
        },
        {
          class: 2,
          excellentRate: 0.58,
          comprehensiveRate: 0.82,
          passRate: 0.92,
          totalRate: 2.32,
          rank: 2
        }
      ],
      '数学': [
        {
          class: 1,
          excellentRate: 0.72,
          comprehensiveRate: 0.88,
          passRate: 0.98,
          totalRate: 2.58,
          rank: 1
        },
        {
          class: 2,
          excellentRate: 0.65,
          comprehensiveRate: 0.85,
          passRate: 0.95,
          totalRate: 2.45,
          rank: 2
        }
      ]
    },
    dispersalData: {
      '语文': {
        '1': 25.5,
        '2': 28.3
      },
      '数学': {
        '1': 22.0,
        '2': 26.5
      }
    }
  }
}

async function testAPI() {
  console.log('🧪 开始测试后端 API...\n')

  // 测试1：健康检查
  console.log('【测试1】健康检查')
  try {
    const healthRes = await fetch(`${API_URL}/health`)
    if (healthRes.ok) {
      const data = await healthRes.json()
      console.log('✅ 后端服务正常运行')
      console.log(`   状态: ${data.status}`)
      console.log(`   时间: ${data.timestamp}\n`)
    } else {
      console.log(`❌ 健康检查失败: ${healthRes.status}`)
      return
    }
  } catch (error) {
    console.log(`❌ 无法连接到后端服务: ${error.message}`)
    console.log('   请确保后端服务正在运行: npm run dev:server\n')
    return
  }

  // 测试2：API Key 检查
  console.log('【测试2】API Key 配置检查')
  if (!process.env.DEEPSEEK_API_KEY) {
    console.log('⚠️  未检测到 DEEPSEEK_API_KEY 环境变量')
    console.log('   请配置 .env.local 文件\n')
  } else {
    console.log('✅ DEEPSEEK_API_KEY 已配置\n')
  }

  // 测试3：AI 分析接口
  console.log('【测试3】AI 分析接口')
  console.log('发送请求到 /api/analyze...\n')

  try {
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    if (!response.ok) {
      console.log(`❌ API 返回错误: ${response.status} ${response.statusText}`)
      const error = await response.json()
      console.log(`   错误信息: ${error.error}\n`)
      return
    }

    console.log('✅ API 连接成功，开始接收流式数据...\n')

    // 处理流式响应
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let chunkCount = 0

    console.log('【AI 分析结果】\n')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')

      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            console.log('\n\n✅ 分析完成！')
            break
          }

          try {
            const json = JSON.parse(data)
            const content = json.content
            if (content) {
              process.stdout.write(content)
              chunkCount++
            }
          } catch (e) {
            // 忽略 JSON 解析错误
          }
        }
      }
    }

    console.log(`\n\n📊 收到 ${chunkCount} 个数据块\n`)
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}\n`)
  }

  console.log('🎉 测试完成！')
}

// 运行测试
testAPI().catch(console.error)
