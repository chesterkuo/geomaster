import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit } from 'lucide-react';
import { AlertConfiguration, AlertCondition, UpdateAlertRequest, alertsApi } from '@/lib/api/alerts';
import { toast } from 'sonner';

interface EditAlertDialogProps {
  alert: AlertConfiguration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ALERT_TYPES = [
  { value: 'mention_spike', label: 'Mention Spike', description: 'When AI mentions increase significantly' },
  { value: 'visibility_drop', label: 'Visibility Drop', description: 'When visibility percentage decreases' },
  { value: 'competitor_outrank', label: 'Competitor Outrank', description: 'When competitors rank higher' },
  { value: 'score_change', label: 'Score Change', description: 'When GEO score changes significantly' },
  { value: 'new_mention', label: 'New Mention', description: 'When new AI mentions are detected' },
  { value: 'sentiment_change', label: 'Sentiment Change', description: 'When sentiment score changes' }
];

const METRICS = [
  { value: 'mention_count', label: 'Mention Count' },
  { value: 'sentiment_score', label: 'Sentiment Score' },
  { value: 'visibility_percentage', label: 'Visibility Percentage' },
  { value: 'geo_score', label: 'GEO Score' }
];

const OPERATORS = [
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'equals', label: 'Equals' },
  { value: 'percentage_change', label: 'Percentage change' }
];

const TIMEFRAMES = [
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' }
];

const NOTIFICATION_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'websocket', label: 'Real-time (WebSocket)' },
  { value: 'slack', label: 'Slack' },
  { value: 'webhook', label: 'Webhook' }
];

export default function EditAlertDialog({ alert, open, onOpenChange, onSuccess }: EditAlertDialogProps) {
  const [formData, setFormData] = useState<UpdateAlertRequest>({
    name: '',
    description: '',
    alertType: '',
    conditions: [],
    notificationChannels: [],
    cooldownMinutes: 60,
    isActive: true
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertRequest }) => 
      alertsApi.updateAlert(id, data),
    onSuccess: () => {
      toast.success('Alert configuration updated successfully');
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to update alert: ${error.response?.data?.message || error.message}`);
    }
  });

  // Initialize form data when alert changes
  useEffect(() => {
    if (alert) {
      setFormData({
        name: alert.name || '',
        description: alert.description || '',
        alertType: alert.alertType || '',
        conditions: alert.conditions || [],
        notificationChannels: alert.notificationChannels || [],
        cooldownMinutes: alert.cooldownMinutes || 60,
        isActive: alert.isActive
      });
    }
  }, [alert]);

  const addCondition = () => {
    const newCondition: AlertCondition = {
      metric: 'mention_count' as const,
      operator: 'greater_than' as const,
      value: 0,
      timeframe: '1d' as const
    };
    setFormData(prev => ({
      ...prev,
      conditions: [...(prev.conditions || []), newCondition]
    }));
  };

  const updateCondition = (index: number, field: keyof AlertCondition, value: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: (prev.conditions || []).map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: (prev.conditions || []).filter((_, i) => i !== index)
    }));
  };

  const toggleNotificationChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      notificationChannels: (prev.notificationChannels || []).includes(channel)
        ? (prev.notificationChannels || []).filter(c => c !== channel)
        : [...(prev.notificationChannels || []), channel]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!alert) return;
    
    if (!formData.name?.trim()) {
      toast.error('Alert name is required');
      return;
    }
    
    if (!formData.alertType) {
      toast.error('Alert type is required');
      return;
    }
    
    if (!formData.conditions || formData.conditions.length === 0) {
      toast.error('At least one condition is required');
      return;
    }
    
    if (!formData.notificationChannels || formData.notificationChannels.length === 0) {
      toast.error('At least one notification channel is required');
      return;
    }

    updateMutation.mutate({ id: alert.id, data: formData });
  };

  if (!alert) return null;

  const selectedAlertType = ALERT_TYPES.find(type => type.value === formData.alertType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Alert Configuration
          </DialogTitle>
          <DialogDescription>
            Modify your alert settings and conditions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="isActive">Alert Status</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable this alert configuration
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Alert Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., High mention spike alert"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of what this alert monitors"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alertType">Alert Type *</Label>
              <Select 
                value={formData.alertType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, alertType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose alert type" />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAlertType && (
                <p className="text-sm text-muted-foreground">
                  {selectedAlertType.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cooldown">Cooldown Period (minutes)</Label>
              <Input
                id="cooldown"
                type="number"
                min="5"
                max="1440"
                value={formData.cooldownMinutes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  cooldownMinutes: parseInt(e.target.value) || 60 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum time between alert triggers to prevent spam
              </p>
            </div>
          </div>

          <Separator />

          {/* Conditions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Alert Conditions *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-1" />
                Add Condition
              </Button>
            </div>

            {!formData.conditions || formData.conditions.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="text-muted-foreground">No conditions added yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add at least one condition to trigger the alert
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {formData.conditions.map((condition, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid gap-3 md:grid-cols-5 items-end">
                        <div className="space-y-2">
                          <Label>Metric</Label>
                          <Select
                            value={condition.metric}
                            onValueChange={(value) => updateCondition(index, 'metric', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {METRICS.map(metric => (
                                <SelectItem key={metric.value} value={metric.value}>
                                  {metric.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Operator</Label>
                          <Select
                            value={condition.operator}
                            onValueChange={(value) => updateCondition(index, 'operator', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATORS.map(op => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Value</Label>
                          <Input
                            type="number"
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Timeframe</Label>
                          <Select
                            value={condition.timeframe}
                            onValueChange={(value) => updateCondition(index, 'timeframe', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMEFRAMES.map(tf => (
                                <SelectItem key={tf.value} value={tf.value}>
                                  {tf.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCondition(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Notification Channels */}
          <div className="space-y-4">
            <Label>Notification Channels *</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {NOTIFICATION_CHANNELS.map(channel => (
                <div key={channel.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${channel.value}`}
                    checked={formData.notificationChannels?.includes(channel.value)}
                    onCheckedChange={() => toggleNotificationChannel(channel.value)}
                  />
                  <Label htmlFor={`edit-${channel.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {channel.label}
                  </Label>
                </div>
              ))}
            </div>
            {formData.notificationChannels && formData.notificationChannels.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {formData.notificationChannels.map(channel => (
                  <Badge key={channel} variant="secondary">
                    {NOTIFICATION_CHANNELS.find(c => c.value === channel)?.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Alert'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}