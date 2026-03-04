import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UploadOutlined,
  BarChartOutlined,
  FileTextOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import UploadReceipt from './components/UploadReceipt';
import AnalyticsChat from './components/AnalyticsChat';
import ExportHistory from './components/ExportHistory';
import './App.css';

const { Header, Sider, Content } = Layout;

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#1F4788', 
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <h1 style={{ color: 'white', margin: 0 }}>
            ExpenseAI Intelligence Platform
          </h1>
        </Header>
        
        <Layout>
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              style={{ height: '100%', borderRight: 0 }}
            >
              <Menu.Item key="1" icon={<DashboardOutlined />}>
                <Link to="/">Dashboard</Link>
              </Menu.Item>
              <Menu.Item key="2" icon={<UploadOutlined />}>
                <Link to="/upload">Upload Receipt</Link>
              </Menu.Item>
              <Menu.Item key="3" icon={<BarChartOutlined />}>
                <Link to="/analytics">AI Analytics</Link>
              </Menu.Item>
              <Menu.Item key="4" icon={<HistoryOutlined />}>
                <Link to="/exports">Export History</Link>
              </Menu.Item>
            </Menu>
          </Sider>
          
          <Layout style={{ padding: '24px' }}>
            <Content
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
                background: '#fff',
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<UploadReceipt />} />
                <Route path="/analytics" element={<AnalyticsChat />} />
                <Route path="/exports" element={<ExportHistory />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;