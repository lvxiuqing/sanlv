import { useState, useEffect } from 'react'
import { Card, Button, Table, Modal, message, Space } from 'antd'
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { getAllData, clearAllData } from '../utils/storage'

const { confirm } = Modal

function DataManagePage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const data = await getAllData()
    setRecords(data.records)
  }

  const handleClearAll = () => {
    confirm({
      title: '确认清除所有数据？',
      icon: <ExclamationCircleOutlined />,
      content: '此操作将清除所有上传的成绩数据，且无法恢复！建议在学期结束时使用此功能。',
      okText: '确认清除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        setLoading(true)
        try {
          await clearAllData()
          setRecords([])
          message.success('数据已全部清除')
        } catch (error) {
          message.error('清除失败：' + error.message)
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      render: (val) => `${val}年级`,
    },
    {
      title: '班级',
      dataIndex: 'class',
      key: 'class',
      render: (val) => `${val}班`,
    },
    {
      title: '学生人数',
      dataIndex: 'students',
      key: 'studentCount',
      render: (students) => students.length,
    },
    {
      title: '学科数量',
      dataIndex: 'subjects',
      key: 'subjectCount',
      render: (subjects) => subjects.length,
    },
    {
      title: '学科',
      dataIndex: 'subjects',
      key: 'subjects',
      render: (subjects) => subjects.map(s => s.name).join('、'),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (created_at) => created_at ? new Date(created_at).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : '-',
    },
  ]

  const getStatistics = () => {
    const totalRecords = records.length
    const totalStudents = records.reduce((sum, r) => sum + r.students.length, 0)
    const grades = new Set(records.map(r => r.grade))
    const classes = new Set(records.map(r => `${r.grade}_${r.class}`))

    return {
      totalRecords,
      totalStudents,
      gradeCount: grades.size,
      classCount: classes.size,
    }
  }

  const stats = getStatistics()

  return (
    <div>
      <Card title="数据管理" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h3>数据统计</h3>
          <p>总记录数：<strong>{stats.totalRecords}</strong> 条</p>
          <p>总学生数：<strong>{stats.totalStudents}</strong> 人</p>
          <p>涉及年级：<strong>{stats.gradeCount}</strong> 个</p>
          <p>涉及班级：<strong>{stats.classCount}</strong> 个</p>
        </div>

        <Space>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={handleClearAll}
            loading={loading}
            disabled={records.length === 0}
          >
            清除所有数据
          </Button>
        </Space>

        <div style={{ marginTop: 16, padding: 16, background: '#fff3cd', borderRadius: 4 }}>
          <strong>提示：</strong>
          <p style={{ margin: '8px 0 0 0' }}>
            • 清除数据功能建议在学期结束时使用<br />
            • 清除后数据无法恢复，请谨慎操作<br />
            • 清除前建议先导出重要数据备份
          </p>
        </div>
      </Card>

      <Card title="已上传的成绩记录">
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default DataManagePage

