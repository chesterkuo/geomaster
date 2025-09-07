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
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth/AuthModal";
import { ReportLibrary } from "@/components/reports/ReportLibrary";

const Analytics = () => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const trafficSources = [
    { source: "自然搜尋", percentage: 45.2, visitors: "12,847", color: "bg-blue-500" },
    { source: "直接流量", percentage: 28.7, visitors: "8,162", color: "bg-green-500" },
    { source: "社群媒體", percentage: 15.3, visitors: "4,351", color: "bg-purple-500" },
    { source: "付費廣告", percentage: 7.8, visitors: "2,218", color: "bg-orange-500" },
    { source: "其他", percentage: 3.0, visitors: "854", color: "bg-gray-500" }
  ];

  const topPages = [
    { page: "/", views: "8,456", bounce: "24.3%", avgTime: "2:45" },
    { page: "/products", views: "6,231", bounce: "31.2%", avgTime: "3:12" },
    { page: "/blog/seo-tips", views: "4,875", bounce: "28.7%", avgTime: "4:23" },
    { page: "/about", views: "3,642", bounce: "45.6%", avgTime: "1:58" },
    { page: "/contact", views: "2,398", bounce: "52.1%", avgTime: "1:23" }
  ];

  const deviceStats = [
    { device: "桌面電腦", percentage: 52.3, icon: Monitor },
    { device: "手機", percentage: 41.2, icon: Smartphone },
    { device: "平板", percentage: 6.5, icon: Smartphone }
  ];

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
                  <div className="text-2xl font-bold">28,472</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    +12.5% 較上週
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">頁面瀏覽</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">84,721</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    +8.2% 較上週
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">平均停留時間</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2:47</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    +0:15 較上週
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">跳出率</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">31.2%</div>
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="mr-1 h-3 w-3 rotate-180" />
                    -2.8% 較上週
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
                data={realTimeData?.data ? {
                  activeUsers: realTimeData.data.realtimeUsers || 0,
                  pagesPerSecond: 2.4,
                  bounceRate: realTimeData.data.overview?.bounceRate || 0,
                  avgSessionDuration: realTimeData.data.overview?.averageSessionDuration || '0:00',
                  topPages: realTimeData.data.topPages?.slice(0, 5).map(page => ({
                    path: page.path,
                    activeUsers: Math.floor(Math.random() * 20) + 1
                  })) || [],
                  topCountries: [
                    { country: '台灣', activeUsers: 45 },
                    { country: '美國', activeUsers: 23 },
                    { country: '日本', activeUsers: 18 },
                    { country: '香港', activeUsers: 12 },
                    { country: '新加坡', activeUsers: 8 }
                  ],
                  recentEvents: [
                    { type: 'pageview' as const, path: '/', timestamp: new Date().toISOString(), country: '台灣' },
                    { type: 'session_start' as const, path: '/products', timestamp: new Date(Date.now() - 30000).toISOString(), country: '美國' },
                    { type: 'pageview' as const, path: '/about', timestamp: new Date(Date.now() - 60000).toISOString(), country: '日本' },
                  ]
                } : {
                  activeUsers: 0,
                  pagesPerSecond: 0,
                  bounceRate: 0,
                  avgSessionDuration: '0:00',
                  topPages: [],
                  topCountries: [],
                  recentEvents: []
                }}
                loading={realTimeLoading}
                connected={!realTimeError}
                onRefresh={handleRefresh}
                onTogglePause={() => setRealTimePaused(!realTimePaused)}
                isPaused={realTimePaused}
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
                  data={trends?.data?.trends || []} 
                  loading={isLoading}
                  period={selectedPeriod}
                  comparison={trends?.data?.comparison}
                />
                
                <TrafficSourcesChart 
                  data={dashboard?.data?.trafficSources || {
                    organic: 0,
                    direct: 0,
                    social: 0,
                    referral: 0,
                    email: 0,
                    paid: 0
                  }}
                  loading={isLoading}
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
                  data={dashboard?.data?.deviceBreakdown || {
                    desktop: 0,
                    mobile: 0,
                    tablet: 0
                  }}
                  loading={isLoading}
                />
                
                <PerformanceChart 
                  data={dashboard?.data?.topPages || []}
                  loading={isLoading}
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
                    <div className="text-2xl font-bold text-primary">3.2%</div>
                    <p className="text-sm text-muted-foreground">整體轉換率</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-gradient-subtle text-center">
                    <div className="text-2xl font-bold text-primary">912</div>
                    <p className="text-sm text-muted-foreground">本月轉換數</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-gradient-subtle text-center">
                    <div className="text-2xl font-bold text-primary">$45,280</div>
                    <p className="text-sm text-muted-foreground">轉換價值</p>
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