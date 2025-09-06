import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  RefreshCw, 
  Bell,
  Activity,
  Zap,
  BarChart3
} from 'lucide-react';
import { AlertDashboard, AlertHistory } from '@/lib/api/alerts';
import { formatDistanceToNow } from 'date-fns';

interface AlertDashboardStatsProps {
  dashboard?: AlertDashboard;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function AlertDashboardStats({ dashboard, isLoading, onRefresh }: AlertDashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load dashboard data</p>
            <Button variant="outline" className="mt-2" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const successRate = dashboard.performanceStats?.notificationSuccessRate || 0;
  const totalNotifications = dashboard.triggeredToday + dashboard.failedNotifications;

  const alertTypeColors: Record<string, string> = {
    mention_spike: 'bg-green-500',
    visibility_drop: 'bg-red-500',
    competitor_outrank: 'bg-orange-500',
    score_change: 'bg-blue-500',
    new_mention: 'bg-purple-500',
    sentiment_change: 'bg-yellow-500'
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.activeAlerts} active configurations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Triggered Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{dashboard.triggeredToday}</div>
            <p className="text-xs text-muted-foreground">
              {totalNotifications > 0 ? `${Math.round((dashboard.triggeredToday / totalNotifications) * 100)}%` : '0%'} of notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Notifications</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{dashboard.failedNotifications}</div>
            <p className="text-xs text-muted-foreground">
              {totalNotifications > 0 ? `${Math.round((dashboard.failedNotifications / totalNotifications) * 100)}%` : '0%'} failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Alert Types Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Alert Types</CardTitle>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Distribution of alert types this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(dashboard.alertsByType || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${alertTypeColors[type] || 'bg-gray-500'}`}
                    />
                    <span className="text-sm capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {Object.keys(dashboard.alertsByType || {}).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No alerts triggered this week
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
            <CardDescription>System performance and reliability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Response Time</span>
              <Badge variant="outline">
                {dashboard.performanceStats?.averageResponseTime?.toFixed(0) || 0}ms
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Notification Success Rate</span>
              <Badge 
                variant={successRate >= 95 ? 'default' : successRate >= 85 ? 'secondary' : 'destructive'}
              >
                {successRate.toFixed(1)}%
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Most Triggered Alert</span>
              <Badge variant="outline" className="text-xs">
                {dashboard.performanceStats?.mostTriggeredAlert?.replace('_', ' ') || 'None'}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm">Active Configurations</span>
              <span className="font-medium">{dashboard.activeAlerts}/{dashboard.totalAlerts}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription>Latest triggered alerts and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard.recentAlerts && dashboard.recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentAlerts.slice(0, 5).map((alert: AlertHistory) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {alert.notificationStatus === 'sent' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {alert.notificationStatus === 'failed' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {alert.notificationStatus === 'pending' && (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium capitalize">
                        {alert.alertType.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      alert.notificationStatus === 'sent' ? 'default' :
                      alert.notificationStatus === 'failed' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {alert.notificationStatus}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent alerts</p>
              <p className="text-sm text-muted-foreground mt-1">
                Alerts will appear here when they are triggered
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}