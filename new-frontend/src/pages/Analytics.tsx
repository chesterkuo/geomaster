import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  MousePointer,
  Smartphone,
  Monitor,
  Globe,
  Download,
  Calendar,
  Lock,
  User,
  Loader2,
  Activity
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth/AuthModal";
import { ReportLibrary } from "@/components/reports/ReportLibrary";
import RealTimeStats from "@/components/charts/RealTimeStats";
import TrafficTrendsChart from "@/components/charts/TrafficTrendsChart";
import TrafficSourcesChart from "@/components/charts/TrafficSourcesChart";
import DeviceBreakdownChart from "@/components/charts/DeviceBreakdownChart";
import PerformanceChart from "@/components/charts/PerformanceChart";
import { analyticsService } from "@/lib/api/analytics";
import { websiteService, Website } from "@/lib/api/websites";
import { toast } from "sonner";

const Analytics = () => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7d');

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedWebsiteId) {
      loadAnalyticsData();
    }
  }, [selectedWebsiteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const websitesRes = await websiteService.getList();
      
      if (websitesRes.success && websitesRes.data.websites.length > 0) {
        setWebsites(websitesRes.data.websites);
        setSelectedWebsiteId(websitesRes.data.websites[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load websites');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    if (!selectedWebsiteId) return;
    
    try {
      setLoading(true);
      const dashboardRes = await analyticsService.getDashboard(selectedWebsiteId);
      
      if (dashboardRes.success) {
        setAnalyticsData(dashboardRes.data);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Real-time data with API data integration
  const realTimeData = {
    activeUsers: analyticsData?.realtimeUsers || 0,
    pagesPerSecond: 0,
    bounceRate: analyticsData?.overview?.bounceRate || 0,
    avgSessionDuration: analyticsData?.overview?.averageSessionDuration || '0:00',
    topPages: analyticsData?.topPages?.slice(0, 5)?.map((page: any) => ({
      path: page.path,
      activeUsers: page.views
    })) || [],
    topCountries: [],
    recentEvents: []
  };

  // Calculate traffic sources from API data
  const calculateTrafficSources = () => {
    if (!analyticsData?.trafficSources) return [];
    
    const sources = analyticsData.trafficSources;
    const total = sources.organic + sources.direct + sources.social + sources.referral + sources.email + sources.paid;
    
    if (total === 0) return [];
    
    return [
      { 
        source: "自然搜尋", 
        percentage: (sources.organic / total) * 100, 
        visitors: sources.organic.toLocaleString(), 
        color: "bg-blue-500" 
      },
      { 
        source: "直接流量", 
        percentage: (sources.direct / total) * 100, 
        visitors: sources.direct.toLocaleString(), 
        color: "bg-green-500" 
      },
      { 
        source: "社群媒體", 
        percentage: (sources.social / total) * 100, 
        visitors: sources.social.toLocaleString(), 
        color: "bg-purple-500" 
      },
      { 
        source: "推薦流量", 
        percentage: (sources.referral / total) * 100, 
        visitors: sources.referral.toLocaleString(), 
        color: "bg-yellow-500" 
      },
      { 
        source: "Email", 
        percentage: (sources.email / total) * 100, 
        visitors: sources.email.toLocaleString(), 
        color: "bg-indigo-500" 
      },
      { 
        source: "付費廣告", 
        percentage: (sources.paid / total) * 100, 
        visitors: sources.paid.toLocaleString(), 
        color: "bg-orange-500" 
      }
    ].filter(source => source.percentage > 0);
  };

  const trafficSources = calculateTrafficSources();

  const topPages = analyticsData?.topPages?.map((page: any) => ({
    page: page.path || '/',
    views: page.views?.toLocaleString() || '0',
    bounce: `${page.bounceRate || 0}%`,
    avgTime: page.avgTimeOnPage || '0:00'
  })) || [];

  // Calculate device stats from API data
  const calculateDeviceStats = () => {
    if (!analyticsData?.deviceBreakdown) return [];
    
    const devices = analyticsData.deviceBreakdown;
    const total = devices.desktop + devices.mobile + devices.tablet;
    
    if (total === 0) return [];
    
    return [
      { 
        device: "桌面電腦", 
        percentage: (devices.desktop / total) * 100, 
        icon: Monitor 
      },
      { 
        device: "手機", 
        percentage: (devices.mobile / total) * 100, 
        icon: Smartphone 
      },
      { 
        device: "平板", 
        percentage: (devices.tablet / total) * 100, 
        icon: Smartphone 
      }
    ].filter(device => device.percentage > 0);
  };

  const deviceStats = calculateDeviceStats();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">數據分析</h1>
            <p className="text-muted-foreground">深入了解您的網站表現和用戶行為</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              匯出報告
            </Button>
            <Button className="bg-primary text-primary-foreground shadow-glow">
              <Calendar className="mr-2 h-4 w-4" />
              排程報告
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">總覽</TabsTrigger>
            <TabsTrigger value="traffic">流量分析</TabsTrigger>
            <TabsTrigger value="behavior">用戶行為</TabsTrigger>
            <TabsTrigger value="conversion">轉換分析</TabsTrigger>
            <TabsTrigger value="reports">報告中心</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能查看數據總覽</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可查看詳細的網站分析數據和關鍵指標</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">總訪客數</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData?.overview?.uniqueVisitors?.toLocaleString() || '0'}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {(analyticsData?.overview?.growth?.visitors || 0) >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingUp className="mr-1 h-3 w-3 text-red-500 rotate-180" />
                    )}
                    {analyticsData?.overview?.growth?.visitors >= 0 ? '+' : ''}{analyticsData?.overview?.growth?.visitors || 0}% 較上週
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">頁面瀏覽</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData?.overview?.totalViews?.toLocaleString() || '0'}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {(analyticsData?.overview?.growth?.views || 0) >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingUp className="mr-1 h-3 w-3 text-red-500 rotate-180" />
                    )}
                    {analyticsData?.overview?.growth?.views >= 0 ? '+' : ''}{analyticsData?.overview?.growth?.views || 0}% 較上週
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">平均停留時間</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData?.overview?.averageSessionDuration || '0:00'}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {(analyticsData?.overview?.growth?.sessionDuration || 0) >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingUp className="mr-1 h-3 w-3 text-red-500 rotate-180" />
                    )}
                    {analyticsData?.overview?.growth?.sessionDuration >= 0 ? '+' : ''}{analyticsData?.overview?.growth?.sessionDuration || 0}% 較上週
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">跳出率</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData?.overview?.bounceRate?.toFixed(1) || '0.0'}%
                  </div>
                  <div className="flex items-center text-xs text-green-600">
                    {(analyticsData?.overview?.growth?.bounceRate || 0) <= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 rotate-180" />
                    ) : (
                      <TrendingUp className="mr-1 h-3 w-3 text-red-600" />
                    )}
                    {analyticsData?.overview?.growth?.bounceRate || 0}% 較上週
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle>流量來源</CardTitle>
                  <CardDescription>訪客來源分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trafficSources.map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${source.color}`} />
                          <span className="text-sm font-medium">{source.source}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-muted-foreground">{source.visitors}</span>
                          <div className="w-16">
                            <Progress value={source.percentage} className="h-2" />
                          </div>
                          <span className="text-sm font-medium">{source.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle>裝置類型</CardTitle>
                  <CardDescription>用戶使用裝置分布</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deviceStats.map((device, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <device.icon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{device.device}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-20">
                            <Progress value={device.percentage} className="h-2" />
                          </div>
                          <span className="text-sm font-medium">{device.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>熱門頁面</CardTitle>
                <CardDescription>最受歡迎的頁面統計</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-gradient-subtle">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-mono text-muted-foreground">#{index + 1}</span>
                        <div>
                          <span className="font-medium">{page.page}</span>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground">瀏覽: {page.views}</span>
                            <span className="text-xs text-muted-foreground">跳出率: {page.bounce}</span>
                            <span className="text-xs text-muted-foreground">停留: {page.avgTime}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        查看詳情
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="realtime" className="space-y-6">
            {!isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能查看即時數據</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可監控網站的即時訪客活動</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <RealTimeStats 
                data={realTimeData}
                loading={loading}
                connected={true}
                onRefresh={() => window.location.reload()}
                onTogglePause={() => console.log('Toggle pause')}
                isPaused={false}
              />
            )}
          </TabsContent>

          <TabsContent value="traffic">
            {!isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能查看流量分析</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可查看詳細的流量趨勢和來源分析</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <TrafficTrendsChart 
                  data={analyticsData?.trends || []} 
                  loading={loading}
                  period={selectedPeriod}
                  comparison={analyticsData?.comparison}
                />
                
                <TrafficSourcesChart 
                  data={analyticsData?.trafficSources || {
                    organic: 0,
                    direct: 0,
                    social: 0,
                    referral: 0,
                    email: 0,
                    paid: 0
                  }}
                  loading={loading}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="behavior">
            {!isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <MousePointer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能查看用戶行為</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可分析用戶在網站上的互動模式</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <DeviceBreakdownChart 
                  data={analyticsData?.deviceBreakdown || {
                    desktop: 0,
                    mobile: 0,
                    tablet: 0
                  }}
                  loading={loading}
                />
                
                <PerformanceChart 
                  data={analyticsData?.topPages || []}
                  loading={loading}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="conversion">
            {!isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能查看轉換分析</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可追蹤和分析關鍵轉換指標</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>轉換率分析</CardTitle>
                <CardDescription>追蹤和分析關鍵轉換指標</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border border-border rounded-lg bg-gradient-subtle text-center">
                    <div className="text-2xl font-bold text-primary">
                      {analyticsData?.conversion?.conversionRate ? 
                        `${analyticsData.conversion.conversionRate.toFixed(1)}%` : '0.0%'}
                    </div>
                    <p className="text-sm text-muted-foreground">整體轉換率</p>
                    <div className="flex items-center justify-center text-xs text-muted-foreground mt-1">
                      {(analyticsData?.conversion?.growth?.conversionRate || 0) >= 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingUp className="mr-1 h-3 w-3 text-red-500 rotate-180" />
                      )}
                      {analyticsData?.conversion?.growth?.conversionRate >= 0 ? '+' : ''}{analyticsData?.conversion?.growth?.conversionRate || 0}% 較上週
                    </div>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-gradient-subtle text-center">
                    <div className="text-2xl font-bold text-primary">
                      {analyticsData?.conversion?.totalConversions?.toLocaleString() || '0'}
                    </div>
                    <p className="text-sm text-muted-foreground">本月轉換數</p>
                    <div className="flex items-center justify-center text-xs text-muted-foreground mt-1">
                      {(analyticsData?.conversion?.growth?.totalConversions || 0) >= 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingUp className="mr-1 h-3 w-3 text-red-500 rotate-180" />
                      )}
                      {analyticsData?.conversion?.growth?.totalConversions >= 0 ? '+' : ''}{analyticsData?.conversion?.growth?.totalConversions || 0}% 較上週
                    </div>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-gradient-subtle text-center">
                    <div className="text-2xl font-bold text-primary">
                      ${analyticsData?.conversion?.conversionValue?.toLocaleString() || '0'}
                    </div>
                    <p className="text-sm text-muted-foreground">轉換價值</p>
                    <div className="flex items-center justify-center text-xs text-muted-foreground mt-1">
                      {(analyticsData?.conversion?.growth?.conversionValue || 0) >= 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingUp className="mr-1 h-3 w-3 text-red-500 rotate-180" />
                      )}
                      {analyticsData?.conversion?.growth?.conversionValue >= 0 ? '+' : ''}{analyticsData?.conversion?.growth?.conversionValue || 0}% 較上週
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </TabsContent>

          <TabsContent value="reports">
            {!isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能使用報告中心</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可設定和管理分析報告</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <ReportLibrary 
                onViewReport={(report) => {
                  // Handle report viewing
                  console.log('View report:', report);
                }}
                onUpdate={() => {
                  // Handle reports update
                  console.log('Reports updated');
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setLoading(false); // Reload complete after login
        }}
      />
    </DashboardLayout>
  );
};

export default Analytics;