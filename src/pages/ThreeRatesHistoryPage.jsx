import { useState, useEffect } from 'react'
import { Card, Select, Table, Empty, message } from 'antd'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getAllGrades, getClassesByGrade, getRecordsByGradeClass } from '../utils/storage'
import {
  calculateClassOwnStandards,
  calculateClassOwnSubjectStandards,
  calculateClassOwnRates,
  calculateClassOwnSubjectRates
} from '../utils/calculator'

const { Option } = Select

function ThreeRatesHistoryPage({ userInfo }) {
  const [grades, setGrades] = useState([])
  const [selectedGrade, setSelectedGrade] = useState(userInfo.role === 'teacher' ? userInfo.grade : null)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(userInfo.role === 'teacher' ? userInfo.class : null)
  const [historyData, setHistoryData] = useState([])
  const [subjectNames, setSubjectNames] = useState([])
  const [subjectHistoryData, setSubjectHistoryData] = useState({})

  useEffect(() => {
    const loadGrades = async () => {
      const allGrades = await getAllGrades()
      
      // 如果是教师，只显示自己的年级
      if (userInfo.role === 'teacher') {
        setGrades([userInfo.grade])
        setSelectedGrade(userInfo.grade)
      } else {
        setGrades(allGrades)
        if (allGrades.length > 0) {
          setSelectedGrade(allGrades[0])
        }
      }
    }
    loadGrades()
  }, [])

  useEffect(() => {
    const loadClasses = async () => {
      if (selectedGrade) {
        // 将中文年级转换为数字
        const gradeMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
        const gradeNumber = typeof selectedGrade === 'string' && gradeMap[selectedGrade] ? gradeMap[selectedGrade] : parseInt(selectedGrade) || selectedGrade
        
        const gradeClasses = await getClassesByGrade(gradeNumber)
        
        // 如果是班级老师，只显示自己的班级
        if (userInfo.role === 'teacher') {
          const myClass = gradeClasses.filter(c => c === userInfo.class)
          setClasses(myClass)
          setSelectedClass(userInfo.class)
        } else {
        setClasses(gradeClasses)
        if (gradeClasses.length > 0) {
          setSelectedClass(gradeClasses[0])
          }
        }
      }
    }
    loadClasses()
  }, [selectedGrade, userInfo])

  useEffect(() => {
    if (selectedGrade && selectedClass) {
      loadThreeRatesHistory(selectedGrade, selectedClass)
    }
  }, [selectedGrade, selectedClass])

  const loadThreeRatesHistory = async (grade, classNum) => {
    // 将中文年级转换为数字
    const gradeMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
    const gradeNumber = typeof grade === 'string' && gradeMap[grade] ? gradeMap[grade] : parseInt(grade) || grade
    
    const records = await getRecordsByGradeClass(gradeNumber, classNum)
    
    if (records.length === 0) {
      message.warning('暂无历史数据')
      setHistoryData([])
      setSubjectNames([])
      setSubjectHistoryData({})
      return
    }

    // 将记录按时间升序排列（因为从数据库获取的是降序）
    const sortedRecords = [...records].reverse()

    // 收集所有学科名称
    const allSubjects = sortedRecords[0]?.subjects || []
    setSubjectNames(allSubjects.map(s => s.name))

    // 构建历史数据
    const history = []
    const subjectHistory = {}

    // 初始化学科历史数据结构
    allSubjects.forEach(subject => {
      subjectHistory[subject.name] = {
        excellentRate: [],
        passRate: [],
        comprehensiveRate: [],
        totalRate: []
      }
    })

    sortedRecords.forEach((record, index) => {
      const classStudents = record.students

      // 计算班级自己的总分三率标准分
      const classOwnStd = calculateClassOwnStandards(classStudents, record.subjects)

      // 计算班级自己的各学科三率标准分
      const classOwnSubjectStd = calculateClassOwnSubjectStandards(classStudents, record.subjects)

      // 计算班级自己的总分三率
      const classOwnRts = calculateClassOwnRates(classStudents, classOwnStd)

      // 计算班级自己的各学科三率
      const classOwnSubjectRts = calculateClassOwnSubjectRates(classStudents, record.subjects, classOwnSubjectStd)

      const dataPoint = {
        time: `第${index + 1}次`,
        timestamp: new Date(record.created_at).toLocaleDateString('zh-CN'),
        evaluateCount: classOwnStd.evaluateCount,
        excellentRate: parseFloat(classOwnRts.excellentRate),
        passRate: parseFloat(classOwnRts.passRate),
        comprehensiveRate: parseFloat(classOwnRts.comprehensiveRate),
        totalRate: parseFloat(classOwnRts.totalRate),
      }

      // 添加各学科三率数据
      allSubjects.forEach(subject => {
        const subjectName = subject.name
        const rates = classOwnSubjectRts[subjectName]
        
        dataPoint[`${subjectName}_excellentRate`] = parseFloat(rates.excellentRate)
        dataPoint[`${subjectName}_passRate`] = parseFloat(rates.passRate)
        dataPoint[`${subjectName}_comprehensiveRate`] = parseFloat(rates.comprehensiveRate)
        dataPoint[`${subjectName}_totalRate`] = parseFloat(rates.totalRate)

        // 收集各学科的历史数据用于单独的图表
        subjectHistory[subjectName].excellentRate.push({
          time: `第${index + 1}次`,
          value: parseFloat(rates.excellentRate)
        })
        subjectHistory[subjectName].passRate.push({
          time: `第${index + 1}次`,
          value: parseFloat(rates.passRate)
        })
        subjectHistory[subjectName].comprehensiveRate.push({
          time: `第${index + 1}次`,
          value: parseFloat(rates.comprehensiveRate)
        })
        subjectHistory[subjectName].totalRate.push({
          time: `第${index + 1}次`,
          value: parseFloat(rates.totalRate)
        })
      })

      history.push(dataPoint)
    })

    setHistoryData(history)
    setSubjectHistoryData(subjectHistory)
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
    },
    {
      title: '优秀率',
      dataIndex: 'excellentRate',
      key: 'excellentRate',
      width: 100,
      render: (val) => <span style={{ color: '#52c41a' }}>{val.toFixed(2)}%</span>,
    },
    {
      title: '及格率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 100,
      render: (val) => <span style={{ color: '#1890ff' }}>{val.toFixed(2)}%</span>,
    },
    {
      title: '综合率',
      dataIndex: 'comprehensiveRate',
      key: 'comprehensiveRate',
      width: 100,
      render: (val) => <span style={{ color: '#faad14' }}>{val.toFixed(2)}%</span>,
    },
    {
      title: '三率之和',
      dataIndex: 'totalRate',
      key: 'totalRate',
      width: 120,
      render: (val) => <strong style={{ color: '#f5222d' }}>{val.toFixed(2)}%</strong>,
    },
  ]

  // 各学科三率的表格列
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
    ...subjectNames.flatMap(subject => [
      {
        title: `${subject}优秀率`,
        dataIndex: `${subject}_excellentRate`,
        key: `${subject}_excellentRate`,
        width: 110,
        render: (val) => val !== undefined ? `${val.toFixed(2)}%` : '-',
      },
      {
        title: `${subject}及格率`,
        dataIndex: `${subject}_passRate`,
        key: `${subject}_passRate`,
        width: 110,
        render: (val) => val !== undefined ? `${val.toFixed(2)}%` : '-',
      },
      {
        title: `${subject}综合率`,
        dataIndex: `${subject}_comprehensiveRate`,
        key: `${subject}_comprehensiveRate`,
        width: 110,
        render: (val) => val !== undefined ? `${val.toFixed(2)}%` : '-',
      },
      {
      title: `${subject}三率之和`,
      dataIndex: `${subject}_totalRate`,
      key: `${subject}_totalRate`,
      width: 120,
        render: (val) => val !== undefined ? <strong>{val.toFixed(2)}%</strong> : '-',
      },
    ]),
  ]

  return (
    <div>
      <Card title="班级三率历史对比" style={{ marginBottom: 24 }}>
        {userInfo.role === 'teacher' && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
            <p style={{ margin: 0, color: '#1890ff' }}>
              <strong>当前登录：</strong>{userInfo.grade}年级{userInfo.class}班老师
              （只能查看本班三率历史）
            </p>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 16 }}>选择年级：</span>
          <Select
            style={{ width: 150, marginRight: 24 }}
            value={selectedGrade}
            onChange={setSelectedGrade}
            placeholder="请选择年级"
            disabled={userInfo.role === 'teacher'}
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
            disabled={userInfo.role === 'teacher'}
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
              <strong>说明：</strong>显示该班级每次考试的三率数据变化趋势（基于本班前95%学生计算）
            </p>
          </div>
        )}
      </Card>

      {historyData.length > 0 ? (
        <>
          {/* 班级总分三率趋势图（包含优秀率、及格率、综合率、三率之和） */}
          <Card title="班级总分三率趋势图" style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={400}>
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
                  stroke="#1890ff" 
                  strokeWidth={2}
                  name="及格率"
                />
                <Line 
                  type="monotone" 
                  dataKey="comprehensiveRate" 
                  stroke="#faad14" 
                  strokeWidth={2}
                  name="综合率"
                />
                <Line 
                  type="monotone" 
                  dataKey="totalRate" 
                  stroke="#f5222d" 
                  strokeWidth={3}
                  name="三率之和"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* 各学科三率趋势图（每个学科一个图表） */}
          {subjectNames.length > 0 && subjectNames.map((subject, index) => (
            <Card key={subject} title={`${subject}三率趋势图`} style={{ marginBottom: 24 }}>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={`${subject}_excellentRate`}
                    stroke="#52c41a"
                    strokeWidth={2}
                    name="优秀率"
                  />
                  <Line
                    type="monotone"
                    dataKey={`${subject}_passRate`}
                    stroke="#1890ff"
                    strokeWidth={2}
                    name="及格率"
                  />
                  <Line
                    type="monotone"
                    dataKey={`${subject}_comprehensiveRate`}
                    stroke="#faad14"
                    strokeWidth={2}
                    name="综合率"
                  />
                      <Line
                        type="monotone"
                        dataKey={`${subject}_totalRate`}
                    stroke="#f5222d"
                    strokeWidth={3}
                    name="三率之和"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          ))}

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

          {/* 各学科三率历史数据明细表 */}
          {subjectNames.length > 0 && (
            <Card title="各学科三率历史数据明细">
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
