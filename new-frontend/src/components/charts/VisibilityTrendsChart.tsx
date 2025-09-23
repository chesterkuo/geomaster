import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { VisibilityTrend } from '@/lib/api/visibility';

interface VisibilityTrendsChartProps {
  data: VisibilityTrend[];
  title?: string;
  description?: string;
  className?: string;
  chartType?: 'line' | 'area';
}

const chartConfig: ChartConfig = {
  chatgpt: {
    label: 'ChatGPT',
    color: '#10b981',
  },
  perplexity: {
    label: 'Perplexity',
    color: '#8b5cf6',
  },
  gemini: {
    label: 'Gemini',
    color: '#3b82f6',
  },
  claude: {
    label: 'Claude',
    color: '#f59e0b',
  },
};

export const VisibilityTrendsChart: React.FC<VisibilityTrendsChartProps> = ({
  data,
  title = "可見度趨勢",
  description = "各 AI 平台的可見度變化趨勢",
  className,
  chartType = 'line',
}) => {
  // Calculate summary statistics
  const calculateTrend = (platform: keyof VisibilityTrend) => {
    if (data.length < 2) return null;
    const first = data[0][platform];
    const last = data[data.length - 1][platform];
    
    // Safe calculation to prevent division by zero and infinity
    let change = 0;
    if (first === 0 && last === 0) {
      change = 0; // No change if both are zero
    } else if (first === 0 && last > 0) {
      change = 100; // Show 100% increase when starting from zero
    } else if (first > 0) {
      change = ((last - first) / first) * 100;
    }
    
    // Ensure change is finite and reasonable
    if (!Number.isFinite(change)) {
      change = 0;
    }
    
    return {
      value: last,
      change: Math.round(change),
      direction: change >= 0 ? 'up' : 'down',
    };
  };

  const trends = {
    chatgpt: calculateTrend('chatgpt'),
    perplexity: calculateTrend('perplexity'),
    gemini: calculateTrend('gemini'),
    claude: calculateTrend('claude'),
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {Object.entries(trends).map(([platform, trend]) => {
              if (!trend) return null;
              const config = chartConfig[platform as keyof ChartConfig];
              return (
                <Badge 
                  key={platform} 
                  variant="outline" 
                  className="text-xs"
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-1" 
                    style={{ backgroundColor: config?.color }}
                  />
                  {config?.label}: {trend.value}%
                  {trend.direction === 'up' ? (
                    <TrendingUp className="w-3 h-3 ml-1 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 ml-1 text-red-500" />
                  )}
                  <span className={trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}>
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </span>
                </Badge>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          {chartType === 'area' ? (
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent 
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('zh-TW', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    });
                  }}
                  formatter={(value) => [`${value}%`, '']}
                />} 
              />
              <Area
                type="monotone"
                dataKey="chatgpt"
                stackId="1"
                stroke={chartConfig.chatgpt.color}
                fill={chartConfig.chatgpt.color}
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="perplexity"
                stackId="1"
                stroke={chartConfig.perplexity.color}
                fill={chartConfig.perplexity.color}
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="gemini"
                stackId="1"
                stroke={chartConfig.gemini.color}
                fill={chartConfig.gemini.color}
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="claude"
                stackId="1"
                stroke={chartConfig.claude.color}
                fill={chartConfig.claude.color}
                fillOpacity={0.8}
              />
            </AreaChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent 
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('zh-TW', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    });
                  }}
                  formatter={(value) => [`${value}%`, '']}
                />} 
              />
              <Line
                type="monotone"
                dataKey="chatgpt"
                stroke={chartConfig.chatgpt.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.chatgpt.color, strokeWidth: 0, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="perplexity"
                stroke={chartConfig.perplexity.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.perplexity.color, strokeWidth: 0, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="gemini"
                stroke={chartConfig.gemini.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.gemini.color, strokeWidth: 0, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="claude"
                stroke={chartConfig.claude.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.claude.color, strokeWidth: 0, r: 4 }}
              />
            </LineChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
};