import React, { useState } from 'react'
import { TrendingUp } from 'lucide-react'

const VisibilityChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState('7天')
  
  const tabs = ['7 天', '30 天', '90 天']
  
  // Generate polyline points for the chart
  const generatePoints = (values: number[], maxHeight = 200) => {
    const width = 500
    const points = values.map((value, index) => {
      const x = 50 + (index * (width - 100) / (values.length - 1))
      const y = 250 - (value / 100) * maxHeight
      return `${x},${y}`
    }).join(' ')
    return points
  }

  const chartData = {
    chatgpt: [45, 50, 60, 70, 80, 90, 95],
    gemini: [35, 40, 50, 60, 70, 75, 80],
    perplexity: [25, 30, 40, 50, 60, 65, 70]
  }

  const platforms = [
    { name: 'ChatGPT', color: '#10B981', strokeColor: '#10B981', value: 95 },
    { name: 'Gemini', color: '#4F46E5', strokeColor: '#4F46E5', value: 80 },
    { name: 'Perplexity', color: '#F59E0B', strokeColor: '#F59E0B', value: 70 }
  ]

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">AI 平台可見度趨勢</h3>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-slate-900 rounded-xl p-4 mb-6 overflow-hidden">
        <svg className="w-full" viewBox="0 0 600 300" style={{ height: '300px' }}>
          {/* Grid lines */}
          <g stroke="#334155" strokeWidth="1" opacity="0.3">
            <line x1="50" y1="50" x2="550" y2="50" />
            <line x1="50" y1="100" x2="550" y2="100" />
            <line x1="50" y1="150" x2="550" y2="150" />
            <line x1="50" y1="200" x2="550" y2="200" />
            <line x1="50" y1="250" x2="550" y2="250" />
          </g>
          
          {/* ChatGPT Line */}
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            points={generatePoints(chartData.chatgpt)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Gemini Line */}
          <polyline
            fill="none"
            stroke="#4F46E5"
            strokeWidth="3"
            points={generatePoints(chartData.gemini)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Perplexity Line */}
          <polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth="3"
            points={generatePoints(chartData.perplexity)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* X-axis labels */}
          <text x="50" y="280" fill="#94A3B8" fontSize="12" textAnchor="middle">週一</text>
          <text x="133" y="280" fill="#94A3B8" fontSize="12" textAnchor="middle">週二</text>
          <text x="217" y="280" fill="#94A3B8" fontSize="12" textAnchor="middle">週三</text>
          <text x="300" y="280" fill="#94A3B8" fontSize="12" textAnchor="middle">週四</text>
          <text x="383" y="280" fill="#94A3B8" fontSize="12" textAnchor="middle">週五</text>
          <text x="467" y="280" fill="#94A3B8" fontSize="12" textAnchor="middle">週六</text>
          <text x="550" y="280" fill="#94A3B8" fontSize="12" textAnchor="middle">週日</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-8">
        {platforms.map((platform) => (
          <div key={platform.name} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: platform.color }}
            />
            <span className="text-slate-300 text-sm font-medium">{platform.name}</span>
            <span className="text-slate-400 text-sm">({platform.value}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default VisibilityChart