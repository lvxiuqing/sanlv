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
  addRankings
} from '../utils/calculator'

const { Option } = Select

function ClassPage() {
  const [grades, setGrades] = useState([])
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [classStudents, setClassStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [gradeStandards, setGradeStandards] = useState(null)
  const [subjectStandards, setSubjectStandards] = useState(null)
  const [classRates, setClassRates] = useState(null)
  const [classSubjectRates, setClassSubjectRates] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [totalEvaluateStudents, setTotalEvaluateStudents] = useState([])
  const [subjectEvaluateStudents, setSubjectEvaluateStudents] = useState({})
  const [classOwnStandards, setClassOwnStandards] = useState(null)
  const [classOwnSubjectStandards, setClassOwnSubjectStandards] = useState(null)
  const [classOwnRates, setClassOwnRates] = useState(null)
  const [classOwnSubjectRates, setClassOwnSubjectRates] = useState(null)

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
      loadClassData(selectedGrade, selectedClass)
    }
  }, [selectedGrade, selectedClass])

  const loadClassData = async (grade, classNum) => {
    // 获取该班级的记录
    const classRecords = await getRecordsByGradeClass(grade, classNum)
    
    if (classRecords.length === 0) {
      message.warning('该班级暂无数据')
      setClassStudents([])
      return
    }

    const latestRecord = classRecords[0] // 已经按时间降序排列
    setSubjects(latestRecord.subjects)

    // 获取年级所有班级的最新记录（用于计算标准分）
    const allGradeRecords = await getRecordsByGradeClass(grade)
    
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

    // 计算年级标准分
    const standards = calculateGradeStandards(allStudentsData, latestRecord.subjects)
    setGradeStandards(standards)

    const subjectStd = calculateSubjectStandards(allStudentsData, latestRecord.subjects)
    setSubjectStandards(subjectStd)

    // 添加排名
    const rankedStudents = addRankings(allStudentsData)
    setAllStudents(rankedStudents) // 保存全年级学生数据
    
    const classStudentsData = rankedStudents.filter(s => s.class === classNum)
    setClassStudents(classStudentsData)

    // 计算班级总分三率（使用新的修正版本）
    const rates = calculateClassRates(classStudentsData, standards, rankedStudents)
    setClassRates(rates)
    setTotalEvaluateStudents(rates.evaluateStudents) // 保存总分参评学生名单

    // 计算班级各学科三率（使用新的修正版本）
    const subjectEvaluateMap = {}
    const subjectRates = latestRecord.subjects.map(subject => {
      const rates = calculateClassSubjectRates(classStudentsData, subject.name, subjectStd, rankedStudents)
      subjectEvaluateMap[subject.name] = rates.evaluateStudents // 保存各学科参评学生名单
      return {
        subject: subject.name,
        ...rates,
        evaluateCount: rates.evaluateCount
      }
    })
    setClassSubjectRates(subjectRates)
    setSubjectEvaluateStudents(subjectEvaluateMap)

    // 计算班级自己的总分三率标准分
    const classOwnStd = calculateClassOwnStandards(classStudentsData, latestRecord.subjects)
    setClassOwnStandards(classOwnStd)

    // 计算班级自己的各学科三率标准分
    const classOwnSubjectStd = calculateClassOwnSubjectStandards(classStudentsData, latestRecord.subjects)
    setClassOwnSubjectStandards(classOwnSubjectStd)

    // 计算班级自己的总分三率
    const classOwnRts = calculateClassOwnRates(classStudentsData, classOwnStd)
    setClassOwnRates(classOwnRts)

    // 计算班级自己的各学科三率
    const classOwnSubjectRts = calculateClassOwnSubjectRates(classStudentsData, latestRecord.subjects, classOwnSubjectStd)
    setClassOwnSubjectRates(classOwnSubjectRts)
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
  ], [subjects, subjectEvaluateStudents, totalEvaluateStudents, allStudents])

  const classRateColumns = [
    {
      title: '指标',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      render: (val) => <strong style={{ color: '#52c41a' }}>{val}%</strong>,
    },
  ]

  const subjectRateColumns = [
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
    },
    {
      title: '参评人数',
      dataIndex: 'evaluateCount',
      key: 'evaluateCount',
      width: 100,
      render: (val) => <strong>{val}</strong>,
    },
    {
      title: '优秀率',
      dataIndex: 'excellentRate',
      key: 'excellentRate',
      width: 100,
      render: (val) => `${val}%`,
    },
    {
      title: '及格率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 100,
      render: (val) => `${val}%`,
    },
    {
      title: '综合率',
      dataIndex: 'comprehensiveRate',
      key: 'comprehensiveRate',
      width: 100,
      render: (val) => `${val}%`,
    },
    {
      title: '三率之和',
      dataIndex: 'totalRate',
      key: 'totalRate',
      width: 120,
      render: (val) => <strong style={{ color: '#1890ff' }}>{val}%</strong>,
    },
  ]

  const classOwnStandardColumns = [
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

  const classOwnSubjectStandardColumns = [
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

  const classOwnRateColumns = [
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

  const classOwnSubjectRateColumns = [
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

  const getClassRateData = () => {
    if (!classRates) return []
    return [
      { type: '优秀率', value: classRates.excellentRate },
      { type: '及格率', value: classRates.passRate },
      { type: '综合率', value: classRates.comprehensiveRate },
      { type: '三率之和', value: classRates.totalRate },
    ]
  }

  const getClassOwnStandardData = () => {
    if (!classOwnStandards) return []
    return [
      { type: '优秀率计数标准分（前20%）', score: classOwnStandards.excellentStandard },
      { type: '及格率计数标准分（总分60%）', score: classOwnStandards.passStandard },
      { type: '综合率计数标准分（平均分）', score: classOwnStandards.comprehensiveStandard },
    ]
  }

  const getClassOwnSubjectStandardData = () => {
    if (!classOwnSubjectStandards) return []
    return subjects.map(subject => ({
      subject: subject.name,
      ...classOwnSubjectStandards[subject.name]
    }))
  }

  const getClassOwnRateData = () => {
    if (!classOwnRates) return []
    return [classOwnRates]
  }

  const getClassOwnSubjectRateData = () => {
    if (!classOwnSubjectRates) return []
    return subjects.map(subject => ({
      subject: subject.name,
      ...classOwnSubjectRates[subject.name]
    }))
  }

  return (
    <div>
      <Card title="班级数据分析" style={{ marginBottom: 24 }}>
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

        {classStudents.length > 0 && classOwnStandards && (
          <div style={{ marginTop: 16 }}>
            <p style={{ marginBottom: 8 }}>
              班级总人数：<strong>{classStudents.length}</strong> 人
            </p>
            <p style={{ marginBottom: 0 }}>
              班级标准参评人数：<strong style={{ color: '#1890ff' }}>{classOwnStandards.evaluateCount}</strong> 人
              <span style={{ color: '#999', marginLeft: 8 }}>
                （本班总分前95%的学生）
              </span>
            </p>
          </div>
        )}
      </Card>

      {classStudents.length > 0 ? (
        <>
          <Card title="本班总分三率标准分（本班前95%）" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getClassOwnStandardData()}
              columns={classOwnStandardColumns}
              pagination={false}
              rowKey="type"
            />
          </Card>

          <Card title="本班各学科三率标准分（本班前95%）" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getClassOwnSubjectStandardData()}
              columns={classOwnSubjectStandardColumns}
              pagination={false}
              rowKey="subject"
              scroll={{ x: 'max-content' }}
            />
          </Card>

          <Card title="本班总分三率（基于本班标准分）" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getClassOwnRateData()}
              columns={classOwnRateColumns}
              pagination={false}
              rowKey={(record, index) => `class_own_rate_${index}`}
            />
          </Card>

          <Card title="本班各学科三率（基于本班标准分）" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getClassOwnSubjectRateData()}
              columns={classOwnSubjectRateColumns}
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

