import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Globe, Users, Hash, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const metrics = [
    {
      title: "AI 可見度分數",
      value: isAuthenticated ? "78" : "---",
      change: isAuthenticated ? "↑ 12% 本週提升" : "需要登入查看",
      trend: "up" as const,
      icon: BarChart3,
      color: "bg-geo-purple"
    },
    {
      title: "品牌曝及次數",
      value: isAuthenticated ? "1,284" : "---",
      change: isAuthenticated ? "↑ 8.3% 較上月" : "需要登入查看",
      trend: "up" as const,
      icon: Globe,
      color: "bg-geo-blue"
    },
    {
      title: "引用排名",
      value: isAuthenticated ? "#3" : "---",
      change: isAuthenticated ? "↑ 上升 2 位" : "需要登入查看",
      trend: "up" as const,
      icon: Hash,
      color: "bg-geo-green"
    },
    {
      title: "優化提醒",
      value: isAuthenticated ? "156" : "---",
      change: isAuthenticated ? "↓ 24 項減少" : "需要登入查看",
      trend: "down" as const,
      icon: Users,
      color: "bg-geo-orange"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};