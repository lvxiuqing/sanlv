import { useState, useEffect } from 'react'
import { Card, Button, Table, Modal, message, Space } from 'antd'
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { getAllData, clearAllData } from '../utils/storage'

const { confirm } = Modal

function DataManagePage({ userInfo }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const data = await getAllData()
    
    // 如果是班级老师，显示自己年级的所有班级数据
    if (userInfo.role === 'teacher') {
      // 将中文年级转换为数字进行比较
      const gradeMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
      const gradeNumber = typeof userInfo.grade === 'string' && gradeMap[userInfo.grade] 
        ? gradeMap[userInfo.grade] 
        : parseInt(userInfo.grade) || userInfo.grade
      
      const myGradeRecords = data.records.filter(r => 
        r.grade === gradeNumber
      )
      setRecords(myGradeRecords)
    } else {
      // 管理员显示所有数据
      setRecords(data.records)
    }
  }

  const handleClearAll = () => {
    confirm({
      title: '确认清除所有数据？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>此操作将清除：</p>
          <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
            <li>所有上传的成绩记录</li>
            <li>所有历史成绩明细</li>
            <li>所有学科配置</li>
          </ul>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>数据清除后无法恢复！建议在学期结束时使用此功能。</p>
        </div>
      ),
      okText: '确认清除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        setLoading(true)
        try {
          const result = await clearAllData()
          setRecords([])
          message.success(
            `数据已全部清除！共删除 ${result.deletedRecords} 条成绩记录（含历史记录）和 ${result.deletedConfigs} 条学科配置`,
            5
          )
          // 提示用户刷新其他页面
          setTimeout(() => {
            message.info('如需查看效果，请刷新其他页面（年级数据、班级数据、历史对比）', 5)
          }, 1000)
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
        {userInfo.role === 'teacher' && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
            <p style={{ margin: 0, color: '#1890ff' }}>
              <strong>当前登录：</strong>{userInfo.grade}年级{userInfo.class}班老师
              （可查看{userInfo.grade}年级所有班级的成绩记录）
            </p>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <h3>数据统计</h3>
          <p>总记录数：<strong>{stats.totalRecords}</strong> 条</p>
          <p>总学生数：<strong>{stats.totalStudents}</strong> 人</p>
          <p>涉及年级：<strong>{stats.gradeCount}</strong> 个</p>
          <p>涉及班级：<strong>{stats.classCount}</strong> 个</p>
        </div>

        {userInfo.role === 'admin' && (
          <>
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
              <strong>⚠️ 重要提示：</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                • 清除数据功能建议在学期结束时使用<br />
                • 将清除<strong>所有成绩记录</strong>和<strong>所有历史成绩明细</strong><br />
                • 历史对比页面的数据也会被清空<br />
                • 清除后数据<strong style={{ color: '#ff4d4f' }}>无法恢复</strong>，请谨慎操作<br />
                • 清除前建议先导出重要数据备份
              </p>
            </div>
          </>
        )}

        {userInfo.role === 'teacher' && (
          <div style={{ marginTop: 16, padding: 16, background: '#f0f0f0', borderRadius: 4 }}>
            <p style={{ margin: 0, color: '#666' }}>
              <strong>📝 说明：</strong>教师账号只能查看已上传的成绩记录。如需清除数据，请联系管理员。
            </p>
          </div>
        )}
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

