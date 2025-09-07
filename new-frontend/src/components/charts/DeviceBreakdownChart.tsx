import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Smartphone, Tablet } from "lucide-react";

interface DeviceData {
  desktop: number;
  mobile: number;
  tablet: number;
}

interface DeviceBreakdownChartProps {
  data: DeviceData;
  loading?: boolean;
}

const DeviceBreakdownChart = ({ data, loading }: DeviceBreakdownChartProps) => {
  if (loading) {
    return (
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>裝置類型分析</CardTitle>
          <CardDescription>用戶使用裝置分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const total = data.desktop + data.mobile + data.tablet;
  
  const chartData = [
    {
      name: '桌面電腦',
      value: data.desktop,
      percentage: (data.desktop / total) * 100,
      color: '#3b82f6',
      icon: Monitor
    },
    {
      name: '手機',
      value: data.mobile,
      percentage: (data.mobile / total) * 100,
      color: '#10b981',
      icon: Smartphone
    },
    {
      name: '平板',
      value: data.tablet,
      percentage: (data.tablet / total) * 100,
      color: '#8b5cf6',
      icon: Tablet
    }
  ];

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>裝置使用趨勢</CardTitle>
          <CardDescription>各裝置類型流量對比</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>裝置詳細統計</CardTitle>
          <CardDescription>各裝置具體數據</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {chartData
              .sort((a, b) => b.percentage - a.percentage)
              .map((device, index) => {
                const IconComponent = device.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg bg-gradient-subtle">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${device.color}20` }}
                      >
                        <IconComponent 
                          className="w-5 h-5"
                          style={{ color: device.color }}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{device.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(device.value)} 訪客
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-foreground">
                        {device.percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        流量佔比
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-6 p-4 bg-gradient-card border border-border rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">
                  {formatNumber(total)}
                </div>
                <div className="text-xs text-muted-foreground">總訪客</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">
                  {chartData.length}
                </div>
                <div className="text-xs text-muted-foreground">裝置類型</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">
                  {Math.max(...chartData.map(d => d.percentage)).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">最高佔比</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceBreakdownChart;