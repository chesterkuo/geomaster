import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface PagePerformance {
  path: string;
  views: number;
  uniqueViews: number;
  bounceRate: number;
  avgTimeOnPage: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  change: number;
  status: 'good' | 'warning' | 'poor';
  target?: number;
}

interface PerformanceChartProps {
  data: PagePerformance[];
  metrics?: PerformanceMetric[];
  loading?: boolean;
}

const PerformanceChart = ({ data, metrics, loading }: PerformanceChartProps) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>頁面效能分析</CardTitle>
            <CardDescription>頂級頁面表現統計</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full bg-muted animate-pulse rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'good':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'poor':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Convert time string to minutes for visualization
  const convertTimeToMinutes = (timeStr: string): number => {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes + (seconds / 60);
  };

  const chartData = data.map(page => ({
    ...page,
    avgTimeInMinutes: convertTimeToMinutes(page.avgTimeOnPage)
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-4 shadow-lg min-w-[200px]">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}:</span>
              </div>
              <span className="font-medium text-foreground">
                {entry.dataKey === 'bounceRate' 
                  ? `${entry.value}%`
                  : entry.dataKey === 'avgTimeInMinutes'
                    ? `${entry.value.toFixed(1)} 分鐘`
                    : formatNumber(entry.value)
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="bg-gradient-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">{metric.name}</span>
                  {getStatusIcon(metric.status)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-foreground">
                    {formatNumber(metric.value)}
                  </div>
                  <div className="flex items-center gap-1">
                    {metric.change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {metric.target && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    目標: {formatNumber(metric.target)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>頁面效能對比</CardTitle>
          <CardDescription>各頁面訪問量與跳出率關係</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="path" 
                className="text-muted-foreground text-xs"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                yAxisId="left"
                className="text-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                className="text-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="views" 
                fill="#3b82f6" 
                name="瀏覽量"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                yAxisId="left"
                dataKey="uniqueViews" 
                fill="#10b981" 
                name="不重複瀏覽"
                radius={[2, 2, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="bounceRate" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="跳出率 (%)"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>熱門頁面詳情</CardTitle>
          <CardDescription>頁面效能完整統計</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data
              .sort((a, b) => b.views - a.views)
              .slice(0, 10)
              .map((page, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg bg-gradient-subtle hover:bg-gradient-card transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate max-w-md">
                        {page.path}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          瀏覽: <span className="text-foreground font-medium">{formatNumber(page.views)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          不重複: <span className="text-foreground font-medium">{formatNumber(page.uniqueViews)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          跳出率: <span className="text-foreground font-medium">{page.bounceRate}%</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          停留: <span className="text-foreground font-medium">{page.avgTimeOnPage}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={page.bounceRate > 60 ? "destructive" : page.bounceRate > 40 ? "secondary" : "default"}>
                      {page.bounceRate > 60 ? "需改進" : page.bounceRate > 40 ? "一般" : "良好"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      詳情
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceChart;