import { useState, useEffect } from 'react'
import { Card, Select, DatePicker, Table, message, Spin, Empty, Space, Button, Modal } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getRecordsByGradeClass, getAllGrades } from '../utils/storage'
import { addRankings, calculateSubjectStandards95, calculateClassSubjectRates95 } from '../utils/calculator'

function OverviewPage({ userInfo }) {
  const [grades, setGrades] = useState([])
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState({}) // { subject: [...rows] }
  const [subjects, setSubjects] = useState([])
  const [displayDate, setDisplayDate] = useState('')
  const [dispersalData, setDispersalData] = useState({}) // { subject: { class: range } }
  const [aiAnalysisVisible, setAiAnalysisVisible] = useState(false)
  const [aiAnalysisText, setAiAnalysisText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // 只有管理员可以访问成绩总览页面
  if (userInfo.role === 'teacher') {
    return (
      <div>
        <Card title="成绩总览" style={{ marginBottom: 24 }}>
          <div style={{ padding: 40, textAlign: 'center', background: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
            <p style={{ fontSize: 16, color: '#d46b08', marginBottom: 16 }}>
              <strong>⚠️ 权限提示</strong>
            </p>
            <p style={{ color: '#d46b08' }}>
              教师账号无法访问此页面
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // 初始化年级列表（仅管理员）
  useEffect(() => {
    const loadGrades = async () => {
      const allGrades = await getAllGrades()
      setGrades(allGrades)
      if (allGrades.length > 0) {
        setSelectedGrade(allGrades[0])
      }
    }
    loadGrades()
  }, [userInfo])

  // 加载数据
  useEffect(() => {
    if (selectedGrade) {
      loadOverviewData(selectedGrade)
    }
  }, [selectedGrade, selectedDate])

  const loadOverviewData = async (grade) => {
    setLoading(true)
    try {
      const gradeMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
      const gradeNumber = typeof grade === 'string' && gradeMap[grade] ? gradeMap[grade] : parseInt(grade) || grade

      // 获取该年级所有班级的记录
      const allRecords = await getRecordsByGradeClass(gradeNumber)

      if (allRecords.length === 0) {
        message.warning('该年级暂无数据')
        setTableData({})
        setSubjects([])
        setLoading(false)
        return
      }

      // 按日期筛选记录
      let filteredRecords = allRecords
      if (selectedDate) {
        const selectedDateStr = selectedDate.format('YYYY-MM-DD')
        filteredRecords = allRecords.filter(record => {
          const recordDate = new Date(record.created_at).toISOString().split('T')[0]
          return recordDate === selectedDateStr
        })
      } else {
        // 如果没有选择日期，使用最新的一次考试数据
        const latestRecordsByClass = {}
        allRecords.forEach(record => {
          const classKey = record.class
          if (!latestRecordsByClass[classKey] || 
              new Date(record.created_at) > new Date(latestRecordsByClass[classKey].created_at)) {
            latestRecordsByClass[classKey] = record
          }
        })
        filteredRecords = Object.values(latestRecordsByClass)
      }

      if (filteredRecords.length === 0) {
        message.warning('该日期暂无数据')
        setTableData({})
        setSubjects([])
        setLoading(false)
        return
      }

      // 确定展示日期
      if (selectedDate) {
        setDisplayDate(selectedDate.format('YYYY.MM.DD'))
      } else {
        const latestRecord = filteredRecords.reduce((latest, record) => {
          return !latest || new Date(record.created_at) > new Date(latest.created_at) ? record : latest
        }, null)
        setDisplayDate(latestRecord ? dayjs(latestRecord.created_at).format('YYYY.MM.DD') : '')
      }

      // 获取学科列表
      const subjectList = filteredRecords[0].subjects || []
      setSubjects(subjectList)

      // 整理全年级学生数据
      const allStudents = filteredRecords.reduce((acc, record) => {
        const students = (record.students || []).map(student => ({
          ...student,
          grade: record.grade,
          class: record.class
        }))
        return acc.concat(students)
      }, [])

      if (allStudents.length === 0) {
        setTableData({})
        setSubjects([])
        setLoading(false)
        return
      }

      const rankedStudents = addRankings(allStudents)
      const subjectStandards95 = calculateSubjectStandards95(rankedStudents, subjectList)
      const classNumbers = [...new Set(filteredRecords.map(record => record.class))].sort((a, b) => a - b)

      // 构建表格数据
      const tableDataBySubject = {}

      subjectList.forEach(subject => {
        const rows = classNumbers.map(classNum => {
          const classStudents = rankedStudents.filter(student => student.class === classNum)
          if (classStudents.length === 0) {
            return {
              class: classNum,
              excellentRate: 0,
              comprehensiveRate: 0,
              passRate: 0,
              totalRate: 0,
              rank: '-'
            }
          }

          const rates = calculateClassSubjectRates95(classStudents, [subject], subjectStandards95)
          const rateData = rates[0] // 返回数组，取第一个元素
          const excellent = parseFloat(rateData.excellentRate) || 0
          const comprehensive = parseFloat(rateData.comprehensiveRate) || 0
          const pass = parseFloat(rateData.passRate) || 0
          const total = parseFloat(rateData.totalRate) || (excellent + comprehensive + pass)

          return {
            class: classNum,
            excellentRate: excellent,
            comprehensiveRate: comprehensive,
            passRate: pass,
            totalRate: total
          }
        })

        // 排名
        rows.sort((a, b) => b.totalRate - a.totalRate)
        let currentRank = 1
        rows.forEach((row, index) => {
          if (index > 0 && row.totalRate < rows[index - 1].totalRate) {
            currentRank = index + 1
          }
          row.rank = row.totalRate === 0 ? '-' : currentRank
        })

        tableDataBySubject[subject.name] = rows
      })

      setTableData(tableDataBySubject)

      // 计算离散度（标准差）
      const dispersalBySubject = {}
      subjectList.forEach(subject => {
        dispersalBySubject[subject.name] = {}
        classNumbers.forEach(classNum => {
          const classStudents = rankedStudents.filter(student => student.class === classNum)
          if (classStudents.length === 0) {
            dispersalBySubject[subject.name][classNum] = 0
            return
          }

          // 按班级学科总分排序，取前95%的学生
          const evaluateCount = Math.floor(classStudents.length * 0.95)
          const evaluateStudents = classStudents
            .sort((a, b) => (parseFloat(b.totalScore) || 0) - (parseFloat(a.totalScore) || 0))
            .slice(0, evaluateCount)

          if (evaluateStudents.length === 0) {
            dispersalBySubject[subject.name][classNum] = 0
            return
          }

          // 计算标准差
          const scores = evaluateStudents.map(s => parseFloat(s[subject.name]) || 0)
          const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
          const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
          const stdDev = Math.sqrt(variance)

          dispersalBySubject[subject.name][classNum] = parseFloat(stdDev.toFixed(2))
        })
      })
      setDispersalData(dispersalBySubject)
    } catch (error) {
      console.error('加载成绩总览数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 生成表格列
  const getColumns = () => {
    return [
      {
        title: '班级',
        dataIndex: 'class',
        key: 'class',
        width: 80,
        render: (text) => `${text}班`,
      },
      {
        title: '优秀率',
        dataIndex: 'excellentRate',
        key: 'excellentRate',
        width: 100,
        render: (val) => `${Number(val || 0).toFixed(2)}%`,
      },
      {
        title: '综合率',
        dataIndex: 'comprehensiveRate',
        key: 'comprehensiveRate',
        width: 100,
        render: (val) => `${Number(val || 0).toFixed(2)}%`,
      },
      {
        title: '及格率',
        dataIndex: 'passRate',
        key: 'passRate',
        width: 100,
        render: (val) => `${Number(val || 0).toFixed(2)}%`,
      },
      {
        title: '总分',
        dataIndex: 'totalRate',
        key: 'totalRate',
        width: 100,
        render: (val) => `${Number(val || 0).toFixed(2)}%`,
      },
      {
        title: '名次',
        dataIndex: 'rank',
        key: 'rank',
        width: 80,
        render: (val) => val,
      },
    ]
  }

  // 计算热力图颜色（红绿渐变）
  const getHeatmapColor = (value, maxValue) => {
    if (value === 0 || maxValue === 0) return '#ffffff'
    
    const ratio = value / maxValue
    // 绿色 (0) -> 黄色 (0.5) -> 红色 (1)
    if (ratio < 0.5) {
      // 绿到黄
      const r = Math.floor(255 * (ratio * 2))
      const g = 255
      const b = 0
      return `rgb(${r}, ${g}, ${b})`
    } else {
      // 黄到红
      const r = 255
      const g = Math.floor(255 * (2 - ratio * 2))
      const b = 0
      return `rgb(${r}, ${g}, ${b})`
    }
  }

  // 生成离散度热力图表格
  const getDispersalTable = () => {
    if (!subjects.length || Object.keys(dispersalData).length === 0) {
      return null
    }

    const classNumbers = Object.keys(dispersalData[subjects[0].name] || {})
      .map(Number)
      .sort((a, b) => a - b)

    // 找出最大标准差值用于颜色映射
    let maxStdDev = 0
    subjects.forEach(subject => {
      Object.values(dispersalData[subject.name] || {}).forEach(value => {
        if (value > maxStdDev) maxStdDev = value
      })
    })

    return (
      <div style={{ overflowX: 'auto', marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 'bold' }}>
          📊 成绩离散度分析（标准差）
          {displayDate && `（${displayDate}）`}
        </h3>
        <p style={{ marginBottom: 16, color: '#666', fontSize: 12 }}>
          说明：标准差越大代表班级成绩两极分化越严重。绿色表示分化程度低，红色表示分化程度高。
        </p>
        <table style={{ 
          borderCollapse: 'collapse', 
          width: '100%',
          border: '1px solid #d9d9d9'
        }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'center', 
                borderRight: '1px solid #d9d9d9',
                fontWeight: 'bold',
                minWidth: 100
              }}>
                科目
              </th>
              {classNumbers.map(classNum => (
                <th key={classNum} style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  borderRight: '1px solid #d9d9d9',
                  fontWeight: 'bold',
                  minWidth: 80
                }}>
                  {classNum}班
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.map(subject => (
              <tr key={subject.name}>
                <td style={{ 
                  padding: '12px 16px', 
                  borderRight: '1px solid #d9d9d9',
                  borderBottom: '1px solid #d9d9d9',
                  fontWeight: 'bold',
                  background: '#fafafa'
                }}>
                  {subject.name}
                </td>
                {classNumbers.map(classNum => {
                  const value = dispersalData[subject.name]?.[classNum] || 0
                  const bgColor = getHeatmapColor(value, maxStdDev)
                  return (
                    <td key={`${subject.name}-${classNum}`} style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      borderRight: '1px solid #d9d9d9',
                      borderBottom: '1px solid #d9d9d9',
                      background: bgColor,
                      fontWeight: 'bold',
                      color: value > maxStdDev * 0.6 ? '#fff' : '#000'
                    }}>
                      {value.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // 获取可选的日期列表
  const getAvailableDates = async () => {
    try {
      const gradeMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
      const gradeNumber = typeof selectedGrade === 'string' && gradeMap[selectedGrade] ? gradeMap[selectedGrade] : parseInt(selectedGrade) || selectedGrade
      
      const allRecords = await getRecordsByGradeClass(gradeNumber)
      const dates = new Set()
      
      allRecords.forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0]
        dates.add(date)
      })
      
      return Array.from(dates).sort().reverse()
    } catch (error) {
      console.error('获取可用日期失败:', error)
      return []
    }
  }

  // AI 分析函数
  const handleAIAnalysis = async () => {
    if (!selectedGrade || Object.keys(tableData).length === 0) {
      message.warning('请先选择年级并加载数据')
      return
    }

    setAiLoading(true)
    setAiAnalysisText('')
    setAiAnalysisVisible(true)

    try {
      // 准备分析数据
      const analysisData = {
        grade: selectedGrade,
        date: displayDate || new Date().toISOString().split('T')[0],
        subjects: subjects.map(s => s.name),
        classData: tableData,
        dispersalData: dispersalData
      }

      // 调用后端 API（使用相对路径，Vite 会自动代理到后端）
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ analysisData })
      })

      if (!response.ok) {
        throw new Error('API 请求失败')
      }

      // 处理流式响应
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // 保留最后一行（可能不完整）
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const json = JSON.parse(data)
              const { content, type } = json
              
              // 只显示回复内容，思考过程在后端处理
              if (content && type === 'answer') {
                // 打字机效果：逐字输出
                setAiAnalysisText(prev => prev + content)
              }
            } catch (e) {
              // 忽略 JSON 解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('AI 分析错误:', error)
      message.error(`AI 分析失败: ${error.message}`)
      setAiAnalysisVisible(false)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      <Card 
        title="成绩总览" 
        style={{ marginBottom: 24 }}
        extra={
          <Button 
            type="primary" 
            icon={<RobotOutlined />}
            onClick={handleAIAnalysis}
            loading={aiLoading}
            disabled={Object.keys(tableData).length === 0}
          >
            生成AI智能分析报告
          </Button>
        }
      >
        <Space style={{ marginBottom: 24 }}>
          <span>选择年级：</span>
          <Select
            style={{ width: 120 }}
            value={selectedGrade}
            onChange={setSelectedGrade}
            options={grades.map(g => ({ label: `${g}年级`, value: g }))}
          />

          <span>选择日期：</span>
          <DatePicker
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date)
            }}
            placeholder="选择日期查看历史数据"
            style={{ width: 150 }}
          />
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : Object.keys(tableData).length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <div>
            {subjects.map(subject => (
              <div key={subject.name} style={{ marginBottom: 32 }}>
                <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 'bold' }}>
                  {subject.name}
                  {displayDate && `（${displayDate}）`}
                </h3>
                <Table
                  columns={getColumns()}
                  dataSource={tableData[subject.name] || []}
                  rowKey={(record) => `${subject.name}-${record.class}`}
                  pagination={false}
                  bordered
                  size="middle"
                />
              </div>
            ))}
            
            {/* 离散度分析热力图 */}
            <Card style={{ marginTop: 32, background: '#fafafa' }}>
              {getDispersalTable()}
            </Card>
          </div>
        )}
      </Card>

      {/* AI 分析结果弹窗 */}
      <Modal
        title={
          <span>
            <RobotOutlined style={{ marginRight: 8 }} />
            AI 智能分析报告
          </span>
        }
        open={aiAnalysisVisible}
        onCancel={() => setAiAnalysisVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setAiAnalysisVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="copy" 
            type="primary"
            onClick={() => {
              navigator.clipboard.writeText(aiAnalysisText)
              message.success('已复制到剪贴板')
            }}
          >
            复制文本
          </Button>
        ]}
      >
        <div style={{
          maxHeight: '600px',
          overflowY: 'auto',
          padding: '16px',
          background: '#f5f5f5',
          borderRadius: '4px',
          lineHeight: '1.8',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {aiLoading && !aiAnalysisText && (
            <div style={{ textAlign: 'center', color: '#999' }}>
              <Spin size="large" />
              <p style={{ marginTop: 16 }}>AI 正在分析中...</p>
            </div>
          )}
          {aiAnalysisText || (aiLoading ? '' : '暂无分析内容')}
          {aiLoading && <span style={{ animation: 'blink 1s infinite' }}>▌</span>}
        </div>
      </Modal>
    </div>
  )
}

export default OverviewPage
