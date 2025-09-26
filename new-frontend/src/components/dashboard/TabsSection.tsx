import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Lock, User, Globe, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardService, DashboardStats } from "@/lib/api/dashboard";
import { useTranslation } from "react-i18next";

interface TabsSectionProps {
  isAuthenticated?: boolean;
  onShowAuth?: () => void;
}

export const TabsSection = ({ isAuthenticated = false, onShowAuth }: TabsSectionProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
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


  return (
    <Card className="p-6 bg-gradient-card border-border">
      <Tabs defaultValue="tracking" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-background/50">
            <TabsTrigger value="tracking" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t("dashboard.trackedWebsites")}
            </TabsTrigger>
            <TabsTrigger value="optimization" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t("dashboard.contentOptimization")}
            </TabsTrigger>
          </TabsList>
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
                <h4 className="text-lg font-medium text-foreground mb-2">{t("dashboard.loginToStartTracking")}</h4>
                <p className="text-sm mb-4">{t("dashboard.loginToViewTrackingDetails")}</p>
                <Button onClick={onShowAuth} className="bg-primary text-primary-foreground">
                  <User className="mr-2 h-4 w-4" />
                  {t("dashboard.loginNow")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
              ) : dashboardData?.topPerforming.length ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">{t("dashboard.topPerformingSites")}</h4>
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
                        <p className="text-xs text-muted-foreground">{website.mentions} {t("dashboard.mentions")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-medium text-foreground mb-2">{t("dashboard.startTrackingWebsites")}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{t("dashboard.addWebsiteUrlToMonitor")}</p>
                  <Button className="bg-primary text-primary-foreground">
                    {t("dashboard.addWebsite")}
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
                <h4 className="text-lg font-medium text-foreground mb-2">{t("dashboard.loginToStartOptimization")}</h4>
                <p className="text-sm mb-4">{t("dashboard.aiAnalyzeContent")}</p>
                <Button onClick={onShowAuth} className="bg-primary text-primary-foreground">
                  <User className="mr-2 h-4 w-4" />
                  {t("dashboard.loginNow")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
              ) : dashboardData?.recentActivity.length ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">{t("dashboard.recentActivity")}</h4>
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
                  <h4 className="text-lg font-medium text-foreground mb-2">{t("dashboard.contentOptimizationSuggestions")}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{t("dashboard.aiAnalyzeContentOptimize")}</p>
                  <Button className="bg-primary text-primary-foreground">
                    {t("dashboard.startOptimization")}
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