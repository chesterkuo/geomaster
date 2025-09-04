import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard/Dashboard'
import WebsiteScanning from './pages/WebsiteScanning/WebsiteScanning'
import ContentOptimization from './pages/ContentOptimization/ContentOptimization'
import AITracking from './pages/AITracking/AITracking'
import CompetitorAnalysis from './pages/CompetitorAnalysis/CompetitorAnalysis'
import KeywordResearch from './pages/KeywordResearch/KeywordResearch'
import ReportCenter from './pages/ReportCenter/ReportCenter'
import TeamManagement from './pages/TeamManagement/TeamManagement'
import IntegrationSettings from './pages/IntegrationSettings/IntegrationSettings'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import { LoadingProvider } from './contexts/LoadingContext'

const App: React.FC = () => {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth)
  
  // DEBUG: Force show authenticated view to test
  console.log('Auth State:', { isAuthenticated, token, hasToken: !!token })

  return (
    <LoadingProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/scan" element={<WebsiteScanning />} />
          <Route path="/optimize" element={<ContentOptimization />} />
          <Route path="/tracking" element={<AITracking />} />
          <Route path="/competitors" element={<CompetitorAnalysis />} />
          <Route path="/keywords" element={<KeywordResearch />} />
          <Route path="/reports" element={<ReportCenter />} />
          <Route path="/team" element={<TeamManagement />} />
          <Route path="/settings" element={<IntegrationSettings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </LoadingProvider>
  )
}

export default App