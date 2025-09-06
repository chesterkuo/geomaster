import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Bell,
  RefreshCw,
  Activity,
  Radio
} from 'lucide-react';
import { AlertNotification } from '@/hooks/use-websocket-alerts';
import { formatDistanceToNow } from 'date-fns';

interface RealTimeAlertFeedProps {
  alerts: AlertNotification[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  wsError?: string | null;
  onReconnect: () => void;
}

export default function RealTimeAlertFeed({ 
  alerts, 
  connectionStatus, 
  wsError, 
  onReconnect 
}: RealTimeAlertFeedProps) {
  
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to real-time alerts';
      case 'connecting':
        return 'Connecting to real-time service...';
      case 'error':
        return 'Connection error - Real-time alerts unavailable';
      default:
        return 'Not connected to real-time service';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Real-time Connection</CardTitle>
              {getStatusIcon()}
            </div>
            {connectionStatus !== 'connected' && (
              <Button variant="outline" size="sm" onClick={onReconnect}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reconnect
              </Button>
            )}
          </div>
          <CardDescription>{getStatusText()}</CardDescription>
        </CardHeader>
        {wsError && (
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Connection Error: {wsError}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Real-time Alert Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Live Alert Feed</CardTitle>
              <Radio className="h-5 w-5 text-muted-foreground" />
              {alerts.length > 0 && (
                <Badge variant="secondary">{alerts.length}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-muted-foreground">
                {connectionStatus === 'connected' ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <CardDescription>
            Real-time alerts as they happen across your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={`${alert.data.alertId}-${index}`}>
                  <div className={`p-4 border rounded-lg ${getSeverityColor(alert.data.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(alert.data.severity)}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium capitalize">
                              {alert.data.alertType.replace('_', ' ')}
                            </h4>
                            <Badge 
                              variant="outline" 
                              className={
                                alert.data.severity === 'success' ? 'border-green-500 text-green-700' :
                                alert.data.severity === 'warning' ? 'border-yellow-500 text-yellow-700' :
                                alert.data.severity === 'error' ? 'border-red-500 text-red-700' :
                                'border-blue-500 text-blue-700'
                              }
                            >
                              {alert.data.severity}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">{alert.data.websiteName}</span>
                          </p>
                          
                          <p className="text-sm">
                            {alert.data.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {formatDistanceToNow(new Date(alert.data.timestamp), { addSuffix: true })}
                            </span>
                            <span>Alert ID: {alert.data.alertId.slice(0, 8)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Trigger Data Summary */}
                    {alert.data.triggerData && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View trigger data
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(alert.data.triggerData, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                  
                  {index < alerts.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No real-time alerts yet</h3>
              <p className="text-muted-foreground mb-4">
                {connectionStatus === 'connected' 
                  ? 'Waiting for alerts to be triggered...'
                  : 'Connect to the real-time service to see live alerts'
                }
              </p>
              {connectionStatus !== 'connected' && (
                <Button variant="outline" onClick={onReconnect}>
                  <Wifi className="h-4 w-4 mr-2" />
                  Connect Now
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Features Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Real-time Features</CardTitle>
          <CardDescription>What you get with live alert monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Instant alert notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Live metrics updates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">System status notifications</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Multi-tab synchronization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Automatic reconnection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Organization-wide broadcasts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}