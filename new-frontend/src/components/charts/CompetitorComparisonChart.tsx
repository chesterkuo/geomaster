import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { CompetitorMetrics } from '@/lib/api/competitors';

interface CompetitorComparisonChartProps {
  data: (CompetitorMetrics & { isYourBrand?: boolean; marketShare?: number; })[];
  title?: string;
  description?: string;
  className?: string;
  chartType?: 'bar' | 'radar';
}

const chartConfig: ChartConfig = {
  geoScore: {
    label: 'GEO 分數',
    color: '#3b82f6',
  },
  visibilityScore: {
    label: '可見度分數',
    color: '#10b981',
  },
  mentionCount: {
    label: '提及數量',
    color: '#8b5cf6',
  },
  sentimentScore: {
    label: '情感分數',
    color: '#f59e0b',
  },
  marketShare: {
    label: '市場份額',
    color: '#ef4444',
  },
};

export const CompetitorComparisonChart: React.FC<CompetitorComparisonChartProps> = ({
  data,
  title = "競爭對手比較",
  description = "與競爭對手的綜合表現對比",
  className,
  chartType = 'bar',
}) => {
  // Prepare data for bar chart
  const barChartData = data.map(competitor => ({
    name: competitor.name.length > 12 ? competitor.name.substring(0, 12) + '...' : competitor.name,
    fullName: competitor.name,
    geoScore: competitor.metrics.geoScore,
    visibilityScore: competitor.metrics.visibilityScore,
    mentionCount: competitor.metrics.mentionCount,
    sentimentScore: competitor.metrics.sentimentScore,
    marketShare: competitor.marketShare || 0,
    isYourBrand: competitor.isYourBrand,
    domain: competitor.domain,
  }));

  // Prepare data for radar chart
  const radarData = [
    { metric: 'GEO 分數', ...Object.fromEntries(data.map(c => [c.name, c.metrics.geoScore])) },
    { metric: '可見度', ...Object.fromEntries(data.map(c => [c.name, c.metrics.visibilityScore])) },
    { metric: '提及量', ...Object.fromEntries(data.map(c => [c.name, Math.min(c.metrics.mentionCount / 10, 100)])) }, // Scale down for radar
    { metric: '情感', ...Object.fromEntries(data.map(c => [c.name, c.metrics.sentimentScore])) },
    { metric: '技術', ...Object.fromEntries(data.map(c => [c.name, c.metrics.technicalScore])) },
    { metric: '內容', ...Object.fromEntries(data.map(c => [c.name, c.metrics.contentScore])) },
  ];

  // Find top performer
  const topPerformer = data.reduce((top, current) => 
    current.metrics.geoScore > top.metrics.geoScore ? current : top
  );

  // Generate colors for competitors
  const competitorColors = data.map((competitor, index) => {
    if (competitor.isYourBrand) return '#3b82f6'; // Blue for your brand
    const colors = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280', '#ec4899'];
    return colors[index % colors.length];
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <div className="font-medium mb-2">
            {data.fullName || label}
            {data.isYourBrand && <Badge className="ml-2" variant="secondary">您的品牌</Badge>}
          </div>
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between gap-4">
                <span className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name === 'geoScore' && 'GEO 分數'}
                  {entry.name === 'visibilityScore' && '可見度分數'}
                  {entry.name === 'mentionCount' && '提及數量'}
                  {entry.name === 'sentimentScore' && '情感分數'}
                  {entry.name === 'marketShare' && '市場份額'}
                </span>
                <span className="font-medium">
                  {entry.name === 'marketShare' ? `${entry.value}%` : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const BarChartView = () => (
    <ChartContainer config={chartConfig}>
      <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip content={<CustomTooltip />} />
        <Bar dataKey="geoScore" name="GEO 分數" radius={4}>
          {barChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={competitorColors[index]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );

  const RadarChartView = () => (
    <ChartContainer config={chartConfig} className="h-[400px]">
      <RadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis 
          angle={60} 
          domain={[0, 100]} 
          tick={{ fontSize: 10 }}
          tickCount={6}
        />
        {data.map((competitor, index) => (
          <Radar
            key={competitor.competitorId}
            name={competitor.name}
            dataKey={competitor.name}
            stroke={competitorColors[index]}
            fill={competitorColors[index]}
            fillOpacity={competitor.isYourBrand ? 0.3 : 0.1}
            strokeWidth={competitor.isYourBrand ? 3 : 2}
          />
        ))}
        <ChartTooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                  <div className="font-medium mb-2">{label}</div>
                  <div className="space-y-1 text-sm">
                    {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex justify-between gap-4">
                        <span className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.name}
                        </span>
                        <span className="font-medium">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
      </RadarChart>
    </ChartContainer>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              {topPerformer && (
                <Badge variant="outline" className="text-xs">
                  <Trophy className="w-3 h-3 mr-1" />
                  領先: {topPerformer.name}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          
          {/* Performance indicators */}
          <div className="flex gap-2">
            {data.map((competitor) => (
              <Badge 
                key={competitor.competitorId}
                variant={competitor.isYourBrand ? "default" : "outline"}
                className="text-xs"
              >
                <div 
                  className="w-2 h-2 rounded-full mr-1" 
                  style={{ backgroundColor: competitorColors[data.indexOf(competitor)] }}
                />
                {competitor.name}: {competitor.metrics.geoScore}
                {competitor.trends.visibilityTrend !== undefined && (
                  <>
                    {competitor.trends.visibilityTrend >= 0 ? (
                      <TrendingUp className="w-3 h-3 ml-1 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 ml-1 text-red-500" />
                    )}
                  </>
                )}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bar">柱狀圖</TabsTrigger>
            <TabsTrigger value="radar">雷達圖</TabsTrigger>
          </TabsList>
          <TabsContent value="bar" className="mt-6">
            <BarChartView />
          </TabsContent>
          <TabsContent value="radar" className="mt-6">
            <RadarChartView />
          </TabsContent>
        </Tabs>

        {/* Summary statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gradient-subtle rounded-lg border border-border">
            <div className="text-lg font-bold">{data.length}</div>
            <div className="text-xs text-muted-foreground">競爭對手</div>
          </div>
          <div className="text-center p-3 bg-gradient-subtle rounded-lg border border-border">
            <div className="text-lg font-bold">
              {Math.round(data.reduce((sum, c) => sum + c.metrics.geoScore, 0) / data.length)}
            </div>
            <div className="text-xs text-muted-foreground">平均 GEO 分數</div>
          </div>
          <div className="text-center p-3 bg-gradient-subtle rounded-lg border border-border">
            <div className="text-lg font-bold">{topPerformer.metrics.geoScore}</div>
            <div className="text-xs text-muted-foreground">最高分數</div>
          </div>
          <div className="text-center p-3 bg-gradient-subtle rounded-lg border border-border">
            <div className="text-lg font-bold">
              {data.find(c => c.isYourBrand)?.metrics.geoScore || 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">您的分數</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};