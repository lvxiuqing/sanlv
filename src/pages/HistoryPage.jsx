import { useState, useEffect } from 'react'
import { Card, Select, Table, Empty, message } from 'antd'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getAllGrades, getClassesByGrade, getRecordsByGradeClass } from '../utils/storage'

const { Option } = Select

function HistoryPage({ userInfo }) {
  const [grades, setGrades] = useState([])
  const [selectedGrade, setSelectedGrade] = useState(userInfo.role === 'teacher' ? userInfo.grade : null)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(userInfo.role === 'teacher' ? userInfo.class : null)
  const [studentName, setStudentName] = useState(null)
  const [students, setStudents] = useState([])
  const [historyData, setHistoryData] = useState([])
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
      loadStudents(selectedGrade, selectedClass)
    }
  }, [selectedGrade, selectedClass])

  useEffect(() => {
    if (studentName) {
      loadStudentHistory(selectedGrade, selectedClass, studentName)
    }
  }, [studentName, selectedGrade, selectedClass])

  const loadStudents = async (grade, classNum) => {
    // 将中文年级转换为数字
    const gradeMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
    const gradeNumber = typeof grade === 'string' && gradeMap[grade] ? gradeMap[grade] : parseInt(grade) || grade

    const records = await getRecordsByGradeClass(gradeNumber, classNum)
    
    if (records.length === 0) {
      setStudents([])
      return
    }

    // 获取所有不重复的学生姓名
    const studentNames = new Set()
    records.forEach(record => {
      record.students.forEach(student => {
        studentNames.add(student['姓名'])
      })
    })

    setStudents(Array.from(studentNames))
    
    if (studentNames.size > 0) {
      setStudentName(Array.from(studentNames)[0])
    }
  }

  const loadStudentHistory = async (grade, classNum, name) => {
    // 将中文年级转换为数字
    const gradeMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
    const gradeNumber = typeof grade === 'string' && gradeMap[grade] ? gradeMap[grade] : parseInt(grade) || grade

    const records = await getRecordsByGradeClass(gradeNumber, classNum)
    
    if (records.length === 0) {
      message.warning('暂无历史数据')
      setHistoryData([])
      return
    }

    // 收集该学生的历史成绩
    const history = []
    const subjectHistory = {}

    // 将记录按时间升序排列（因为从数据库获取的是降序）
    const sortedRecords = [...records].reverse()

    sortedRecords.forEach((record, index) => {
      const student = record.students.find(s => s['姓名'] === name)
      
      if (student) {
        const dataPoint = {
          time: `第${index + 1}次`,
          timestamp: new Date(record.created_at).toLocaleDateString(),
          totalScore: student.totalScore
        }

        // 收集各学科成绩
        record.subjects.forEach(subject => {
          const score = parseFloat(student[subject.name]) || 0
          dataPoint[subject.name] = score

          if (!subjectHistory[subject.name]) {
            subjectHistory[subject.name] = []
          }
          subjectHistory[subject.name].push({
            time: `第${index + 1}次`,
            timestamp: new Date(record.created_at).toLocaleDateString(),
            score: score
          })
        })

        history.push(dataPoint)
      }
    })

    setHistoryData(history)
    setSubjectHistoryData(subjectHistory)
  }

  const tableColumns = historyData.length > 0 ? [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '日期',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      render: (val) => <strong>{val.toFixed(2)}</strong>,
    },
    ...Object.keys(subjectHistoryData).map(subject => ({
      title: subject,
      dataIndex: subject,
      key: subject,
      render: (val) => val?.toFixed(2) || '-',
    }))
  ] : []

  return (
    <div>
      <Card title="学生成绩历史对比" style={{ marginBottom: 24 }}>
        {userInfo.role === 'teacher' && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
            <p style={{ margin: 0, color: '#1890ff' }}>
              <strong>当前登录：</strong>{userInfo.grade}年级{userInfo.class}班老师
              （只能查看本班学生）
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
            style={{ width: 150, marginRight: 24 }}
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

          <span style={{ marginRight: 16 }}>选择学生：</span>
          <Select
            style={{ width: 150 }}
            value={studentName}
            onChange={setStudentName}
            placeholder="请选择学生"
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {students.map(name => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>
        </div>
      </Card>

      {historyData.length > 0 ? (
        <>
          <Card title="总分趋势图" style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalScore" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="总分"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="各学科成绩趋势图" style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(subjectHistoryData).map((subject, index) => {
                  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a28ed1', '#f5a623']
                  return (
                    <Line
                      key={subject}
                      type="monotone"
                      dataKey={subject}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      name={subject}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="历史成绩明细">
            <Table
              dataSource={historyData}
              columns={tableColumns}
              rowKey="time"
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </>
      ) : (
        <Empty description="暂无历史数据" />
      )}
    </div>
  )
}

export default HistoryPage

