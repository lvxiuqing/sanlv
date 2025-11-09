import { useState } from 'react'
import { Card, Form, Input, Button, Select, message, Modal } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { verifyTeacherPassword, createTeacher } from '../utils/auth'

const { Option } = Select

function LoginPage({ onLogin }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [setupModalVisible, setSetupModalVisible] = useState(false)
  const [setupForm] = Form.useForm()
  const [pendingLoginInfo, setPendingLoginInfo] = useState(null)

  const handleLogin = async (values) => {
    setLoading(true)
    const { grade, classNum, password } = values
    
    try {
      // 管理员密码
      if (password === 'admin123') {
        onLogin({ role: 'admin', grade: null, class: null, name: '管理员' })
        message.success('管理员登录成功！可查看所有数据')
        setLoading(false)
        return
      }
      
      // 验证教师密码
      const result = await verifyTeacherPassword(grade, classNum, password)
      
      if (result.needSetup) {
        // 首次登录，需要设置密码
        setPendingLoginInfo({ grade, classNum, password })
        setSetupModalVisible(true)
        setLoading(false)
        return
      }
      
      if (result.success) {
        onLogin({ 
          role: 'teacher', 
          grade, 
          class: parseInt(classNum), 
          name: `${grade}年级${classNum}班老师` 
        })
        message.success(`${grade}年级${classNum}班 登录成功！`)
        setLoading(false)
        return
      }
      
      message.error('密码错误，请重试')
      setLoading(false)
    } catch (error) {
      console.error('登录失败:', error)
      message.error('登录失败，请稍后重试')
      setLoading(false)
    }
  }

  const handleSetupPassword = async (values) => {
    const { newPassword, confirmPassword } = values
    
    if (newPassword !== confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }
    
    if (newPassword.length < 6) {
      message.error('密码长度至少为6位')
      return
    }
    
    try {
      setLoading(true)
      await createTeacher(pendingLoginInfo.grade, pendingLoginInfo.classNum, newPassword)
      
      message.success('密码设置成功！请使用新密码登录')
      setSetupModalVisible(false)
      setupForm.resetFields()
      setPendingLoginInfo(null)
      setLoading(false)
    } catch (error) {
      console.error('设置密码失败:', error)
      message.error('设置密码失败，请稍后重试')
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          maxWidth: 450, 
          width: '100%',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, color: '#1890ff', marginBottom: 8 }}>
            小学成绩分析系统
          </h1>
          <p style={{ color: '#999', fontSize: 14 }}>教师登录</p>
        </div>

        <Form 
          form={form} 
          onFinish={handleLogin}
          layout="vertical"
          size="large"
        >
          <Form.Item 
            name="grade" 
            label="年级" 
            rules={[{ required: true, message: '请选择年级' }]}
          >
            <Select placeholder="请选择年级" prefix={<UserOutlined />}>
              <Option value="一">一年级</Option>
              <Option value="二">二年级</Option>
              <Option value="三">三年级</Option>
              <Option value="四">四年级</Option>
              <Option value="五">五年级</Option>
              <Option value="六">六年级</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="classNum" 
            label="班级" 
            rules={[{ required: true, message: '请输入班级号' }]}
          >
            <Input 
              type="number" 
              placeholder="输入班级号（如：1、2、3）" 
              prefix={<UserOutlined />}
            />
          </Form.Item>
          
          <Form.Item 
            name="password" 
            label="密码" 
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              placeholder="输入登录密码" 
              prefix={<LockOutlined />}
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              style={{ height: 45, fontSize: 16 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: '#f5f5f5', 
          borderRadius: 8,
          fontSize: 12,
          color: '#666'
        }}>
          <p style={{ marginBottom: 8, fontWeight: 'bold', color: '#333' }}>
            💡 登录提示：
          </p>
          <p style={{ marginBottom: 4 }}>
            <strong>班级老师：</strong>首次登录需设置密码，之后使用自己设置的密码登录
          </p>
          <p style={{ marginBottom: 0, marginTop: 12, color: '#999' }}>
            密码要求：至少6位字符
          </p>
        </div>
      </Card>

      {/* 首次设置密码弹窗 */}
      <Modal
        title="首次登录 - 设置密码"
        open={setupModalVisible}
        onCancel={() => {
          setSetupModalVisible(false)
          setupForm.resetFields()
          setPendingLoginInfo(null)
        }}
        footer={null}
        width={450}
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
          <p style={{ margin: 0, color: '#1890ff' }}>
            🎉 欢迎使用成绩分析系统！
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#666' }}>
            检测到您是首次登录 <strong>{pendingLoginInfo?.grade}年级{pendingLoginInfo?.classNum}班</strong>，请设置您的专属密码。
          </p>
        </div>

        <Form
          form={setupForm}
          onFinish={handleSetupPassword}
          layout="vertical"
        >
          <Form.Item
            name="newPassword"
            label="设置新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少为6位' }
            ]}
          >
            <Input.Password
              placeholder="请输入新密码（至少6位）"
              prefix={<LockOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[
              { required: true, message: '请再次输入新密码' }
            ]}
          >
            <Input.Password
              placeholder="请再次输入新密码"
              prefix={<LockOutlined />}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ height: 40 }}
            >
              确认设置
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: '#fff7e6', 
          borderRadius: 4,
          fontSize: 12,
          color: '#d46b08'
        }}>
          <p style={{ margin: 0 }}>
            ⚠️ 请牢记您设置的密码，后续登录需要使用此密码。
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default LoginPage

