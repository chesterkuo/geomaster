import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from "react";
import { dashboardService, DashboardStats } from "@/lib/api/dashboard";
import { useTranslation } from "react-i18next";

interface ChartSectionProps {
  isAuthenticated?: boolean;
}

export const ChartSection = ({ isAuthenticated = false }: ChartSectionProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate trend data based on selected time range
  const getTrendData = () => {
    if (!isAuthenticated || !dashboardData) {
      return Array(7).fill(null).map((_, i) => ({
        name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        value: 0
      }));
    }

    // Different data patterns for different time ranges
    const dataPatterns = {
      '7d': [
        { name: t("common.monday", "Mon"), value: 45 },
        { name: t("common.tuesday", "Tue"), value: 52 },
        { name: t("common.wednesday", "Wed"), value: 48 },
        { name: t("common.thursday", "Thu"), value: 61 },
        { name: t("common.friday", "Fri"), value: 55 },
        { name: t("common.saturday", "Sat"), value: 67 },
        { name: t("common.sunday", "Sun"), value: 58 },
      ],
      '30d': [
        { name: 'Week 1', value: 42 },
        { name: 'Week 2', value: 58 },
        { name: 'Week 3', value: 65 },
        { name: 'Week 4', value: 73 },
      ],
      '90d': [
        { name: 'Month 1', value: 35 },
        { name: 'Month 2', value: 48 },
        { name: 'Month 3', value: 62 },
      ]
    };

    return dataPatterns[timeRange];
  };

  const trendData = getTrendData();

  // Get platform data from API
  const pieData = isAuthenticated && dashboardData ? 
    dashboardData.platformDistribution.map((platform, index) => ({
      name: platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1),
      value: platform.mentions,
      color: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][index % 4]
    })) : [
      { name: 'ChatGPT', value: 0, color: '#8b5cf6' },
      { name: 'Gemini', value: 0, color: '#3b82f6' },
      { name: 'Perplexity', value: 0, color: '#10b981' },
    ];

  const overallScore = isAuthenticated && dashboardData ? 
    dashboardData.overview.averageGeoScore : 0;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* AI Platform Visibility Trend */}
      <Card className="lg:col-span-2 p-6 bg-gradient-card border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">{t("dashboard.aiPlatformVisibilityTrend")}</h3>
          <div className="flex space-x-2">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                console.log('🔄 Dashboard time range changed to: 7d');
                setTimeRange('7d');
              }}
            >
              {t("dashboard.7days", "7 days")}
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                console.log('🔄 Dashboard time range changed to: 30d');
                setTimeRange('30d');
              }}
            >
              {t("dashboard.30days", "30 days")}
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                console.log('🔄 Dashboard time range changed to: 90d');
                setTimeRange('90d');
              }}
            >
              {t("dashboard.90days", "90 days")}
            </Button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--geo-purple))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--geo-purple))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--geo-purple))', strokeWidth: 2, fill: 'hsl(var(--geo-purple))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* AI Scores */}
      <Card className="p-6 bg-gradient-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-6">{t("dashboard.aiComprehensiveScore")}</h3>
        
        <div className="relative w-48 h-48 mx-auto mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[{ value: overallScore }, { value: isAuthenticated ? 22 : 100 }]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={450}
                dataKey="value"
              >
                <Cell fill="hsl(var(--geo-purple))" />
                <Cell fill="hsl(var(--border))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{isAuthenticated ? '78' : '---'}</div>
              <div className="text-sm text-muted-foreground">{t("dashboard.overallScore")}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{isAuthenticated ? item.value : '---'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};