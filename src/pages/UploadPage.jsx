import { useState } from 'react'
import { Upload, Button, Form, InputNumber, message, Card, Table, Input, Space } from 'antd'
import { UploadOutlined, InboxOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { saveRecord, saveSubjects } from '../utils/storage'
import { calculateTotalScore } from '../utils/calculator'

const { Dragger } = Upload

function UploadPage() {
  const [form] = Form.useForm()
  const [grade, setGrade] = useState(null)
  const [classNum, setClassNum] = useState(null)
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
      // 计算总分
      const studentsWithTotal = students.map(student => ({
        ...student,
        grade,
        class: classNum,
        totalScore: calculateTotalScore(student, subjects)
      }))

      // 保存记录
      const record = {
        grade,
        class: classNum,
        subjects,
        students: studentsWithTotal
      }

      await saveRecord(record)
      await saveSubjects(grade, classNum, subjects)

      message.success('数据保存成功！')
      
      // 重置表单
      form.resetFields()
      setGrade(null)
      setClassNum(null)
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
        <Form form={form} layout="inline" style={{ marginBottom: 24 }}>
          <Form.Item label="年级" required>
            <InputNumber
              min={1}
              max={6}
              placeholder="如：1"
              value={grade}
              onChange={setGrade}
              addonAfter="年级"
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

