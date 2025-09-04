import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import DashboardStats from './components/DashboardStats'
import VisibilityChart from './components/VisibilityChart'
import AIScoreRing from './components/AIScoreRing'
import RecommendationsList from './components/RecommendationsList'
import QuickActions from './components/QuickActions'
import { Search, FileText, BarChart3 } from 'lucide-react'

const Dashboard: React.FC = () => {
  const { currentOrganization } = useSelector((state: RootState) => state.auth)

  return (
    <div className="space-y-8">
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-4">
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200">
          <Search className="w-5 h-5" />
          掃描網站
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 hover:text-white transition-all duration-200">
          <FileText className="w-5 h-5" />
          優化內容
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 hover:text-white transition-all duration-200">
          <BarChart3 className="w-5 h-5" />
          生成報告
        </button>
      </div>

      {/* Stats Grid */}
      <DashboardStats />

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <VisibilityChart />
        </div>
        <div className="xl:col-span-1">
          <AIScoreRing />
        </div>
      </div>

      {/* Recommendations */}
      <RecommendationsList />
    </div>
  )
}

export default Dashboard