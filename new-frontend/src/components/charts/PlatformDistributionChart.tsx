import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlatformData {
  platform: string;
  value: number;
  percentage: number;
  change?: number;
}

interface PlatformDistributionChartProps {
  data: PlatformData[];
  title?: string;
  description?: string;
  className?: string;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
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

const platformColors: Record<string, string> = {
  chatgpt: '#10b981',
  perplexity: '#8b5cf6', 
  gemini: '#3b82f6',
  claude: '#f59e0b',
  others: '#6b7280',
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, name
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const PlatformDistributionChart: React.FC<PlatformDistributionChartProps> = ({
  data,
  title = "平台分佈",
  description = "各 AI 平台的提及率分佈",
  className,
  showLabels = true,
  innerRadius = 60,
  outerRadius = 100,
}) => {
  // Prepare data for chart
  const chartData = data.map(item => ({
    name: chartConfig[item.platform as keyof ChartConfig]?.label || item.platform,
    value: item.value,
    percentage: item.percentage,
    change: item.change,
    platform: item.platform,
  }));

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: platformColors[data.platform] || '#6b7280' }}
            />
            <span className="font-medium">{data.name}</span>
          </div>
          <div className="space-y-1 text-sm">
            <div>提及數: {data.value.toLocaleString()}</div>
            <div>佔比: {data.percentage.toFixed(1)}%</div>
            {data.change !== undefined && (
              <div className={data.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                變化: {data.change > 0 ? '+' : ''}{data.change}%
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">總提及數</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          {/* Chart */}
          <div className="flex-1">
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={showLabels ? renderCustomizedLabel : false}
                  outerRadius={outerRadius}
                  innerRadius={innerRadius}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={platformColors[entry.platform] || '#6b7280'} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ChartContainer>
          </div>

          {/* Legend with statistics */}
          <div className="space-y-4 min-w-[200px]">
            <div className="space-y-3">
              {chartData.map((item) => (
                <div key={item.platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: platformColors[item.platform] || '#6b7280' }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{item.percentage.toFixed(1)}%</div>
                    {item.change !== undefined && (
                      <div className={`text-xs ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.change > 0 ? '+' : ''}{item.change}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Performance badges */}
            <div className="pt-4 border-t border-border">
              <div className="space-y-2">
                {data.map((item) => (
                  <Badge 
                    key={item.platform}
                    variant={item.change && item.change > 0 ? "default" : "secondary"}
                    className="w-full justify-between text-xs"
                  >
                    <span>{chartConfig[item.platform as keyof ChartConfig]?.label || item.platform}</span>
                    <span>{item.value.toLocaleString()}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};