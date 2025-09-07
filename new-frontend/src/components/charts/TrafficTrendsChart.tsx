import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatDate } from "date-fns";

interface TrafficData {
  date: string;
  views: number;
  visitors: number;
  sessions: number;
  bounceRate: number;
}

interface TrafficTrendsChartProps {
  data: TrafficData[];
  loading?: boolean;
  period?: string;
  comparison?: {
    viewsChange: number;
    visitorsChange: number;
    sessionsChange: number;
    bounceRateChange: number;
  };
}

const TrafficTrendsChart = ({ data, loading, period = "7d", comparison }: TrafficTrendsChartProps) => {
  const formatXAxisLabel = (tickItem: string) => {
    try {
      const date = new Date(tickItem);
      if (period === "7d") {
        return formatDate(date, "MM/dd");
      } else if (period === "30d") {
        return formatDate(date, "MM/dd");
      } else {
        return formatDate(date, "MMM");
      }
    } catch {
      return tickItem;
    }
  };

  const formatTooltipLabel = (label: string) => {
    try {
      const date = new Date(label);
      return formatDate(date, "yyyy-MM-dd");
    } catch {
      return label;
    }
  };

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
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">
            {formatTooltipLabel(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">
                {entry.name === '跳出率' ? `${entry.value}%` : formatNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>流量趨勢</CardTitle>
          <CardDescription>網站流量隨時間變化</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>流量趨勢</CardTitle>
            <CardDescription>網站流量隨時間變化</CardDescription>
          </div>
          {comparison && (
            <div className="flex flex-col items-end space-y-1">
              <div className="flex items-center text-sm">
                {comparison.viewsChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={comparison.viewsChange > 0 ? "text-green-600" : "text-red-600"}>
                  {comparison.viewsChange > 0 ? "+" : ""}{comparison.viewsChange.toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">瀏覽量</span>
              </div>
              <div className="flex items-center text-sm">
                {comparison.visitorsChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={comparison.visitorsChange > 0 ? "text-green-600" : "text-red-600"}>
                  {comparison.visitorsChange > 0 ? "+" : ""}{comparison.visitorsChange.toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">訪客數</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisLabel}
              className="text-muted-foreground text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-muted-foreground text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={formatNumber}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
              iconType="circle"
            />
            <Line 
              type="monotone" 
              dataKey="views" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              name="瀏覽量"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#3b82f6' }}
            />
            <Line 
              type="monotone" 
              dataKey="visitors" 
              stroke="#10b981" 
              strokeWidth={2} 
              name="訪客數"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#10b981' }}
            />
            <Line 
              type="monotone" 
              dataKey="sessions" 
              stroke="#8b5cf6" 
              strokeWidth={2} 
              name="工作階段"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#8b5cf6' }}
            />
            <Line 
              type="monotone" 
              dataKey="bounceRate" 
              stroke="#f59e0b" 
              strokeWidth={2} 
              name="跳出率"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#f59e0b' }}
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TrafficTrendsChart;