import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, Settings, Plus, Play, Activity, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { alertsApi, AlertConfiguration, AlertHistory, AlertDashboard } from '@/lib/api/alerts';
import { useWebSocketAlerts } from '@/hooks/use-websocket-alerts';
import AlertConfigurationList from '@/components/alerts/AlertConfigurationList';
import AlertHistoryList from '@/components/alerts/AlertHistoryList';
import CreateAlertDialog from '@/components/alerts/CreateAlertDialog';
import AlertDashboardStats from '@/components/alerts/AlertDashboardStats';
import RealTimeAlertFeed from '@/components/alerts/RealTimeAlertFeed';

export default function Alerts() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // WebSocket connection for real-time alerts
  const {
    isConnected,
    connectionStatus,
    recentAlerts,
    error: wsError,
    connect: connectWs,
    disconnect: disconnectWs
  } = useWebSocketAlerts({
    showToasts: true,
    onAlert: (alert) => {
      // Refresh alert history when new alerts are received
      queryClient.invalidateQueries({ queryKey: ['alerts', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'dashboard'] });
    }
  });

  // Fetch alert dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['alerts', 'dashboard'],
    queryFn: async () => {
      const response = await alertsApi.getAlertDashboard();
      return response.data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch alert configurations
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', 'configurations'],
    queryFn: async () => {
      const response = await alertsApi.getAlerts();
      return response.data;
    }
  });

  // Fetch recent alert history
  const { data: alertHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['alerts', 'history'],
    queryFn: async () => {
      const response = await alertsApi.getAlertHistory({ 
        limit: 50,
        page: 1
      });
      return response.data;
    }
  });

  // Manual check trigger
  const manualCheckMutation = useMutation({
    mutationFn: alertsApi.triggerManualCheck,
    onSuccess: (data) => {
      toast.success(t('alerts.messages.manualCheckCompleted', { alertsChecked: data.data.alertsChecked, alertsTriggered: data.data.alertsTriggered }));
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: any) => {
      toast.error(t('alerts.messages.manualCheckFailed', { error: error.response?.data?.message || error.message }));
    }
  });

  // Manual metrics collection
  const collectMetricsMutation = useMutation({
    mutationFn: alertsApi.collectMetrics,
    onSuccess: (data) => {
      toast.success(t('alerts.messages.metricsCollectionCompleted', { websitesProcessed: data.data.websitesProcessed, snapshotsCreated: data.data.snapshotsCreated }));
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: any) => {
      toast.error(t('alerts.messages.metricsCollectionFailed', { error: error.response?.data?.message || error.message }));
    }
  });

  const handleCreateAlert = () => {
    setCreateDialogOpen(true);
  };

  const handleManualCheck = () => {
    manualCheckMutation.mutate({});
  };

  const handleCollectMetrics = () => {
    collectMetricsMutation.mutate({});
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">{t('alerts.title')}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getConnectionStatusIcon()}
                <span>
                  {t('alerts.realTime')}: {connectionStatus === 'connected' ? t('alerts.connected') : connectionStatus}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollectMetrics}
                disabled={collectMetricsMutation.isPending}
              >
                <Activity className="h-4 w-4 mr-2" />
                {t('alerts.collectMetrics')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualCheck}
                disabled={manualCheckMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                {t('alerts.checkAlerts')}
              </Button>
              <Button onClick={handleCreateAlert}>
                <Plus className="h-4 w-4 mr-2" />
                {t('alerts.createAlert')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('alerts.tabs.dashboard')}
            </TabsTrigger>
            <TabsTrigger value="configurations" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('alerts.tabs.configurations')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('alerts.tabs.history')}
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('alerts.tabs.realtime')}
              {recentAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {recentAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AlertDashboardStats 
              dashboard={dashboard} 
              isLoading={dashboardLoading}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['alerts', 'dashboard'] })}
            />
          </TabsContent>

          <TabsContent value="configurations">
            <AlertConfigurationList
              alerts={alerts}
              isLoading={alertsLoading}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['alerts', 'configurations'] })}
            />
          </TabsContent>

          <TabsContent value="history">
            <AlertHistoryList
              history={alertHistory}
              isLoading={historyLoading}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['alerts', 'history'] })}
            />
          </TabsContent>

          <TabsContent value="realtime">
            <RealTimeAlertFeed
              alerts={recentAlerts}
              connectionStatus={connectionStatus}
              wsError={wsError}
              onReconnect={connectWs}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Alert Dialog */}
      <CreateAlertDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
          toast.success(t('alerts.messages.alertCreated'));
        }}
      />
    </div>
  );
}