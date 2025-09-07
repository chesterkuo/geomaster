import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Lock, User, Globe, TrendingUp, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardService, DashboardStats } from "@/lib/api/dashboard";

interface TabsSectionProps {
  isAuthenticated?: boolean;
  onShowAuth?: () => void;
}

export const TabsSection = ({ isAuthenticated = false, onShowAuth }: TabsSectionProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <Card className="p-6 bg-gradient-card border-border">
      <Tabs defaultValue="tracking" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-background/50">
            <TabsTrigger value="tracking" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              精緻網站
            </TabsTrigger>
            <TabsTrigger value="optimization" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              優化內容
            </TabsTrigger>
            <TabsTrigger value="generation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              生成報告
            </TabsTrigger>
          </TabsList>
          
          <Button size="sm" className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            新增專案
          </Button>
        </div>

        <TabsContent value="tracking" className="space-y-4">
          {!isAuthenticated ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Lock className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">需要登入才能開始追蹤</h4>
                <p className="text-sm mb-4">登入後即可添加網站 URL 開始監控 AI 平台可見度</p>
                <Button onClick={onShowAuth} className="bg-primary text-primary-foreground">
                  <User className="mr-2 h-4 w-4" />
                  立即登入
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">載入中...</div>
              ) : dashboardData?.topPerforming.length ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">表現優異的網站</h4>
                  {dashboardData.topPerforming.map((website, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{website.name}</p>
                          <p className="text-xs text-muted-foreground">{website.url}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{website.geoScore}</p>
                        <p className="text-xs text-muted-foreground">{website.mentions} 提及</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-medium text-foreground mb-2">開始追蹤您的網站</h4>
                  <p className="text-sm text-muted-foreground mb-4">添加網站 URL 開始監控 AI 平台可見度</p>
                  <Button className="bg-primary text-primary-foreground">
                    新增網站
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          {!isAuthenticated ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Lock className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">需要登入才能開始優化</h4>
                <p className="text-sm mb-4">登入後 AI 就能分析您的內容並提供優化建議</p>
                <Button onClick={onShowAuth} className="bg-primary text-primary-foreground">
                  <User className="mr-2 h-4 w-4" />
                  立即登入
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">載入中...</div>
              ) : dashboardData?.recentActivity.length ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">最近的活動</h4>
                  {dashboardData.recentActivity.slice(0, 3).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg border">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-medium text-foreground mb-2">內容優化建議</h4>
                  <p className="text-sm text-muted-foreground mb-4">AI 分析您的內容並提供優化建議</p>
                  <Button className="bg-primary text-primary-foreground">
                    開始優化
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generation" className="space-y-4">
          {!isAuthenticated ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Lock className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">需要登入才能生成報告</h4>
                <p className="text-sm mb-4">登入後即可生成詳細的 AI 優化報告和行動計劃</p>
                <Button onClick={onShowAuth} className="bg-primary text-primary-foreground">
                  <User className="mr-2 h-4 w-4" />
                  立即登入
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">載入中...</div>
              ) : dashboardData?.alerts.length ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">警報與通知</h4>
                  {dashboardData.alerts.map((alert, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg border">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        alert.type === 'warning' ? 'bg-orange-100' : 'bg-blue-100'
                      }`}>
                        <FileText className={`h-4 w-4 ${
                          alert.type === 'warning' ? 'text-orange-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        alert.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {alert.severity === 'medium' ? '中等' : '低'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-medium text-foreground mb-2">AI 優化建議</h4>
                  <p className="text-sm text-muted-foreground mb-4">生成詳細的優化報告和行動計劃</p>
                  <Button className="bg-primary text-primary-foreground">
                    生成報告
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};