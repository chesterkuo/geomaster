import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Globe, Users, Hash, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { dashboardService, DashboardStats } from "@/lib/api/dashboard";
import { MobileMetricCard, MobileMetricsGrid, useBreakpoint } from "@/components/mobile";
import { useTranslation } from "react-i18next";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const MetricCard = ({ title, value, change, trend, icon: Icon, color }: MetricCardProps) => {
  return (
    <Card className="p-6 bg-gradient-card border-border hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
          color,
          "group-hover:scale-110"
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className={cn(
          "flex items-center space-x-1 text-sm font-medium",
          trend === "up" ? "text-geo-green" : "text-destructive"
        )}>
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>{change}</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </Card>
  );
};

interface MetricsGridProps {
  isAuthenticated?: boolean;
}

export const MetricsGrid = ({ isAuthenticated = false }: MetricsGridProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { isMobile } = useBreakpoint();
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

  const metrics = [
    {
      title: t("dashboard.aiVisibilityScore"),
      value: isAuthenticated ? (loading ? "..." : dashboardData?.overview.averageGeoScore?.toString() || "---") : "---",
      change: isAuthenticated ? (loading ? t("common.loading") : t("dashboard.weeklyIncrease", "↑ 12% this week")) : t("dashboard.loginRequired"),
      trend: "up" as const,
      icon: BarChart3,
      color: "bg-geo-purple"
    },
    {
      title: t("dashboard.brandMentions"),
      value: isAuthenticated ? (loading ? "..." : dashboardData?.overview.totalMentions?.toLocaleString() || "---") : "---",
      change: isAuthenticated ? (loading ? t("common.loading") : t("dashboard.monthlyIncrease", "↑ 8.3% vs last month")) : t("dashboard.loginRequired"),
      trend: "up" as const,
      icon: Globe,
      color: "bg-geo-blue"
    },
    {
      title: t("dashboard.totalWebsites"),
      value: isAuthenticated ? (loading ? "..." : dashboardData?.overview.totalWebsites?.toString() || "---") : "---",
      change: isAuthenticated ? (loading ? t("common.loading") : t("dashboard.upwardTrend", "↑ Upward trend")) : t("dashboard.loginRequired"),
      trend: "up" as const,
      icon: Hash,
      color: "bg-geo-green"
    },
    {
      title: t("dashboard.totalScans"),
      value: isAuthenticated ? (loading ? "..." : dashboardData?.overview.totalScans?.toString() || "---") : "---",
      change: isAuthenticated ? (loading ? t("common.loading") : t("dashboard.steadyGrowth", "↑ Steady growth")) : t("dashboard.loginRequired"),
      trend: "up" as const,
      icon: Users,
      color: "bg-geo-orange"
    }
  ];

  if (isMobile) {
    return (
      <MobileMetricsGrid>
        {metrics.map((metric, index) => (
          <MobileMetricCard 
            key={index} 
            {...metric}
            onTap={() => console.log(`Tapped ${metric.title}`)}
          />
        ))}
      </MobileMetricsGrid>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};