import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  Bell, 
  Globe, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Zap
} from 'lucide-react';
import { AlertHistory } from '@/lib/api/alerts';
import { format } from 'date-fns';

interface AlertDetailsDialogProps {
  alert: AlertHistory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AlertDetailsDialog({ alert, open, onOpenChange }: AlertDetailsDialogProps) {
  if (!alert) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'retry':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'retry':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Alert Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this alert trigger and notification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alert Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Alert Type:</span>
                <Badge className={getAlertTypeColor(alert.alertType)}>
                  {alert.alertType.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(alert.notificationStatus)}
                  <Badge className={getStatusColor(alert.notificationStatus)}>
                    {alert.notificationStatus}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Alert Configuration:</span>
                <span className="text-sm text-muted-foreground">
                  {alert.alertConfiguration?.name || 'Unknown Configuration'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Alert ID:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {alert.id}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Triggered At:</span>
                  </div>
                  <div className="text-sm text-muted-foreground ml-6">
                    {format(new Date(alert.triggeredAt), 'PPp')}
                  </div>
                </div>

                {alert.sentAt && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Sent At:</span>
                    </div>
                    <div className="text-sm text-muted-foreground ml-6">
                      {format(new Date(alert.sentAt), 'PPp')}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Retry Count:</span>
                  </div>
                  <div className="text-sm text-muted-foreground ml-6">
                    {alert.retryCount} attempts
                  </div>
                </div>

                {alert.notificationsSent && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Notifications Sent:</span>
                    </div>
                    <div className="text-sm text-muted-foreground ml-6">
                      {alert.notificationsSent}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Failure Reason */}
          {alert.failureReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Failure Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {alert.failureReason}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trigger Data */}
          {alert.triggerData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Trigger Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Summary */}
                  {typeof alert.triggerData === 'object' && alert.triggerData !== null && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(alert.triggerData).map(([key, value]) => {
                        // Handle different types of values
                        const displayValue = typeof value === 'object' && value !== null
                          ? JSON.stringify(value, null, 2)
                          : String(value);

                        return (
                          <div key={key} className="space-y-2">
                            <div className="text-sm font-medium capitalize">
                              {key.replace(/_/g, ' ')}:
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {displayValue.length > 100 ? (
                                <details className="cursor-pointer">
                                  <summary className="text-blue-600 hover:text-blue-800">
                                    Show details...
                                  </summary>
                                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                    {displayValue}
                                  </pre>
                                </details>
                              ) : (
                                <span>{displayValue}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Separator />

                  {/* Raw Data */}
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      Show raw trigger data
                    </summary>
                    <pre className="mt-3 p-3 bg-muted rounded text-xs overflow-x-auto max-h-64">
                      {JSON.stringify(alert.triggerData, null, 2)}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alert Configuration Details */}
          {alert.alertConfiguration && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Configuration Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium mb-1">Name:</div>
                    <div className="text-sm text-muted-foreground">
                      {alert.alertConfiguration.name}
                    </div>
                  </div>

                  {alert.alertConfiguration.description && (
                    <div>
                      <div className="text-sm font-medium mb-1">Description:</div>
                      <div className="text-sm text-muted-foreground">
                        {alert.alertConfiguration.description}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium mb-1">Cooldown:</div>
                    <div className="text-sm text-muted-foreground">
                      {alert.alertConfiguration.cooldownMinutes} minutes
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Status:</div>
                    <Badge variant={alert.alertConfiguration.isActive ? 'default' : 'secondary'}>
                      {alert.alertConfiguration.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Conditions */}
                <div>
                  <div className="text-sm font-medium mb-2">Conditions:</div>
                  <div className="space-y-2">
                    {alert.alertConfiguration.conditions?.map((condition, index) => (
                      <div key={index} className="text-xs bg-muted p-2 rounded">
                        <strong>{condition.metric.replace('_', ' ')}</strong> {condition.operator.replace('_', ' ')} <strong>{condition.value}</strong>
                        <span className="text-muted-foreground ml-2">
                          (over {condition.timeframe})
                        </span>
                      </div>
                    )) || (
                      <span className="text-sm text-muted-foreground">No conditions defined</span>
                    )}
                  </div>
                </div>

                {/* Notification Channels */}
                {alert.alertConfiguration.notificationChannels && alert.alertConfiguration.notificationChannels.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Notification Channels:</div>
                    <div className="flex gap-1 flex-wrap">
                      {alert.alertConfiguration.notificationChannels.map(channel => (
                        <Badge key={channel} variant="outline">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}