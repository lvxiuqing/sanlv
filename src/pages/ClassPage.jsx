import { useState, useEffect } from 'react'
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
    let allStudents = []
    Object.values(latestRecordsByClass).forEach(record => {
      allStudents = allStudents.concat(record.students)
    })

    // 计算年级标准分
    const standards = calculateGradeStandards(allStudents, latestRecord.subjects)
    setGradeStandards(standards)

    const subjectStd = calculateSubjectStandards(allStudents, latestRecord.subjects)
    setSubjectStandards(subjectStd)

    // 添加排名
    const rankedStudents = addRankings(allStudents)
    const classStudentsData = rankedStudents.filter(s => s.class === classNum)
    setClassStudents(classStudentsData)

    // 计算班级三率
    const rates = calculateClassRates(classStudentsData, standards)
    setClassRates(rates)

    // 计算班级各学科三率
    const subjectRates = latestRecord.subjects.map(subject => {
      const rates = calculateClassSubjectRates(classStudentsData, subject.name, subjectStd)
      return {
        subject: subject.name,
        ...rates
      }
    })
    setClassSubjectRates(subjectRates)
  }

  const studentColumns = [
    {
      title: '班级排名',
      dataIndex: 'classRank',
      key: 'classRank',
      width: 100,
    },
    {
      title: '年级排名',
      dataIndex: 'gradeRank',
      key: 'gradeRank',
      width: 100,
    },
    {
      title: '姓名',
      dataIndex: '姓名',
      key: '姓名',
      width: 100,
    },
    ...subjects.map(subject => ({
      title: subject.name,
      dataIndex: subject.name,
      key: subject.name,
      width: 80,
    })),
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 100,
      render: (val) => <strong>{val.toFixed(2)}</strong>,
    },
  ]

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
    },
    {
      title: '优秀率',
      dataIndex: 'excellentRate',
      key: 'excellentRate',
      render: (val) => `${val}%`,
    },
    {
      title: '及格率',
      dataIndex: 'passRate',
      key: 'passRate',
      render: (val) => `${val}%`,
    },
    {
      title: '综合率',
      dataIndex: 'comprehensiveRate',
      key: 'comprehensiveRate',
      render: (val) => `${val}%`,
    },
    {
      title: '三率之和',
      dataIndex: 'totalRate',
      key: 'totalRate',
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

        {classStudents.length > 0 && (
          <p>参评人数：<strong>{classStudents.length}</strong> 人</p>
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
            <Table
              dataSource={classStudents}
              columns={studentColumns}
              rowKey={(record, index) => `${record['姓名']}_${index}`}
              pagination={false}
              scroll={{ x: 'max-content' }}
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

