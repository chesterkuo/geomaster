import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreHorizontal, 
  RefreshCw, 
  Send, 
  Calendar,
  Filter,
  Eye,
  History
} from 'lucide-react';
import { AlertHistory, alertsApi } from '@/lib/api/alerts';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import AlertDetailsDialog from './AlertDetailsDialog';

interface AlertHistoryListProps {
  history?: AlertHistory[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function AlertHistoryList({ history, isLoading, onRefresh }: AlertHistoryListProps) {
  const [selectedAlert, setSelectedAlert] = useState<AlertHistory | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const resendMutation = useMutation({
    mutationFn: alertsApi.resendNotification,
    onSuccess: (data) => {
      toast.success(data.data.message || 'Notification resent successfully');
      queryClient.invalidateQueries({ queryKey: ['alerts', 'history'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to resend notification: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleResendNotification = (historyId: string) => {
    resendMutation.mutate(historyId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'retry':
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
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

  // Filter logic
  const filteredHistory = history?.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.notificationStatus === filterStatus;
    const matchesType = filterType === 'all' || alert.alertType === filterType;
    const matchesSearch = !searchTerm || 
      alert.alertType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.alertConfiguration?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header and Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Alert History</h2>
              <p className="text-sm text-muted-foreground">
                Track triggered alerts and notification delivery status
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="retry">Retry</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="mention_spike">Mention Spike</SelectItem>
                  <SelectItem value="visibility_drop">Visibility Drop</SelectItem>
                  <SelectItem value="competitor_outrank">Competitor Outrank</SelectItem>
                  <SelectItem value="score_change">Score Change</SelectItem>
                  <SelectItem value="new_mention">New Mention</SelectItem>
                  <SelectItem value="sentiment_change">Sentiment Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredHistory && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredHistory.length} of {history?.length || 0} alerts
            </div>
          )}
        </div>

        {/* Alert History List */}
        {!filteredHistory || filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                    ? 'No matching alerts found' 
                    : 'No alert history'
                  }
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'Alert history will appear here when alerts are triggered'
                  }
                </p>
                {(searchTerm || filterStatus !== 'all' || filterType !== 'all') && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                      setFilterType('all');
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(alert.notificationStatus)}
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getAlertTypeColor(alert.alertType)}>
                            {alert.alertType.replace('_', ' ')}
                          </Badge>
                          
                          <Badge variant="outline" className={getStatusColor(alert.notificationStatus)}>
                            {alert.notificationStatus}
                          </Badge>
                        </div>
                        
                        <div className="text-sm">
                          {alert.alertConfiguration?.name || 'Unknown Alert Configuration'}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(alert.triggeredAt), 'MMM d, yyyy HH:mm')}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
                          </span>
                          {alert.retryCount > 0 && (
                            <span>Retries: {alert.retryCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedAlert(alert)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          
                          {(alert.notificationStatus === 'failed' || alert.notificationStatus === 'retry') && (
                            <DropdownMenuItem 
                              onClick={() => handleResendNotification(alert.id)}
                              disabled={resendMutation.isPending}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Resend Notification
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {alert.failureReason && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-sm">
                      <strong>Failure reason:</strong> {alert.failureReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Alert Details Dialog */}
      <AlertDetailsDialog
        alert={selectedAlert}
        open={!!selectedAlert}
        onOpenChange={(open) => !open && setSelectedAlert(null)}
      />
    </>
  );
}