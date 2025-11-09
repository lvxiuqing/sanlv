import { useState } from 'react'
import { Card, Form, Input, Button, message, Alert } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { changeTeacherPassword } from '../utils/auth'

function PasswordPage({ userInfo }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (values) => {
    const { oldPassword, newPassword, confirmPassword } = values
    
    if (newPassword !== confirmPassword) {
      message.error('两次输入的新密码不一致')
      return
    }
    
    if (newPassword.length < 6) {
      message.error('新密码长度至少为6位')
      return
    }
    
    if (oldPassword === newPassword) {
      message.error('新密码不能与原密码相同')
      return
    }
    
    try {
      setLoading(true)
      await changeTeacherPassword(userInfo.grade, userInfo.class, oldPassword, newPassword)
      
      message.success('密码修改成功！下次登录请使用新密码')
      form.resetFields()
      setLoading(false)
    } catch (error) {
      console.error('修改密码失败:', error)
      if (error.message === '原密码错误') {
        message.error('原密码错误，请重新输入')
      } else {
        message.error('修改密码失败，请稍后重试')
      }
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 600, margin: '0 auto' }}>
      <Card 
        title={
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>
            🔐 修改密码
          </span>
        }
        bordered={false}
      >
        <Alert
          message="密码安全提示"
          description={
            <div>
              <p style={{ marginBottom: 8 }}>
                • 为了账号安全，建议定期更换密码
              </p>
              <p style={{ marginBottom: 8 }}>
                • 密码长度至少为6位字符
              </p>
              <p style={{ marginBottom: 0 }}>
                • 请勿使用过于简单的密码，如"123456"
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          onFinish={handleChangePassword}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[
              { required: true, message: '请输入原密码' }
            ]}
          >
            <Input.Password
              placeholder="请输入原密码"
              prefix={<LockOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
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
              style={{ height: 45 }}
            >
              确认修改
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: '#fff7e6', 
          borderRadius: 8,
          fontSize: 13,
          color: '#d46b08'
        }}>
          <p style={{ margin: 0 }}>
            ⚠️ 修改密码后，下次登录需要使用新密码。请务必牢记新密码！
          </p>
        </div>
      </Card>
    </div>
  )
}

export default PasswordPage
