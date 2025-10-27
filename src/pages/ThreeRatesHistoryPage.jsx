import { useState, useEffect } from 'react'
import { Card, Select, Table, Empty, message } from 'antd'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getAllGrades, getClassesByGrade, getRecordsByGradeClass } from '../utils/storage'

const { Option } = Select

function ThreeRatesHistoryPage() {
  const [grades, setGrades] = useState([])
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [subjectNames, setSubjectNames] = useState([])

  useEffect(() => {
    const loadGrades = async () => {
      const allGrades = await getAllGrades()
      setGrades(allGrades)
      if (allGrades.length > 0) {
        setSelectedGrade(allGrades[0])
      }
    }
    loadGrades()
  }, [])

  useEffect(() => {
    const loadClasses = async () => {
      if (selectedGrade) {
        const gradeClasses = await getClassesByGrade(selectedGrade)
        setClasses(gradeClasses)
        if (gradeClasses.length > 0) {
          setSelectedClass(gradeClasses[0])
        }
      }
    }
    loadClasses()
  }, [selectedGrade])

  useEffect(() => {
    if (selectedGrade && selectedClass) {
      loadThreeRatesHistory(selectedGrade, selectedClass)
    }
  }, [selectedGrade, selectedClass])

  const loadThreeRatesHistory = async (grade, classNum) => {
    const records = await getRecordsByGradeClass(grade, classNum)
    
    console.log('📊 获取到的记录数:', records.length)
    console.log('📊 记录详情:', records)
    
    if (records.length === 0) {
      message.warning('暂无历史数据')
      setHistoryData([])
      setSubjectNames([])
      return
    }

    // 过滤出有三率数据的记录
    const validRecords = records.filter(record => record.classRates || record.subjectRates)
    
    console.log('📊 有三率数据的记录数:', validRecords.length)
    console.log('📊 有效记录:', validRecords)
    
    if (validRecords.length === 0) {
      message.warning('暂无三率历史数据。请重新上传成绩以生成三率数据。')
      console.log('⚠️ 记录示例（检查是否有classRates字段）:', records[0])
      setHistoryData([])
      setSubjectNames([])
      return
    }

    // 将记录按时间升序排列
    const sortedRecords = [...validRecords].reverse()

    // 收集所有学科名称
    const allSubjects = new Set()
    sortedRecords.forEach(record => {
      if (record.subjectRates) {
        record.subjectRates.forEach(sr => allSubjects.add(sr.subject))
      }
    })
    setSubjectNames(Array.from(allSubjects))

    // 构建历史数据
    const history = sortedRecords.map((record, index) => {
      const dataPoint = {
        time: `第${index + 1}次`,
        timestamp: new Date(record.created_at).toLocaleDateString('zh-CN'),
        totalRate: record.classRates ? record.classRates.totalRate : null,
        excellentRate: record.classRates ? record.classRates.excellentRate : null,
        passRate: record.classRates ? record.classRates.passRate : null,
        comprehensiveRate: record.classRates ? record.classRates.comprehensiveRate : null,
        evaluateCount: record.classRates ? record.classRates.evaluateCount : null,
      }

      // 添加各学科三率之和
      if (record.subjectRates) {
        record.subjectRates.forEach(sr => {
          dataPoint[`${sr.subject}_totalRate`] = sr.totalRate
        })
      }

      return dataPoint
    })

    setHistoryData(history)
  }

  // 总分三率趋势图的表格列
  const totalRateColumns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 100,
    },
    {
      title: '日期',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 120,
    },
    {
      title: '参评人数',
      dataIndex: 'evaluateCount',
      key: 'evaluateCount',
      width: 100,
      render: (val) => val !== null ? val : '-',
    },
    {
      title: '优秀率',
      dataIndex: 'excellentRate',
      key: 'excellentRate',
      width: 100,
      render: (val) => val !== null ? `${val}%` : '-',
    },
    {
      title: '及格率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 100,
      render: (val) => val !== null ? `${val}%` : '-',
    },
    {
      title: '综合率',
      dataIndex: 'comprehensiveRate',
      key: 'comprehensiveRate',
      width: 100,
      render: (val) => val !== null ? `${val}%` : '-',
    },
    {
      title: '三率之和',
      dataIndex: 'totalRate',
      key: 'totalRate',
      width: 120,
      render: (val) => val !== null ? <strong style={{ color: '#1890ff' }}>{val}%</strong> : '-',
    },
  ]

  // 各学科三率之和的表格列
  const subjectRateColumns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 100,
      fixed: 'left',
    },
    {
      title: '日期',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 120,
      fixed: 'left',
    },
    ...subjectNames.map(subject => ({
      title: `${subject}三率之和`,
      dataIndex: `${subject}_totalRate`,
      key: `${subject}_totalRate`,
      width: 120,
      render: (val) => val !== null ? `${val}%` : '-',
    })),
  ]

  return (
    <div>
      <Card title="班级三率历史对比" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 16 }}>选择年级：</span>
          <Select
            style={{ width: 150, marginRight: 24 }}
            value={selectedGrade}
            onChange={setSelectedGrade}
            placeholder="请选择年级"
          >
            {grades.map(grade => (
              <Option key={grade} value={grade}>
                {grade}年级
              </Option>
            ))}
          </Select>

          <span style={{ marginRight: 16 }}>选择班级：</span>
          <Select
            style={{ width: 150 }}
            value={selectedClass}
            onChange={setSelectedClass}
            placeholder="请选择班级"
          >
            {classes.map(classNum => (
              <Option key={classNum} value={classNum}>
                {classNum}班
              </Option>
            ))}
          </Select>
        </div>

        {historyData.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, background: '#f0f2f5', borderRadius: 4 }}>
            <p style={{ margin: 0, color: '#666' }}>
              <strong>说明：</strong>显示该班级每次上传成绩时计算的三率数据历史记录。
            </p>
          </div>
        )}
      </Card>

      {historyData.length > 0 ? (
        <>
          {/* 班级总分三率之和趋势图 */}
          <Card title="班级总分三率之和趋势图" style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalRate" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  name="三率之和"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* 班级总分三率明细趋势图 */}
          <Card title="班级总分三率明细趋势图" style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="excellentRate" 
                  stroke="#52c41a" 
                  strokeWidth={2}
                  name="优秀率"
                />
                <Line 
                  type="monotone" 
                  dataKey="passRate" 
                  stroke="#faad14" 
                  strokeWidth={2}
                  name="及格率"
                />
                <Line 
                  type="monotone" 
                  dataKey="comprehensiveRate" 
                  stroke="#722ed1" 
                  strokeWidth={2}
                  name="综合率"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* 各学科三率之和趋势图 */}
          {subjectNames.length > 0 && (
            <Card title="各学科三率之和趋势图" style={{ marginBottom: 24 }}>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {subjectNames.map((subject, index) => {
                    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a28ed1', '#f5a623']
                    return (
                      <Line
                        key={subject}
                        type="monotone"
                        dataKey={`${subject}_totalRate`}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        name={`${subject}三率之和`}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* 班级总分三率历史数据明细表 */}
          <Card title="班级总分三率历史数据明细" style={{ marginBottom: 24 }}>
            <Table
              dataSource={historyData}
              columns={totalRateColumns}
              rowKey="time"
              pagination={false}
              scroll={{ x: 'max-content' }}
              bordered
            />
          </Card>

          {/* 各学科三率之和历史数据明细表 */}
          {subjectNames.length > 0 && (
            <Card title="各学科三率之和历史数据明细">
              <Table
                dataSource={historyData}
                columns={subjectRateColumns}
                rowKey="time"
                pagination={false}
                scroll={{ x: 'max-content' }}
                bordered
              />
            </Card>
          )}
        </>
      ) : (
        <Empty description="暂无历史数据" />
      )}
    </div>
  )
}

export default ThreeRatesHistoryPage

