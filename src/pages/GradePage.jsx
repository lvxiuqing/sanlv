import { useState, useEffect } from 'react'
import { Card, Select, Table, message, Empty } from 'antd'
import { getAllGrades, getRecordsByGradeClass } from '../utils/storage'
import {
  calculateGradeStandards,
  calculateSubjectStandards,
  calculateGradeRates,
  calculateGradeSubjectRates,
  addRankings
} from '../utils/calculator'

const { Option } = Select

function GradePage({ userInfo }) {
  const [grades, setGrades] = useState([])
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [allStudents, setAllStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [gradeStandards, setGradeStandards] = useState(null)
  const [subjectStandards, setSubjectStandards] = useState(null)
  const [gradeRates, setGradeRates] = useState(null)
  const [gradeSubjectRates, setGradeSubjectRates] = useState(null)

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
    if (selectedGrade) {
      loadGradeData(selectedGrade)
    }
  }, [selectedGrade])

  const loadGradeData = async (grade) => {
    // 将中文年级转换为数字
    const gradeMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
    const gradeNumber = typeof grade === 'string' && gradeMap[grade] ? gradeMap[grade] : parseInt(grade) || grade

    const records = await getRecordsByGradeClass(gradeNumber)
    
    if (records.length === 0) {
      message.warning('该年级暂无数据')
      setAllStudents([])
      setSubjects([])
      return
    }

    // 获取最新记录的学科配置
    const latestRecord = records[0] // 已经按时间降序排列
    setSubjects(latestRecord.subjects)

    // 只使用最新一次考试的数据：找出每个班级的最新记录
    const latestRecordsByClass = {}
    records.forEach(record => {
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

    // 添加排名
    const rankedStudents = addRankings(allStudentsData)
    setAllStudents(rankedStudents)

    // 计算年级三率标准分
    const standards = calculateGradeStandards(rankedStudents, latestRecord.subjects)
    setGradeStandards(standards)

    // 计算学科三率标准分
    const subjectStd = calculateSubjectStandards(rankedStudents, latestRecord.subjects)
    setSubjectStandards(subjectStd)

    // 计算年级总分三率
    const gradeRts = calculateGradeRates(rankedStudents, standards)
    setGradeRates(gradeRts)

    // 计算年级各学科三率
    const subjectRts = calculateGradeSubjectRates(rankedStudents, latestRecord.subjects, subjectStd)
    setGradeSubjectRates(subjectRts)
  }

  const studentColumns = [
    {
      title: '年级排名',
      dataIndex: 'gradeRank',
      key: 'gradeRank',
      width: 100,
      sorter: (a, b) => a.gradeRank - b.gradeRank,
    },
    {
      title: '班级排名',
      dataIndex: 'classRank',
      key: 'classRank',
      width: 100,
      sorter: (a, b) => a.classRank - b.classRank,
    },
    {
      title: '班级',
      dataIndex: 'class',
      key: 'class',
      width: 80,
      render: (val) => `${val}班`,
    },
    {
      title: '姓名',
      dataIndex: '姓名',
      key: '姓名',
      width: 100,
    },
    // 为每个学科生成两列：原始分数和降序
    ...subjects.flatMap(subject => [
      {
        title: subject.name,
        dataIndex: subject.name,
        key: subject.name,
        width: 80,
        render: (val) => (
          <span style={{ color: '#000' }}>
            {val}
          </span>
        ),
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
      sorter: (a, b) => a.totalScore - b.totalScore,
      render: (val) => <strong style={{ color: '#000' }}>{val.toFixed(2)}</strong>,
    },
  ]

  const standardColumns = [
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

  const subjectStandardColumns = [
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

  const gradeRateColumns = [
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

  const getStandardData = () => {
    if (!gradeStandards) return []
    return [
      { type: '优秀率计数标准分（前20%）', score: gradeStandards.excellentStandard },
      { type: '及格率计数标准分（总分60%）', score: gradeStandards.passStandard },
      { type: '综合率计数标准分（平均分）', score: gradeStandards.comprehensiveStandard },
    ]
  }

  const getSubjectStandardData = () => {
    if (!subjectStandards) return []
    return subjects.map(subject => ({
      subject: subject.name,
      ...subjectStandards[subject.name]
    }))
  }

  const getGradeRateData = () => {
    if (!gradeRates) return []
    return [gradeRates]
  }

  const getSubjectRateData = () => {
    if (!gradeSubjectRates) return []
    return subjects.map(subject => ({
      subject: subject.name,
      ...gradeSubjectRates[subject.name]
    }))
  }

  // 只有管理员可以访问年级数据页面
  if (userInfo.role === 'teacher') {
    return (
      <div>
        <Card title="年级数据分析" style={{ marginBottom: 24 }}>
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

  return (
    <div>
      <Card title="年级数据分析" style={{ marginBottom: 24 }}>
        {userInfo.role === 'admin' && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4, border: '1px solid #91d5ff' }}>
            <p style={{ margin: 0, color: '#1890ff' }}>
              <strong>当前身份：</strong>管理员账号，可查看所有年级的汇总数据
            </p>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 16 }}>选择年级：</span>
          <Select
            style={{ width: 200 }}
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
        </div>

        {gradeStandards && (
          <div style={{ marginTop: 16 }}>
            <p>参评人数：<strong>{gradeStandards.evaluateCount}</strong> 人（占总人数90%）</p>
          </div>
        )}
      </Card>

      {allStudents.length > 0 ? (
        <>
          <Card title="年级总分三率" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getGradeRateData()}
              columns={gradeRateColumns}
              pagination={false}
              rowKey={(record, index) => `grade_rate_${index}`}
            />
          </Card>

          <Card title="年级各学科三率" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getSubjectRateData()}
              columns={subjectRateColumns}
              pagination={false}
              rowKey="subject"
              scroll={{ x: 'max-content' }}
            />
          </Card>

          <Card title="年级总分三率标准分" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getStandardData()}
              columns={standardColumns}
              pagination={false}
              rowKey="type"
            />
          </Card>

          <Card title="年级各学科三率标准分" style={{ marginBottom: 24 }}>
            <Table
              dataSource={getSubjectStandardData()}
              columns={subjectStandardColumns}
              pagination={false}
              rowKey="subject"
              scroll={{ x: 'max-content' }}
            />
          </Card>

          <Card title="年级学生成绩总表">
            <Table
              dataSource={allStudents}
              columns={studentColumns}
              rowKey={(record, index) => `${record.class}_${record['姓名']}_${index}`}
              pagination={{ pageSize: 20 }}
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

export default GradePage

