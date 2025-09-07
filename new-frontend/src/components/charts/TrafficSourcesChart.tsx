import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TrafficSource {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface TrafficSourcesChartProps {
  data: {
    organic: number;
    direct: number;
    social: number;
    referral: number;
    email: number;
    paid: number;
  };
  loading?: boolean;
}

const TrafficSourcesChart = ({ data, loading }: TrafficSourcesChartProps) => {
  if (loading) {
    return (
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>流量來源</CardTitle>
          <CardDescription>訪客來源分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const total = Object.values(data).reduce((sum, value) => sum + value, 0);

  const chartData: TrafficSource[] = [
    {
      name: '自然搜尋',
      value: data.organic,
      percentage: (data.organic / total) * 100,
      color: '#3b82f6'
    },
    {
      name: '直接流量',
      value: data.direct,
      percentage: (data.direct / total) * 100,
      color: '#10b981'
    },
    {
      name: '社群媒體',
      value: data.social,
      percentage: (data.social / total) * 100,
      color: '#8b5cf6'
    },
    {
      name: '推薦流量',
      value: data.referral,
      percentage: (data.referral / total) * 100,
      color: '#f59e0b'
    },
    {
      name: '電子郵件',
      value: data.email,
      percentage: (data.email / total) * 100,
      color: '#ef4444'
    },
    {
      name: '付費廣告',
      value: data.paid,
      percentage: (data.paid / total) * 100,
      color: '#06b6d4'
    }
  ].filter(item => item.value > 0);

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            訪客數: {formatNumber(data.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            佔比: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>流量來源分佈</CardTitle>
          <CardDescription>各渠道流量占比</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>流量來源詳情</CardTitle>
          <CardDescription>各渠道具體數據</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData
              .sort((a, b) => b.percentage - a.percentage)
              .map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-sm font-medium">{source.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {formatNumber(source.value)}
                    </span>
                    <div className="w-20">
                      <Progress value={source.percentage} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {source.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
          
          <div className="mt-6 p-4 bg-gradient-subtle border border-border rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">總訪客數</span>
              <span className="font-semibold text-primary">
                {formatNumber(total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficSourcesChart;