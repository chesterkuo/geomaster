import React from 'react'
import { TrendingUp, Eye, Target, Hash, ArrowUp, ArrowDown, FileText } from 'lucide-react'

const DashboardStats: React.FC = () => {
  const stats = [
    {
      name: 'AI 可見度分數',
      value: '78',
      unit: '',
      change: '12% 本週提升',
      changeType: 'increase' as const,
      icon: Eye,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      name: '品牌提及次數',
      value: '1,284',
      unit: '',
      change: '8.3% 增長',
      changeType: 'increase' as const,
      icon: Target,
      color: 'from-green-500 to-teal-600'
    },
    {
      name: '引用排名',
      value: '#3',
      unit: '',
      change: '上升 2 位',
      changeType: 'increase' as const,
      icon: Hash,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      name: '優化頁面',
      value: '156',
      unit: '',
      change: '24 待優化',
      changeType: 'decrease' as const,
      icon: FileText,
      color: 'from-orange-500 to-red-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div 
            key={stat.name} 
            className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 hover:border-indigo-500/50 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {stat.name}
              </span>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-slate-400 opacity-80" />
              </div>
            </div>
            
            <div className={`text-3xl font-bold mb-3 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </div>
            
            <div className="flex items-center space-x-1 text-sm">
              {stat.changeType === 'increase' ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500" />
              )}
              <span className={stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                {stat.change}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default DashboardStats