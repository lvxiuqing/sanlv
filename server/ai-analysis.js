import { default as OpenAI } from 'openai'

/**
 * 调用 DeepSeek API 进行 AI 分析
 * @param {Object} analysisData - 包含三率和标准差数据的分析对象
 * @param {string} apiKey - 阿里云百炼 API Key
 * @returns {Promise<AsyncIterable>} 流式响应迭代器
 */
export async function analyzeWithAI(analysisData, apiKey) {
  // 构建 Prompt
  const prompt = buildPrompt(analysisData)

  // 使用 OpenAI SDK 调用阿里云百炼 DeepSeek API
  const openai = new OpenAI({
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: apiKey
  })

  const stream = await openai.chat.completions.create({
    model: 'deepseek-v3.2-exp',
    messages: [
      {
        role: 'system',
        content: '你是一个资深的教务分析专家，请根据传入的班级成绩数据，分析教学质量，指出两极分化严重的学科，并给出教学建议。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    stream: true,
    enable_thinking: false,
    stream_options: {
      include_usage: true
    },
    temperature: 0.7,
    max_tokens: 2000
  })

  return stream
}

/**
 * 构建分析 Prompt
 * @param {Object} analysisData - 分析数据
 * @returns {string} Prompt 文本
 */
function buildPrompt(analysisData) {
  const { grade, date, subjects, classData, dispersalData } = analysisData

  let prompt = `请分析以下${grade}年级在${date}的成绩数据：\n\n`

  // 添加三率数据
  prompt += '【各班级各科目三率数据】\n'
  subjects.forEach(subject => {
    prompt += `\n${subject}:\n`
    classData[subject]?.forEach(row => {
      prompt += `  ${row.class}班: 优秀率${(row.excellentRate * 100).toFixed(1)}%, 综合率${(row.comprehensiveRate * 100).toFixed(1)}%, 及格率${(row.passRate * 100).toFixed(1)}%, 排名${row.rank}\n`
    })
  })

  // 添加标准差数据
  prompt += '\n【各班级各科目成绩标准差（两极分化指标）】\n'
  prompt += '（标准差越大表示班级成绩分布越分散，两极分化越严重）\n'
  subjects.forEach(subject => {
    prompt += `\n${subject}:\n`
    Object.entries(dispersalData[subject] || {}).forEach(([classNum, stdDev]) => {
      prompt += `  ${classNum}班: 标准差 ${stdDev}\n`
    })
  })

  prompt += '\n请基于以上数据进行分析，重点关注：\n'
  prompt += '1. 哪些班级的成绩整体较好，哪些班级需要改进\n'
  prompt += '2. 哪些科目存在明显的两极分化现象（标准差大）\n'
  prompt += '3. 针对问题班级和科目提出具体的教学改进建议\n'

  return prompt
}
