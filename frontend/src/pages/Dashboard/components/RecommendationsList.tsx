import React from 'react'
import { AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react'

interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  impact: string
  category: string
}

const RecommendationsList: React.FC = () => {
  const recommendations: Recommendation[] = [
    {
      id: '1',
      title: '優化首頁標題和描述',
      description: '更新首頁的 meta title 和 description，提高 AI 平台的理解度',
      priority: 'high',
      status: 'pending',
      impact: '可提升 15-20% 的可見度',
      category: '內容優化'
    },
    {
      id: '2',
      title: '新增結構化資料標記',
      description: '為產品頁面添加 JSON-LD 結構化資料，幫助 AI 更好理解內容',
      priority: 'high',
      status: 'in_progress',
      impact: '改善內容理解度',
      category: '技術 SEO'
    },
    {
      id: '3',
      title: '建立 FAQ 頁面',
      description: '創建詳細的 FAQ 頁面，回答用戶常見問題，提高 AI 回應準確度',
      priority: 'medium',
      status: 'pending',
      impact: '增加引用機會',
      category: '內容策略'
    },
    {
      id: '4',
      title: '優化圖片 Alt 文字',
      description: '為所有圖片添加描述性的 Alt 文字，提升內容的可訪問性',
      priority: 'medium',
      status: 'completed',
      impact: '提升內容完整性',
      category: '可訪問性'
    },
    {
      id: '5',
      title: '更新關於我們頁面',
      description: '豐富公司背景資訊，提高品牌在 AI 平台中的權威性',
      priority: 'low',
      status: 'pending',
      impact: '增強品牌信任度',
      category: '品牌建設'
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'low': return 'text-green-400 bg-green-400/10'
      default: return 'text-slate-400 bg-slate-400/10'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高優先級'
      case 'medium': return '中優先級'
      case 'low': return '低優先級'
      default: return '未知'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'pending': return <AlertCircle className="w-4 h-4 text-slate-400" />
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'in_progress': return '進行中'
      case 'pending': return '待處理'
      default: return '未知'
    }
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">AI 優化建議</h3>
          <p className="text-slate-400 text-sm mt-1">基於智能分析的個性化改進方案</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all duration-200 text-sm font-medium">
          <span>查看全部</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {recommendations.map((recommendation) => (
          <div 
            key={recommendation.id} 
            className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-indigo-500/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(recommendation.status)}
                    <span className="text-slate-400 text-xs font-medium">{getStatusText(recommendation.status)}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(recommendation.priority)}`}>
                    {getPriorityText(recommendation.priority)}
                  </span>
                </div>
                
                <h4 className="font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  {recommendation.title}
                </h4>
                
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                  {recommendation.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 text-xs bg-slate-800 px-3 py-1 rounded-lg">
                      {recommendation.category}
                    </span>
                    <span className="text-green-400 text-xs font-medium">
                      {recommendation.impact}
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 whitespace-nowrap">
                立即執行
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecommendationsList