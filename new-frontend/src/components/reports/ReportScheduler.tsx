import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Mail,
  Copy,
  Clock3,
  CalendarDays,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  ScheduledReport,
  ScheduleConfig,
  ScheduleType,
  ScheduleReportData,
  ReportTemplate,
  reportsApi,
  reportHelpers
} from '@/lib/api/reports';

/**
 * Schedule Type Options
 */
const SCHEDULE_TYPES = [
  { value: 'daily', label: '每日', icon: Clock },
  { value: 'weekly', label: '每週', icon: Calendar },
  { value: 'monthly', label: '每月', icon: CalendarDays },
  { value: 'quarterly', label: '每季', icon: CalendarDays },
  { value: 'custom', label: '自訂', icon: Settings }
] as const;

/**
 * Day of Week Options
 */
const DAYS_OF_WEEK = [
  { value: 0, label: '週日' },
  { value: 1, label: '週一' },
  { value: 2, label: '週二' },
  { value: 3, label: '週三' },
  { value: 4, label: '週四' },
  { value: 5, label: '週五' },
  { value: 6, label: '週六' }
] as const;

/**
 * Time Presets
 */
const TIME_PRESETS = [
  { value: '06:00', label: '早晨 6:00' },
  { value: '08:00', label: '上午 8:00' },
  { value: '09:00', label: '上午 9:00' },
  { value: '12:00', label: '中午 12:00' },
  { value: '14:00', label: '下午 2:00' },
  { value: '16:00', label: '下午 4:00' },
  { value: '18:00', label: '晚上 6:00' },
  { value: '20:00', label: '晚上 8:00' }
] as const;

/**
 * Props interface for ReportScheduler
 */
interface ReportSchedulerProps {
  /**
   * Available report templates
   */
  templates?: ReportTemplate[];
  /**
   * Callback when schedules are updated
   */
  onUpdate?: () => void;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * ReportScheduler Component
 * 
 * Manages scheduled report generation with:
 * - Schedule configuration (daily, weekly, monthly, quarterly)
 * - Recipient management
 * - Template selection
 * - Schedule activation/deactivation
 * - Schedule execution monitoring
 */
export const ReportScheduler: React.FC<ReportSchedulerProps> = ({
  templates = [],
  onUpdate,
  className = ''
}) => {
  // ===== State Management =====
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledReport | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // New Schedule State
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleReportData>>({
    templateId: '',
    name: '',
    recipients: [],
    schedule: {
      type: 'weekly',
      frequency: 1,
      dayOfWeek: 1,
      hour: 9,
      minute: 0,
      timezone: 'Asia/Taipei'
    },
    parameters: {},
    isActive: true
  });

  // Recipients State
  const [recipientInput, setRecipientInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);

  // ===== Data Loading =====
  const loadScheduledReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportsApi.getScheduledReports();
      if (response.success) {
        setScheduledReports(response.data.scheduledReports);
      }
    } catch (error: any) {
      toast.error('載入排程報告失敗', {
        description: error.response?.data?.message || error.message
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScheduledReports();
  }, [loadScheduledReports]);

  // ===== Event Handlers =====

  /**
   * Add recipient email
   */
  const handleAddRecipient = useCallback(() => {
    const email = recipientInput.trim();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('請輸入有效的電子郵件地址');
      return;
    }

    if (recipients.includes(email)) {
      toast.error('此電子郵件地址已存在');
      return;
    }

    setRecipients(prev => [...prev, email]);
    setRecipientInput('');
  }, [recipientInput, recipients]);

  /**
   * Remove recipient
   */
  const handleRemoveRecipient = useCallback((email: string) => {
    setRecipients(prev => prev.filter(r => r !== email));
  }, []);

  /**
   * Create new scheduled report
   */
  const handleCreateSchedule = useCallback(async () => {
    if (!newSchedule.templateId || !newSchedule.name) {
      toast.error('請填寫必要資訊');
      return;
    }

    if (recipients.length === 0) {
      toast.error('至少需要一個收件人');
      return;
    }

    try {
      const scheduleData: ScheduleReportData = {
        templateId: newSchedule.templateId,
        name: newSchedule.name,
        schedule: newSchedule.schedule as ScheduleConfig,
        recipients,
        parameters: newSchedule.parameters,
        isActive: newSchedule.isActive !== false
      };

      const response = await reportsApi.scheduleReport(scheduleData);
      if (response.success) {
        toast.success('排程報告已建立');
        setShowCreateDialog(false);
        resetForm();
        loadScheduledReports();
        onUpdate?.();
      }
    } catch (error: any) {
      toast.error('建立排程報告失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  }, [newSchedule, recipients, loadScheduledReports, onUpdate]);

  /**
   * Update scheduled report
   */
  const handleUpdateSchedule = useCallback(async () => {
    if (!selectedSchedule) return;

    try {
      const updateData = {
        name: newSchedule.name,
        schedule: newSchedule.schedule,
        recipients,
        parameters: newSchedule.parameters,
        isActive: newSchedule.isActive
      };

      const response = await reportsApi.updateScheduledReport(selectedSchedule.id, updateData);
      if (response.success) {
        toast.success('排程報告已更新');
        setShowEditDialog(false);
        resetForm();
        loadScheduledReports();
        onUpdate?.();
      }
    } catch (error: any) {
      toast.error('更新排程報告失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  }, [selectedSchedule, newSchedule, recipients, loadScheduledReports, onUpdate]);

  /**
   * Delete scheduled report
   */
  const handleDeleteSchedule = useCallback(async (id: string) => {
    try {
      const response = await reportsApi.deleteScheduledReport(id);
      if (response.success) {
        toast.success('排程報告已刪除');
        loadScheduledReports();
        onUpdate?.();
      }
    } catch (error: any) {
      toast.error('刪除排程報告失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  }, [loadScheduledReports, onUpdate]);

  /**
   * Toggle schedule active status
   */
  const handleToggleSchedule = useCallback(async (schedule: ScheduledReport) => {
    try {
      const response = await reportsApi.updateScheduledReport(schedule.id, {
        isActive: !schedule.isActive
      });
      if (response.success) {
        toast.success(schedule.isActive ? '排程已暫停' : '排程已啟用');
        loadScheduledReports();
        onUpdate?.();
      }
    } catch (error: any) {
      toast.error('更新排程狀態失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  }, [loadScheduledReports, onUpdate]);

  /**
   * Reset form data
   */
  const resetForm = useCallback(() => {
    setNewSchedule({
      templateId: '',
      name: '',
      recipients: [],
      schedule: {
        type: 'weekly',
        frequency: 1,
        dayOfWeek: 1,
        hour: 9,
        minute: 0,
        timezone: 'Asia/Taipei'
      },
      parameters: {},
      isActive: true
    });
    setRecipients([]);
    setRecipientInput('');
    setSelectedSchedule(null);
  }, []);

  /**
   * Open edit dialog
   */
  const openEditDialog = useCallback((schedule: ScheduledReport) => {
    setSelectedSchedule(schedule);
    setNewSchedule({
      name: schedule.name,
      schedule: schedule.schedule,
      parameters: schedule.parameters,
      isActive: schedule.isActive
    });
    setRecipients(schedule.recipients);
    setShowEditDialog(true);
  }, []);

  // ===== Helper Functions =====

  /**
   * Get schedule type display info
   */
  const getScheduleTypeInfo = (type: ScheduleType) => {
    return SCHEDULE_TYPES.find(t => t.value === type) || SCHEDULE_TYPES[0];
  };

  /**
   * Format next execution time
   */
  const formatNextExecution = (dateString: string | undefined) => {
    if (!dateString) return '未設定';
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get schedule status
   */
  const getScheduleStatus = (schedule: ScheduledReport) => {
    if (!schedule.isActive) {
      return { text: '已暫停', color: 'gray', icon: Pause };
    }
    
    if (schedule.lastExecuted) {
      const lastExec = new Date(schedule.lastExecuted);
      const now = new Date();
      const diffHours = (now.getTime() - lastExec.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 1) {
        return { text: '最近執行', color: 'green', icon: CheckCircle2 };
      } else if (diffHours < 24) {
        return { text: '今日已執行', color: 'blue', icon: Clock3 };
      }
    }
    
    return { text: '等待執行', color: 'orange', icon: Clock };
  };

  // ===== Render Functions =====

  /**
   * Render schedule configuration form
   */
  const renderScheduleForm = () => (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>排程名稱</Label>
          <Input
            value={newSchedule.name || ''}
            onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
            placeholder="輸入排程名稱"
          />
        </div>
        
        {!selectedSchedule && (
          <div>
            <Label>報告模板</Label>
            <Select
              value={newSchedule.templateId}
              onValueChange={(value) => setNewSchedule(prev => ({ ...prev, templateId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇報告模板" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({reportHelpers.getReportTypeDisplayName(template.reportType)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      {/* Schedule Configuration */}
      <div>
        <Label className="text-base font-medium">執行時間設定</Label>
        <div className="mt-3 space-y-4">
          <div>
            <Label>頻率類型</Label>
            <Select
              value={newSchedule.schedule?.type}
              onValueChange={(value: ScheduleType) => 
                setNewSchedule(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule, type: value } as ScheduleConfig
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <type.icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newSchedule.schedule?.type === 'weekly' && (
            <div>
              <Label>星期幾</Label>
              <Select
                value={newSchedule.schedule.dayOfWeek?.toString()}
                onValueChange={(value) =>
                  setNewSchedule(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, dayOfWeek: parseInt(value) } as ScheduleConfig
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {newSchedule.schedule?.type === 'monthly' && (
            <div>
              <Label>每月第幾日</Label>
              <Select
                value={newSchedule.schedule.dayOfMonth?.toString()}
                onValueChange={(value) =>
                  setNewSchedule(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, dayOfMonth: parseInt(value) } as ScheduleConfig
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      {day} 日
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>執行時間</Label>
              <Select
                value={`${newSchedule.schedule?.hour?.toString().padStart(2, '0')}:${newSchedule.schedule?.minute?.toString().padStart(2, '0')}`}
                onValueChange={(value) => {
                  const [hour, minute] = value.split(':');
                  setNewSchedule(prev => ({
                    ...prev,
                    schedule: {
                      ...prev.schedule,
                      hour: parseInt(hour),
                      minute: parseInt(minute)
                    } as ScheduleConfig
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_PRESETS.map(time => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newSchedule.isActive !== false}
                  onCheckedChange={(checked) =>
                    setNewSchedule(prev => ({ ...prev, isActive: checked }))
                  }
                />
                <Label>啟用排程</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Recipients */}
      <div>
        <Label className="text-base font-medium">收件人設定</Label>
        <div className="mt-3 space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="輸入電子郵件地址"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
            />
            <Button type="button" onClick={handleAddRecipient}>
              新增
            </Button>
          </div>
          
          {recipients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipients.map((email, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <Mail className="h-3 w-3" />
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(email)}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-sm"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /**
   * Render scheduled report item
   */
  const renderScheduleItem = (schedule: ScheduledReport) => {
    const typeInfo = getScheduleTypeInfo(schedule.schedule.type);
    const status = getScheduleStatus(schedule);
    const StatusIcon = status.icon;

    return (
      <Card key={schedule.id}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <typeInfo.icon className="h-5 w-5 text-primary" />
                <span>{schedule.name}</span>
                <Badge variant={status.color === 'green' ? 'default' : 'secondary'}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.text}
                </Badge>
              </CardTitle>
              <CardDescription>
                {schedule.template?.name} • {reportHelpers.formatSchedule(schedule.schedule)}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditDialog(schedule)}
              >
                <Edit className="h-4 w-4 mr-1" />
                編輯
              </Button>
              <Button
                size="sm"
                variant={schedule.isActive ? 'outline' : 'default'}
                onClick={() => handleToggleSchedule(schedule)}
              >
                {schedule.isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    暫停
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    啟用
                  </>
                )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>確認刪除排程</AlertDialogTitle>
                    <AlertDialogDescription>
                      您確定要刪除「{schedule.name}」排程嗎？此操作無法復原。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteSchedule(schedule.id)}>
                      刪除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label>收件人數量</Label>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{schedule.recipients.length}</span>
              </div>
            </div>
            <div>
              <Label>上次執行</Label>
              <div>
                {schedule.lastExecuted ? formatNextExecution(schedule.lastExecuted) : '從未執行'}
              </div>
            </div>
            <div>
              <Label>下次執行</Label>
              <div>
                {formatNextExecution(schedule.nextExecution)}
              </div>
            </div>
            <div>
              <Label>建立時間</Label>
              <div>
                {new Date(schedule.createdAt).toLocaleDateString('zh-TW')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ===== Main Render =====
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">排程報告管理</h2>
          <p className="text-muted-foreground">設定自動化報告生成和發送</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              新增排程
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>建立排程報告</DialogTitle>
              <DialogDescription>
                設定報告自動生成和發送排程
              </DialogDescription>
            </DialogHeader>
            {renderScheduleForm()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button onClick={handleCreateSchedule}>
                建立排程
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯排程報告</DialogTitle>
            <DialogDescription>
              修改報告排程設定
            </DialogDescription>
          </DialogHeader>
          {renderScheduleForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateSchedule}>
              更新排程
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheduled Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">載入中...</span>
        </div>
      ) : scheduledReports.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">尚無排程報告</h3>
          <p className="text-muted-foreground mb-4">
            建立您的第一個自動化報告排程
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增排程
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduledReports.map(schedule => renderScheduleItem(schedule))}
        </div>
      )}
    </div>
  );
};

export default ReportScheduler;