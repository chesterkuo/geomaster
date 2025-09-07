import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Activity, 
  Globe, 
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Pause,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RealTimeData {
  activeUsers: number;
  pagesPerSecond: number;
  bounceRate: number;
  avgSessionDuration: string;
  topPages: Array<{
    path: string;
    activeUsers: number;
  }>;
  topCountries: Array<{
    country: string;
    activeUsers: number;
  }>;
  recentEvents: Array<{
    type: 'pageview' | 'session_start' | 'conversion';
    path: string;
    timestamp: string;
    country?: string;
  }>;
}

interface RealTimeStatsProps {
  data: RealTimeData;
  loading?: boolean;
  connected?: boolean;
  onRefresh?: () => void;
  onTogglePause?: () => void;
  isPaused?: boolean;
}

const RealTimeStats = ({ 
  data, 
  loading, 
  connected = true, 
  onRefresh, 
  onTogglePause, 
  isPaused = false 
}: RealTimeStatsProps) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!isPaused && connected) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused, connected]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}秒前`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分鐘前`;
    const hours = Math.floor(minutes / 60);
    return `${hours}小時前`;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'pageview':
        return 'bg-blue-500';
      case 'session_start':
        return 'bg-green-500';
      case 'conversion':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventTypeName = (type: string) => {
    switch (type) {
      case 'pageview':
        return '頁面瀏覽';
      case 'session_start':
        return '新工作階段';
      case 'conversion':
        return '轉換事件';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>即時數據</CardTitle>
            <CardDescription>正在載入即時統計數據...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full bg-muted animate-pulse rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                即時數據
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  connected && !isPaused ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
              </CardTitle>
              <CardDescription>
                {connected ? (
                  isPaused ? "數據更新已暫停" : "即時監控網站活動"
                ) : (
                  "連接中斷"
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={connected ? "default" : "destructive"} className="gap-1">
                {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {connected ? "已連接" : "離線"}
              </Badge>
              <Button variant="outline" size="sm" onClick={onTogglePause} disabled={!connected}>
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? "繼續" : "暫停"}
              </Button>
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={!connected}>
                <RefreshCw className="w-4 h-4" />
                重新整理
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">線上用戶</p>
                <div className="text-2xl font-bold text-primary flex items-center gap-2">
                  {data.activeUsers}
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">頁面/秒</p>
                <div className="text-2xl font-bold text-primary">
                  {data.pagesPerSecond.toFixed(1)}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">跳出率</p>
                <div className="text-2xl font-bold text-primary">
                  {data.bounceRate.toFixed(1)}%
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">平均停留</p>
                <div className="text-2xl font-bold text-primary">
                  {data.avgSessionDuration}
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Pages */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>熱門頁面</CardTitle>
            <CardDescription>目前最多人瀏覽的頁面</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPages.slice(0, 5).map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {page.path}
                    </p>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {page.activeUsers}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>訪客地區</CardTitle>
            <CardDescription>目前線上用戶的地理分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topCountries.slice(0, 5).map((country, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {country.country}
                    </span>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {country.activeUsers}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>即時活動</CardTitle>
          <CardDescription>
            最近的用戶活動 • 更新於 {formatTimeAgo(lastUpdate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.recentEvents.slice(0, 20).map((event, index) => (
              <div key={index} className="flex items-center gap-3 p-2 hover:bg-gradient-subtle rounded-lg transition-colors">
                <div className={cn("w-2 h-2 rounded-full", getEventTypeColor(event.type))} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      {getEventTypeName(event.type)}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground truncate">
                      {event.path}
                    </span>
                    {event.country && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{event.country}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(new Date(event.timestamp))}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeStats;