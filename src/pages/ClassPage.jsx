import { useState, useEffect, useMemo } from 'react'
import { Card, Select, Table, message, Empty } from 'antd'
import { getAllGrades, getClassesByGrade, getRecordsByGradeClass } from '../utils/storage'
import {
  calculateGradeStandards,
  calculateSubjectStandards,
  calculateClassRates,
  calculateClassSubjectRates,
  calculateClassOwnStandards,
  calculateClassOwnSubjectStandards,
  calculateClassOwnRates,
  calculateClassOwnSubjectRates,
  calculateGradeStandards95,
  calculateSubjectStandards95,
  calculateClassRates95,
  calculateClassSubjectRates95,
  addRankings
} from '../utils/calculator'

const { Option } = Select

function ClassPage({ userInfo }) {
  const [grades, setGrades] = useState([])
  // 如果是班级老师，自动设置年级和班级
  const [selectedGrade, setSelectedGrade] = useState(userInfo.role === 'teacher' ? userInfo.grade : null)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(userInfo.role === 'teacher' ? userInfo.class : null)
  const [classStudents, setClassStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  // 基于年级95%的标准分
  const [gradeStandards95, setGradeStandards95] = useState(null)
  const [subjectStandards95, setSubjectStandards95] = useState(null)
  // 基于本班95%计算的三率（使用年级95%标准分）
  const [classRates95, setClassRates95] = useState(null)
  const [classSubjectRates95, setClassSubjectRates95] = useState([])

  useEffect(() => {
    const loadGrades = async () => {
      const allGrades = await getAllGrades()
      
      // 如果是班级老师，只显示自己的年级
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
          // 管理员显示所有班级
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
      loadClassData(selectedGrade, selectedClass)
    }
  }, [selectedGrade, selectedClass])

  const loadClassData = async (grade, classNum) => {
    // 将中文年级转换为数字
    const gradeMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
    const gradeNumber = typeof grade === 'string' && gradeMap[grade] ? gradeMap[grade] : parseInt(grade) || grade

    // 获取该班级的记录
    const classRecords = await getRecordsByGradeClass(gradeNumber, classNum)
    
    if (classRecords.length === 0) {
      message.warning('该班级暂无数据')
      setClassStudents([])
      return
    }

    const latestRecord = classRecords[0] // 已经按时间降序排列
    setSubjects(latestRecord.subjects)

    // 获取年级所有班级的最新记录（用于计算年级标准分）
    const allGradeRecords = await getRecordsByGradeClass(gradeNumber)
    
    // 只使用最新一次考试的数据：找出每个班级的最新记录
    const latestRecordsByClass = {}
    allGradeRecords.forEach(record => {
      const classKey = record.class
      if (!latestRecordsByClass[classKey] || 
          new Date(record.created_at) > new Date(latestRecordsByClass[classKey].created_at)) {
        latestRecordsByClass[classKey] = record
      }
    })

    // 合并所有班级最新记录的学生数据
    let allStudentsData = []
    Object.values(latestRecordsByClass).forEach(record => {
      allStudentsData = allStudentsData.concat(record.students)
    })

    // 🆕 计算年级标准分（基于年级95%）
    const gradeStd95 = calculateGradeStandards95(allStudentsData, latestRecord.subjects)
    setGradeStandards95(gradeStd95)

    const subjectStd95 = calculateSubjectStandards95(allStudentsData, latestRecord.subjects)
    setSubjectStandards95(subjectStd95)

    // 添加排名
    const rankedStudents = addRankings(allStudentsData)
    const classStudentsData = rankedStudents.filter(s => s.class === classNum)
    setClassStudents(classStudentsData)

    // 🆕 计算班级三率（基于本班95%参评，使用年级95%标准分）
    const classRts95 = calculateClassRates95(classStudentsData, gradeStd95)
    setClassRates95(classRts95)

    // 🆕 计算班级各学科三率（基于本班95%参评，使用年级95%标准分）
    const classSubjectRts95 = calculateClassSubjectRates95(classStudentsData, latestRecord.subjects, subjectStd95)
    setClassSubjectRates95(classSubjectRts95)
  }

  // 动态生成学生成绩表列（包含原始分数和降序）
  // 使用useMemo确保在依赖项变化时重新生成列定义
  const studentColumns = useMemo(() => [
    {
      title: '班级排名',
      dataIndex: 'classRank',
      key: 'classRank',
      width: 100,
      fixed: 'left',
    },
    {
      title: '年级排名',
      dataIndex: 'gradeRank',
      key: 'gradeRank',
      width: 100,
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: '姓名',
      key: '姓名',
      width: 100,
      fixed: 'left',
    },
    // 为每个学科生成两列：原始分数和降序
    ...subjects.flatMap(subject => [
      {
        title: subject.name,
        dataIndex: subject.name,
        key: subject.name,
        width: 80,
        render: (val) => {
          return (
            <span style={{ color: '#000' }}>
              {val}
            </span>
          )
        },
      },
      {
        title: `${subject.name}降序`,
        key: `${subject.name}_desc`,
        width: 100,
        render: (_, record) => {
          // 显示该学科的分数，用红色字体
          const score = parseFloat(record[subject.name]) || 0
          return (
            <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
              {score}
            </span>
          )
        },
        sorter: (a, b) => (parseFloat(b[subject.name]) || 0) - (parseFloat(a[subject.name]) || 0),
        defaultSortOrder: 'ascend', // 默认降序排列
      },
    ]),
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 100,
      render: (val) => {
        return (
          <strong style={{ color: '#000' }}>
            {val.toFixed(2)}
          </strong>
        )
      },
    },
  ], [subjects])

  // 年级总分标准分表格列（基于年级95%）
  const gradeStandardColumns = [
    {
      title: '标准类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '标准分数',
      dataIndex: 'score',
      key: 'score',
      render: (val) => <strong style={{ color: '#1890ff' }}>{val.toFixed(2)}</strong>,
    },
  ]

  // 年级各学科标准分表格列（基于年级95%）
  const gradeSubjectStandardColumns = [
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: '优秀率标准分',
      dataIndex: 'excellentStandard',
      key: 'excellentStandard',
      render: (val) => val.toFixed(2),
    },
    {
      title: '及格率标准分',
      dataIndex: 'passStandard',
      key: 'passStandard',
      render: (val) => val.toFixed(2),
    },
    {
      title: '综合率标准分',
      dataIndex: 'comprehensiveStandard',
      key: 'comprehensiveStandard',
      render: (val) => val.toFixed(2),
    },
  ]

  // 班级总分三率表格列
  const classRateColumns = [
    {
      title: '优秀率',
      dataIndex: 'excellentRate',
      key: 'excellentRate',
      render: (val) => <strong style={{ color: '#52c41a' }}>{val}%</strong>,
    },
    {
      title: '及格率',
      dataIndex: 'passRate',
      key: 'passRate',
      render: (val) => <strong style={{ color: '#1890ff' }}>{val}%</strong>,
    },
    {
      title: '综合率',
      dataIndex: 'comprehensiveRate',
      key: 'comprehensiveRate',
      render: (val) => <strong style={{ color: '#faad14' }}>{val}%</strong>,
    },
    {
      title: '三率之和',
      dataIndex: 'totalRate',
      key: 'totalRate',
      render: (val) => <strong style={{ color: '#f5222d', fontSize: '16px' }}>{val}%</strong>,
    },
  ]

  // 班级各学科三率表格列
  const classSubjectRateColumns = [
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: '优秀率',
      dataIndex: 'excellentRate',
      key: 'excellentRate',
      render: (val) => <strong style={{ color: '#52c41a' }}>{val}%</strong>,
    },
    {
      title: '及格率',
      dataIndex: 'passRate',
      key: 'passRate',
      render: (val) => <strong style={{ color: '#1890ff' }}>{val}%</strong>,
    },
    {
      title: '综合率',
      dataIndex: 'comprehensiveRate',
      key: 'comprehensiveRate',
      render: (val) => <strong style={{ color: '#faad14' }}>{val}%</strong>,
    },
    {
      title: '三率之和',
      dataIndex: 'totalRate',
      key: 'totalRate',
      render: (val) => <strong style={{ color: '#f5222d' }}>{val}%</strong>,
    },
  ]

  // 获取年级标准分数据（基于年级95%）
  const getGradeStandardData = () => {
    if (!gradeStandards95) return []
    return [
      { type: '优秀率标准分（前20%）', score: gradeStandards95.excellentStandard },
      { type: '及格率标准分（总分60%）', score: gradeStandards95.passStandard },
      { type: '综合率标准分（平均分）', score: gradeStandards95.comprehensiveStandard },
    ]
  }

  // 获取年级各学科标准分数据（基于年级95%）
  const getGradeSubjectStandardData = () => {
    if (!subjectStandards95) return []
    return subjects.map(subject => ({
      subject: subject.name,
      ...subjectStandards95[subject.name]
    }))
  }

  // 获取班级总分三率数据
  const getClassRateData = () => {
    if (!classRates95) return []
    return [classRates95]
  }

  // 获取班级各学科三率数据
  const getClassSubjectRateData = () => {
    if (!classSubjectRates95 || classSubjectRates95.length === 0) return []
    return classSubjectRates95
  }

  return (
    <div>
      <Card title="班级数据分析" style={{ marginBottom: 24 }}>
        {userInfo.role === 'teacher' && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
            <p style={{ margin: 0, color: '#1890ff' }}>
              <strong>当前登录：</strong>{userInfo.grade}年级{userInfo.class}班老师
              （只能查看本班数据）
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

        {classStudents.length > 0 && gradeStandards95 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ marginBottom: 8 }}>
              班级总人数：<strong>{classStudents.length}</strong> 人
            </p>
            <p style={{ marginBottom: 8 }}>
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>年级标准参评人数：</span>
              <strong style={{ color: '#1890ff' }}>{gradeStandards95.evaluateCount}</strong> 人
              <span style={{ color: '#999', marginLeft: 8 }}>
                （全年级总分前95%的学生）
              </span>
            </p>
            <p style={{ marginBottom: 0 }}>
              <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>本班参评人数：</span>
              <strong style={{ color: '#1890ff' }}>{classRates95?.evaluateCount || 0}</strong> 人
              <span style={{ color: '#999', marginLeft: 8 }}>
                （本班总分前95%的学生）
              </span>
            </p>
          </div>
        )}
      </Card>

      {classStudents.length > 0 ? (
        <>
          <Card title="本年级总分三率标准分（年级前95%）" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getGradeStandardData()}
              columns={gradeStandardColumns}
              pagination={false}
              rowKey="type"
            />
          </Card>

          <Card title="本年级各学科三率标准分（年级前95%）" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getGradeSubjectStandardData()}
              columns={gradeSubjectStandardColumns}
              pagination={false}
              rowKey="subject"
              scroll={{ x: 'max-content' }}
            />
          </Card>

          <Card title="本班总分三率（基于年级标准分，本班前95%参评）" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getClassRateData()}
              columns={classRateColumns}
              pagination={false}
              rowKey={(record, index) => `class_rate_${index}`}
            />
          </Card>

          <Card title="本班各学科三率（基于年级标准分，本班前95%参评）" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getClassSubjectRateData()}
              columns={classSubjectRateColumns}
              pagination={false}
              rowKey="subject"
              scroll={{ x: 'max-content' }}
            />
          </Card>

          <Card title="班级学生成绩表">
            <Table
              dataSource={classStudents}
              columns={studentColumns}
              rowKey={(record, index) => `${record['姓名']}_${index}`}
              pagination={false}
              scroll={{ x: 'max-content' }}
              bordered
            />
          </Card>
        </>
      ) : (
        <Empty description="暂无数据" />
      )}
    </div>
  )
}

export default ClassPage

