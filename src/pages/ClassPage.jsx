import { useState, useEffect, useMemo } from 'react'
import { Card, Select, Table, message, Empty } from 'antd'
import { getAllGrades, getClassesByGrade, getRecordsByGradeClass } from '../utils/storage'
import {
  calculateGradeStandards,
  calculateSubjectStandards,
  calculateClassRates,
  calculateClassSubjectRates,
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
        render: (val, record) => {
          const isEvaluate = subjectEvaluateStudents[subject.name]?.includes(record['姓名'])
          return (
            <span style={{ color: isEvaluate ? '#ff4d4f' : 'inherit', fontWeight: isEvaluate ? 'bold' : 'normal' }}>
              {val}
            </span>
          )
        },
      },
      {
        title: `${subject.name}降序`,
        key: `${subject.name}_rank`,
        width: 100,
        render: (_, record) => {
          // 计算该学生在该学科的年级排名
          const score = parseFloat(record[subject.name]) || 0
          const sortedBySubject = [...allStudents].sort((a, b) => 
            (parseFloat(b[subject.name]) || 0) - (parseFloat(a[subject.name]) || 0)
          )
          const rank = sortedBySubject.findIndex(s => s['姓名'] === record['姓名']) + 1
          const isEvaluate = subjectEvaluateStudents[subject.name]?.includes(record['姓名'])
          return (
            <span style={{ color: isEvaluate ? '#ff4d4f' : 'inherit', fontWeight: isEvaluate ? 'bold' : 'normal' }}>
              {rank}
            </span>
          )
        },
      },
    ]),
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 100,
      render: (val, record) => {
        const isEvaluate = totalEvaluateStudents.includes(record['姓名'])
        return (
          <strong style={{ color: isEvaluate ? '#ff4d4f' : 'inherit' }}>
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

  const getClassRateData = () => {
    if (!classRates) return []
    return [
      { type: '优秀率', value: classRates.excellentRate },
      { type: '及格率', value: classRates.passRate },
      { type: '综合率', value: classRates.comprehensiveRate },
      { type: '三率之和', value: classRates.totalRate },
    ]
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

        {classStudents.length > 0 && classRates && (
          <div style={{ marginTop: 16 }}>
            <p style={{ marginBottom: 8 }}>
              班级总人数：<strong>{classStudents.length}</strong> 人
            </p>
            <p style={{ marginBottom: 0 }}>
              总分参评人数：<strong style={{ color: '#ff4d4f' }}>{classRates.evaluateCount}</strong> 人
              <span style={{ color: '#999', marginLeft: 8 }}>
                （在全年级总分前90%的学生）
              </span>
            </p>
          </div>
        )}
      </Card>

      {classStudents.length > 0 ? (
        <>
          <Card title="班级总分三率" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getClassRateData()}
              columns={classRateColumns}
              pagination={false}
              rowKey="type"
            />
          </Card>

          <Card title="班级各学科三率" style={{ marginBottom: 24 }}>
            <Table
              dataSource={classSubjectRates}
              columns={subjectRateColumns}
              pagination={false}
              rowKey="subject"
              scroll={{ x: 'max-content' }}
            />
          </Card>

          <Card title="班级学生成绩表">
            <div style={{ marginBottom: 16, padding: '12px', background: '#f0f2f5', borderRadius: 4 }}>
              <p style={{ margin: 0, color: '#666' }}>
                <strong>说明：</strong>
                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>红色数字</span> 表示该学生在该项目中属于参评学生（全年级前90%）
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                • <strong>总分</strong>：红色表示在全年级总分排名前90%
              </p>
              <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                • <strong>各学科分数和降序</strong>：红色表示在该学科全年级排名前90%
              </p>
              {/* 调试信息 */}
              {totalEvaluateStudents.length > 0 && (
                <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '12px' }}>
                  调试：总分参评学生 {totalEvaluateStudents.length} 人：{totalEvaluateStudents.slice(0, 5).join('、')}
                  {totalEvaluateStudents.length > 5 && '...'}
                </p>
              )}
            </div>
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

