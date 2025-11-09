import { useState } from 'react'
import { Upload, Button, Form, InputNumber, message, Card, Table, Input, Space } from 'antd'
import { UploadOutlined, InboxOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { saveRecord, saveSubjects, getRecordsByGradeClass } from '../utils/storage'
import { 
  calculateTotalScore, 
  calculateGradeStandards, 
  calculateSubjectStandards,
  calculateClassRates,
  calculateClassSubjectRates,
  addRankings
} from '../utils/calculator'

const { Dragger } = Upload

function UploadPage({ userInfo }) {
  const [form] = Form.useForm()
  // 如果是班级老师，自动设置年级和班级
  const [grade, setGrade] = useState(userInfo.role === 'teacher' ? userInfo.grade : null)
  const [classNum, setClassNum] = useState(userInfo.role === 'teacher' ? userInfo.class : null)
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [uploading, setUploading] = useState(false)

  // 处理Excel文件上传
  const handleFileUpload = (file) => {
    if (!grade || !classNum) {
      message.error('请先输入年级和班级信息')
      return false
    }

    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        if (jsonData.length === 0) {
          message.error('Excel文件为空')
          return
        }

        // 识别学科（排除姓名、学号等字段）
        const firstRow = jsonData[0]
        const allKeys = Object.keys(firstRow)
        const excludeKeys = ['姓名', '学号', '班级', '性别']
        const subjectNames = allKeys.filter(key => !excludeKeys.includes(key))

        // 生成学科配置
        const detectedSubjects = subjectNames.map(name => ({
          name,
          totalScore: 100 // 默认100分
        }))

        setSubjects(detectedSubjects)
        setStudents(jsonData)
        message.success(`成功识别 ${jsonData.length} 名学生，${subjectNames.length} 个学科`)
      } catch (error) {
        message.error('文件解析失败：' + error.message)
      }
    }

    reader.readAsArrayBuffer(file)
    return false // 阻止自动上传
  }

  // 更新学科总分
  const handleSubjectScoreChange = (subjectName, value) => {
    setSubjects(subjects.map(s => 
      s.name === subjectName ? { ...s, totalScore: value } : s
    ))
  }

  // 保存数据
  const handleSave = async () => {
    if (students.length === 0) {
      message.error('请先上传Excel文件')
      return
    }

    if (subjects.some(s => !s.totalScore || s.totalScore <= 0)) {
      message.error('请设置所有学科的总分')
      return
    }

    setUploading(true)

    try {
      // 将中文年级转换为数字（数据库需要整数）
      const gradeMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
      const gradeNumber = typeof grade === 'string' && gradeMap[grade] ? gradeMap[grade] : parseInt(grade) || grade

      // 计算总分
      const studentsWithTotal = students.map(student => ({
        ...student,
        grade: gradeNumber,
        class: classNum,
        totalScore: calculateTotalScore(student, subjects)
      }))

      // 获取该年级的所有现有记录（用于计算三率）
      const existingRecords = await getRecordsByGradeClass(gradeNumber)
      
      // 合并当前上传的数据和现有数据
      let allStudentsData = [...studentsWithTotal]
      const latestRecordsByClass = {}
      
      existingRecords.forEach(record => {
        const classKey = record.class
        if (!latestRecordsByClass[classKey] || 
            new Date(record.created_at) > new Date(latestRecordsByClass[classKey].created_at)) {
          latestRecordsByClass[classKey] = record
        }
      })
      
      // 合并其他班级的最新数据
      Object.values(latestRecordsByClass).forEach(record => {
        if (record.class !== classNum) { // 不包括当前班级的旧数据
          allStudentsData = allStudentsData.concat(record.students)
        }
      })

      // 计算三率（如果有足够的数据）
      let classRatesData = null
      let subjectRatesData = null
      
      console.log('📊 开始计算三率...')
      console.log('📊 全年级学生数:', allStudentsData.length)
      console.log('📊 当前班级:', classNum)
      
      if (allStudentsData.length > 0) {
        try {
          // 添加排名
          const rankedStudents = addRankings(allStudentsData)
          const currentClassStudents = rankedStudents.filter(s => s.class === classNum)
          
          console.log('📊 当前班级学生数:', currentClassStudents.length)
          
          // 计算年级标准分
          const gradeStandards = calculateGradeStandards(rankedStudents, subjects)
          const subjectStandards = calculateSubjectStandards(rankedStudents, subjects)
          
          console.log('📊 年级标准分:', gradeStandards)
          
          // 计算班级总分三率
          const totalRates = calculateClassRates(currentClassStudents, gradeStandards, rankedStudents)
          
          console.log('📊 计算得到的总分三率:', totalRates)
          
          classRatesData = {
            excellentRate: parseFloat(totalRates.excellentRate),
            passRate: parseFloat(totalRates.passRate),
            comprehensiveRate: parseFloat(totalRates.comprehensiveRate),
            totalRate: parseFloat(totalRates.totalRate),
            evaluateCount: totalRates.evaluateCount
          }
          
          console.log('📊 保存的classRatesData:', classRatesData)
          
          // 计算班级各学科三率
          subjectRatesData = subjects.map(subject => {
            const rates = calculateClassSubjectRates(currentClassStudents, subject.name, subjectStandards, rankedStudents)
            return {
              subject: subject.name,
              excellentRate: parseFloat(rates.excellentRate),
              passRate: parseFloat(rates.passRate),
              comprehensiveRate: parseFloat(rates.comprehensiveRate),
              totalRate: parseFloat(rates.totalRate),
              evaluateCount: rates.evaluateCount
            }
          })
          
          console.log('📊 保存的subjectRatesData:', subjectRatesData)
        } catch (error) {
          console.error('❌ 计算三率失败:', error)
          console.error('❌ 错误堆栈:', error.stack)
        }
      }

      // 保存记录（包含三率数据）
      const record = {
        grade: gradeNumber,  // 使用数字年级
        class: classNum,
        subjects,
        students: studentsWithTotal,
        classRates: classRatesData,
        subjectRates: subjectRatesData
      }

      await saveRecord(record)
      await saveSubjects(gradeNumber, classNum, subjects)

      message.success('数据保存成功！' + (classRatesData ? '已自动计算三率数据。' : ''))
      
      // 重置表单
      form.resetFields()
      // 如果是班级老师，保持年级班级不变；如果是管理员，清空
      if (userInfo.role !== 'teacher') {
        setGrade(null)
        setClassNum(null)
      }
      setSubjects([])
      setStudents([])
    } catch (error) {
      message.error('保存失败：' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const subjectColumns = [
    {
      title: '学科名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      render: (value, record) => (
        <InputNumber
          min={1}
          max={1000}
          value={value}
          onChange={(val) => handleSubjectScoreChange(record.name, val)}
        />
      ),
    },
  ]

  return (
    <div>
      <Card title="成绩上传" style={{ marginBottom: 24 }}>
        {userInfo.role === 'teacher' && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
            <p style={{ margin: 0, color: '#1890ff' }}>
              <strong>当前登录：</strong>{userInfo.grade}年级{userInfo.class}班老师
              （只能上传本班成绩）
            </p>
          </div>
        )}

        <Form form={form} layout="inline" style={{ marginBottom: 24 }}>
          <Form.Item label="年级" required>
            <InputNumber
              min={1}
              max={6}
              placeholder="如：1"
              value={grade}
              onChange={setGrade}
              addonAfter="年级"
              disabled={userInfo.role === 'teacher'}
            />
          </Form.Item>
          
          <Form.Item label="班级" required>
            <InputNumber
              min={1}
              max={20}
              placeholder="如：1"
              value={classNum}
              onChange={setClassNum}
              addonAfter="班"
              disabled={userInfo.role === 'teacher'}
            />
          </Form.Item>
        </Form>

        <Dragger
          accept=".xlsx,.xls"
          beforeUpload={handleFileUpload}
          maxCount={1}
          onRemove={() => {
            setSubjects([])
            setStudents([])
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽Excel文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持 .xlsx 和 .xls 格式，请确保Excel包含学生姓名和各科成绩
          </p>
        </Dragger>
      </Card>

      {subjects.length > 0 && (
        <Card title="学科设置" style={{ marginBottom: 24 }}>
          <Table
            dataSource={subjects}
            columns={subjectColumns}
            rowKey="name"
            pagination={false}
          />
        </Card>
      )}

      {students.length > 0 && (
        <Card title="预览数据">
          <p style={{ marginBottom: 16 }}>
            共 <strong>{students.length}</strong> 名学生
          </p>
          <Table
            dataSource={students.slice(0, 10)}
            columns={[
              { title: '姓名', dataIndex: '姓名', key: '姓名' },
              ...subjects.map(s => ({
                title: s.name,
                dataIndex: s.name,
                key: s.name,
              })),
            ]}
            rowKey={(record, index) => index}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
          {students.length > 10 && (
            <p style={{ marginTop: 16, color: '#999' }}>
              仅显示前10条数据...
            </p>
          )}
          
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={handleSave}
              loading={uploading}
            >
              保存数据
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default UploadPage

