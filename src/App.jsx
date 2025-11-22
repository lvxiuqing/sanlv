import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Dropdown } from 'antd'
import {
  UploadOutlined,
  BarChartOutlined,
  TeamOutlined,
  HistoryOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  TableOutlined
} from '@ant-design/icons'
import { lazy, Suspense, useState, useEffect } from 'react'
import { Spin } from 'antd'
import './App.css'

// 懒加载页面组件
const LoginPage = lazy(() => import('./pages/LoginPage'))
const UploadPage = lazy(() => import('./pages/UploadPage'))
const GradePage = lazy(() => import('./pages/GradePage'))
const ClassPage = lazy(() => import('./pages/ClassPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const ThreeRatesHistoryPage = lazy(() => import('./pages/ThreeRatesHistoryPage'))
const DataManagePage = lazy(() => import('./pages/DataManagePage'))
const PasswordPage = lazy(() => import('./pages/PasswordPage'))
const OverviewPage = lazy(() => import('./pages/OverviewPage'))

const { Header, Content, Sider } = Layout

function App() {
  const location = useLocation()
  const [userInfo, setUserInfo] = useState(null)

  // 从本地存储恢复登录状态
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        setUserInfo(JSON.parse(savedUserInfo))
      } catch (error) {
        console.error('恢复登录状态失败:', error)
        localStorage.removeItem('userInfo')
      }
    }
  }, [])

  // 登录处理
  const handleLogin = (info) => {
    setUserInfo(info)
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  // 退出登录
  const handleLogout = () => {
    setUserInfo(null)
    localStorage.removeItem('userInfo')
  }

  // 未登录显示登录页面
  if (!userInfo) {
    return (
      <Suspense fallback={
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      }>
        <LoginPage onLogin={handleLogin} />
      </Suspense>
    )
  }

  const menuItems = [
    {
      key: '/',
      icon: <UploadOutlined />,
      label: <Link to="/">成绩上传</Link>,
    },
    {
      key: '/overview',
      icon: <TableOutlined />,
      label: <Link to="/overview">成绩总览</Link>,
    },
    {
      key: '/grade',
      icon: <BarChartOutlined />,
      label: <Link to="/grade">全年级数据（90%参评）</Link>,
    },
    {
      key: '/class',
      icon: <TeamOutlined />,
      label: <Link to="/class">班级数据</Link>,
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: <Link to="/history">学生成绩变化</Link>,
    },
    {
      key: '/three-rates-history',
      icon: <LineChartOutlined />,
      label: <Link to="/three-rates-history">三率历史对比</Link>,
    },
    {
      key: '/manage',
      icon: <DatabaseOutlined />,
      label: <Link to="/manage">数据管理</Link>,
    },
    ...(userInfo.role === 'teacher' ? [
      {
        key: '/password',
        icon: <KeyOutlined />,
        label: <Link to="/password">修改密码</Link>,
      }
    ] : []),
  ]

  // 用户菜单
  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout
      }
    ]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <div className="logo">
          <h1>小学成绩分析系统</h1>
        </div>
        <div style={{ position: 'absolute', right: 24, top: 16 }}>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Button type="text" style={{ color: '#fff' }}>
              <UserOutlined style={{ marginRight: 8 }} />
              {userInfo.name}
              {userInfo.role === 'teacher' && ` (${userInfo.grade}年级${userInfo.class}班)`}
            </Button>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
              borderRadius: 8,
            }}
          >
            <Suspense fallback={
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
              </div>
            }>
              <Routes>
                <Route path="/" element={<UploadPage userInfo={userInfo} />} />
                <Route path="/overview" element={<OverviewPage userInfo={userInfo} />} />
                <Route path="/grade" element={<GradePage userInfo={userInfo} />} />
                <Route path="/class" element={<ClassPage userInfo={userInfo} />} />
                <Route path="/history" element={<HistoryPage userInfo={userInfo} />} />
                <Route path="/three-rates-history" element={<ThreeRatesHistoryPage userInfo={userInfo} />} />
                <Route path="/manage" element={<DataManagePage userInfo={userInfo} />} />
                {userInfo.role === 'teacher' && (
                  <Route path="/password" element={<PasswordPage userInfo={userInfo} />} />
                )}
              </Routes>
            </Suspense>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default App

