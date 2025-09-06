import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  TestTube,
  Globe,
  Clock,
  Bell,
  Settings,
  RefreshCw
} from 'lucide-react';
import { AlertConfiguration, alertsApi } from '@/lib/api/alerts';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import EditAlertDialog from './EditAlertDialog';
import DeleteAlertDialog from './DeleteAlertDialog';

interface AlertConfigurationListProps {
  alerts?: AlertConfiguration[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function AlertConfigurationList({ alerts, isLoading, onRefresh }: AlertConfigurationListProps) {
  const [editingAlert, setEditingAlert] = useState<AlertConfiguration | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<AlertConfiguration | null>(null);
  const queryClient = useQueryClient();

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => alertsApi.updateAlert(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'configurations'] });
      toast.success(`Alert "${variables.data.name || 'configuration'}" updated successfully`);
    },
    onError: (error: any) => {
      toast.error(`Failed to update alert: ${error.response?.data?.message || error.message}`);
    }
  });

  const testAlertMutation = useMutation({
    mutationFn: alertsApi.testAlert,
    onSuccess: (data) => {
      toast.success(data.data.message || 'Alert test completed successfully');
    },
    onError: (error: any) => {
      toast.error(`Alert test failed: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleToggleActive = async (alert: AlertConfiguration) => {
    updateAlertMutation.mutate({
      id: alert.id,
      data: { isActive: !alert.isActive }
    });
  };

  const handleTestAlert = (alertId: string) => {
    testAlertMutation.mutate(alertId);
  };

  const getAlertTypeColor = (alertType: string) => {
    const colors: Record<string, string> = {
      mention_spike: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      visibility_drop: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      competitor_outrank: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      score_change: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      new_mention: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      sentiment_change: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    return colors[alertType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getNotificationChannelIcons = (channels?: string[]) => {
    if (!channels) return null;
    
    const icons: Record<string, JSX.Element> = {
      email: <Bell className="h-3 w-3" />,
      websocket: <Globe className="h-3 w-3" />,
      slack: <Bell className="h-3 w-3" />,
      webhook: <Settings className="h-3 w-3" />
    };
    
    return channels.map(channel => (
      <span key={channel} className="inline-flex items-center gap-1 text-xs">
        {icons[channel]}
        {channel}
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No alert configurations</h3>
            <p className="text-muted-foreground mb-4">
              Create your first alert to monitor AI mentions and visibility changes
            </p>
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Alert Configurations</h2>
            <p className="text-sm text-muted-foreground">
              Manage your automated alert rules and conditions
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.isActive}
                        onCheckedChange={() => handleToggleActive(alert)}
                        disabled={updateAlertMutation.isPending}
                      />
                      <div>
                        <CardTitle className="text-base">{alert.name}</CardTitle>
                        {alert.description && (
                          <CardDescription className="mt-1">
                            {alert.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getAlertTypeColor(alert.alertType)}>
                      {alert.alertType.replace('_', ' ')}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingAlert(alert)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleTestAlert(alert.id)}
                          disabled={testAlertMutation.isPending}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          Test Alert
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeletingAlert(alert)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {alert.website ? alert.website.name : 'All websites'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Cooldown: {alert.cooldownMinutes} minutes</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <div className="flex gap-2 flex-wrap">
                        {getNotificationChannelIcons(alert.notificationChannels) || (
                          <span className="text-muted-foreground">No channels</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Conditions:</span>
                      <div className="mt-1 space-y-1">
                        {alert.conditions.map((condition, index) => (
                          <div key={index} className="text-xs bg-muted p-2 rounded">
                            {condition.metric.replace('_', ' ')} {condition.operator.replace('_', ' ')} {condition.value}
                            <span className="text-muted-foreground ml-2">
                              ({condition.timeframe})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {alert.lastTriggeredAt && (
                      <div className="text-sm text-muted-foreground">
                        Last triggered: {formatDistanceToNow(new Date(alert.lastTriggeredAt), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Alert Dialog */}
      <EditAlertDialog
        alert={editingAlert}
        open={!!editingAlert}
        onOpenChange={(open) => !open && setEditingAlert(null)}
        onSuccess={() => {
          setEditingAlert(null);
          onRefresh();
        }}
      />

      {/* Delete Alert Dialog */}
      <DeleteAlertDialog
        alert={deletingAlert}
        open={!!deletingAlert}
        onOpenChange={(open) => !open && setDeletingAlert(null)}
        onSuccess={() => {
          setDeletingAlert(null);
          onRefresh();
        }}
      />
    </>
  );
}