import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import DashboardStats from './components/DashboardStats'
import VisibilityChart from './components/VisibilityChart'
import AIScoreRing from './components/AIScoreRing'
import RecommendationsList from './components/RecommendationsList'
import QuickActions from './components/QuickActions'

const Dashboard: React.FC = () => {
  const { currentOrganization } = useSelector((state: RootState) => state.auth)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            AI 搜尋優化儀表板
          </h1>
          <p className="text-slate-400 mt-1">
            {currentOrganization?.name} - 提升您的 AI 平台可見度
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <DashboardStats />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VisibilityChart />
        </div>
        <div className="lg:col-span-1">
          <AIScoreRing />
        </div>
      </div>

      {/* Recommendations */}
      <RecommendationsList />
    </div>
  )
}

export default Dashboard