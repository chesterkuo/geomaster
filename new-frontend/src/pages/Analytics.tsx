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
  Calendar
} from "lucide-react";

const Analytics = () => {
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
          </TabsContent>

          <TabsContent value="traffic">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>流量趨勢分析</CardTitle>
                <CardDescription>詳細的網站流量數據和趨勢</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>流量分析圖表將顯示在這裡</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>用戶行為分析</CardTitle>
                <CardDescription>分析用戶在網站上的互動模式</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <MousePointer className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>用戶行為分析數據將顯示在這裡</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversion">
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
          </TabsContent>

          <TabsContent value="reports">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>自動化報告</CardTitle>
                <CardDescription>設定和管理您的分析報告</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg bg-gradient-subtle">
                      <div className="flex items-center space-x-4">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">週報 #{i}</h4>
                          <p className="text-sm text-muted-foreground">每週一自動發送</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">啟用中</Badge>
                        <Button variant="outline" size="sm">編輯</Button>
                        <Button size="sm">立即發送</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;