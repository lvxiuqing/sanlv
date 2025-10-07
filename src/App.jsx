import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  UploadOutlined,
  BarChartOutlined,
  TeamOutlined,
  HistoryOutlined,
  DatabaseOutlined
} from '@ant-design/icons'
import UploadPage from './pages/UploadPage'
import GradePage from './pages/GradePage'
import ClassPage from './pages/ClassPage'
import HistoryPage from './pages/HistoryPage'
import DataManagePage from './pages/DataManagePage'
import './App.css'

const { Header, Content, Sider } = Layout

function App() {
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <UploadOutlined />,
      label: <Link to="/">成绩上传</Link>,
    },
    {
      key: '/grade',
      icon: <BarChartOutlined />,
      label: <Link to="/grade">年级数据</Link>,
    },
    {
      key: '/class',
      icon: <TeamOutlined />,
      label: <Link to="/class">班级数据</Link>,
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: <Link to="/history">历史对比</Link>,
    },
    {
      key: '/manage',
      icon: <DatabaseOutlined />,
      label: <Link to="/manage">数据管理</Link>,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <div className="logo">
          <h1>小学成绩分析系统</h1>
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
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/grade" element={<GradePage />} />
              <Route path="/class" element={<ClassPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/manage" element={<DataManagePage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default App

