import React from 'react'
import { TrendingUp } from 'lucide-react'

const VisibilityChart: React.FC = () => {
  // Mock data for the chart
  const chartData = [
    { month: 'Jan', chatgpt: 65, gemini: 45, perplexity: 35, claude: 25 },
    { month: 'Feb', chatgpt: 70, gemini: 50, perplexity: 40, claude: 30 },
    { month: 'Mar', chatgpt: 75, gemini: 55, perplexity: 45, claude: 35 },
    { month: 'Apr', chatgpt: 80, gemini: 60, perplexity: 50, claude: 40 },
    { month: 'May', chatgpt: 85, gemini: 65, perplexity: 55, claude: 45 },
    { month: 'Jun', chatgpt: 90, gemini: 70, perplexity: 60, claude: 50 }
  ]

  const platforms = [
    { name: 'ChatGPT', color: 'bg-blue-500', value: 90 },
    { name: 'Gemini', color: 'bg-green-500', value: 70 },
    { name: 'Perplexity', color: 'bg-purple-500', value: 60 },
    { name: 'Claude', color: 'bg-orange-500', value: 50 }
  ]

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">AI 平台可見度趨勢</h3>
          <p className="text-slate-400 text-sm">過去 6 個月的表現</p>
        </div>
        <div className="flex items-center space-x-2 text-green-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">+12.5%</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-64 mb-6">
        <div className="absolute inset-0 flex items-end space-x-4">
          {chartData.map((data) => (
            <div key={data.month} className="flex-1 flex flex-col items-center">
              <div className="relative w-full h-48 bg-slate-700 rounded-t-lg overflow-hidden">
                {platforms.map((platform) => {
                  const height = (data[platform.name.toLowerCase() as keyof typeof data] as number) / 100 * 192
                  return (
                    <div
                      key={platform.name}
                      className={`absolute bottom-0 left-0 w-full ${platform.color} opacity-70`}
                      style={{
                        height: `${height}px`,
                        transform: `translateY(${192 - height}px)`
                      }}
                    />
                  )
                })}
              </div>
              <span className="text-slate-400 text-xs mt-2">{data.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6">
        {platforms.map((platform) => (
          <div key={platform.name} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${platform.color}`} />
            <span className="text-slate-300 text-sm">{platform.name}</span>
            <span className="text-slate-400 text-sm">({platform.value}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default VisibilityChart