import { useState, useEffect } from 'react'
import { Card, Select, DatePicker, Table, message, Spin, Empty, Space } from 'antd'
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

  return (
    <div>
      <Card title="成绩总览" style={{ marginBottom: 24 }}>
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
          </div>
        )}
      </Card>
    </div>
  )
}

export default OverviewPage
