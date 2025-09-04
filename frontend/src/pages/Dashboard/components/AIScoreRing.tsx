import React from 'react'
import { Target, TrendingUp } from 'lucide-react'

const AIScoreRing: React.FC = () => {
  const score = 78
  const previousScore = 65
  const improvement = score - previousScore

  // Calculate ring progress
  const circumference = 2 * Math.PI * 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">GEO 總分</h3>
          <p className="text-slate-400 text-sm mt-1">AI 搜尋優化評分</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 bg-opacity-10 flex items-center justify-center">
          <Target className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      {/* Score Ring */}
      <div className="relative w-36 h-36 mx-auto mb-6">
        <svg className="transform -rotate-90 w-full h-full">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx="72"
            cy="72"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="text-blue-400"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-slate-400 text-sm">/ 100</span>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-sm">較上月</span>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">+{improvement}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">內容品質</span>
            <span className="text-slate-300 text-xs">85/100</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-blue-400 h-2 rounded-full" style={{ width: '85%' }} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">AI 可見度</span>
            <span className="text-slate-300 text-xs">72/100</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-green-400 h-2 rounded-full" style={{ width: '72%' }} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">技術優化</span>
            <span className="text-slate-300 text-xs">68/100</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-purple-400 h-2 rounded-full" style={{ width: '68%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIScoreRing