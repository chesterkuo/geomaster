import React from 'react'
import { TrendingUp, Eye, Target, Zap } from 'lucide-react'

const DashboardStats: React.FC = () => {
  const stats = [
    {
      name: 'AI 可見度分數',
      value: '78',
      unit: '/100',
      change: '+12%',
      changeType: 'increase',
      icon: Eye,
      color: 'text-blue-400'
    },
    {
      name: '優化內容數量',
      value: '45',
      unit: '頁',
      change: '+8',
      changeType: 'increase',
      icon: Zap,
      color: 'text-green-400'
    },
    {
      name: 'AI 平台提及',
      value: '123',
      unit: '次',
      change: '+23%',
      changeType: 'increase',
      icon: Target,
      color: 'text-purple-400'
    },
    {
      name: '流量成長',
      value: '34.2',
      unit: '%',
      change: '+5.4%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-orange-400'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.name} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">{stat.name}</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {stat.value}
                  <span className="text-sm font-normal text-slate-400 ml-1">{stat.unit}</span>
                </p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-slate-400 text-sm ml-1">vs 上月</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg bg-slate-700 ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default DashboardStats