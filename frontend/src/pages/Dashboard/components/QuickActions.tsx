import React from 'react'
import { Search, Zap, Target, Plus } from 'lucide-react'

const QuickActions: React.FC = () => {
  const actions = [
    {
      name: '新增網站',
      description: '添加新的網站進行分析',
      icon: Plus,
      color: 'from-blue-500 to-blue-600',
      href: '/websites/new'
    },
    {
      name: '開始掃描',
      description: '執行完整的網站掃描',
      icon: Search,
      color: 'from-green-500 to-green-600',
      href: '/scan'
    },
    {
      name: '優化內容',
      description: '一鍵優化現有內容',
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
      href: '/optimize'
    },
    {
      name: 'AI 追蹤',
      description: '監控 AI 平台表現',
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      href: '/tracking'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.name}
            className="group relative overflow-hidden bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl p-4 text-left transition-all duration-200 hover:scale-105"
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-200`} />
            
            <div className="relative">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="font-semibold text-white group-hover:text-white transition-colors">
                {action.name}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {action.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default QuickActions