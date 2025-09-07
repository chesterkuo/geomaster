import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Download,
  Share,
  Trash2,
  Eye,
  Calendar,
  Clock,
  FileText,
  BarChart3,
  Table,
  Image,
  RefreshCw,
  Archive,
  Star,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  SortAsc,
  SortDesc,
  Grid3X3,
  List
} from 'lucide-react';
import {
  GeneratedReport,
  ReportType,
  ReportStatus,
  FileFormat,
  ShareReportData,
  reportsApi,
  reportHelpers
} from '@/lib/api/reports';

/**
 * View Mode Options
 */
type ViewMode = 'grid' | 'list';

/**
 * Sort Options
 */
type SortField = 'name' | 'generatedAt' | 'fileSize' | 'reportType';
type SortDirection = 'asc' | 'desc';

/**
 * Filter Options
 */
interface FilterOptions {
  search: string;
  reportType: ReportType | 'all';
  status: ReportStatus | 'all';
  fileFormat: FileFormat | 'all';
  dateRange: 'all' | '7days' | '30days' | '90days';
}

/**
 * Props interface for ReportLibrary
 */
interface ReportLibraryProps {
  /**
   * Callback when report is selected for viewing
   */
  onViewReport?: (report: GeneratedReport) => void;
  /**
   * Callback when reports are updated
   */
  onUpdate?: () => void;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * ReportLibrary Component
 * 
 * A comprehensive report management interface with:
 * - Report browsing and filtering
 * - Report download and sharing
 * - Report metadata display
 * - Bulk operations
 * - View modes (grid/list)
 */
export const ReportLibrary: React.FC<ReportLibraryProps> = ({
  onViewReport,
  onUpdate,
  className = ''
}) => {
  // ===== State Management =====
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('generatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filter State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    reportType: 'all',
    status: 'all',
    fileFormat: 'all',
    dateRange: 'all'
  });

  // Dialog State
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // ===== Data Loading =====
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportsApi.getReports();
      if (response.success) {
        setReports(response.data.reports);
      }
    } catch (error: any) {
      toast.error('載入報告失敗', {
        description: error.response?.data?.message || error.message
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // ===== Filtered and Sorted Reports =====
  const filteredAndSortedReports = useMemo(() => {
    let filtered = reports.filter(report => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = report.name.toLowerCase().includes(searchLower);
        const matchesType = reportHelpers.getReportTypeDisplayName(report.reportType).toLowerCase().includes(searchLower);
        if (!matchesName && !matchesType) return false;
      }

      // Report type filter
      if (filters.reportType !== 'all' && report.reportType !== filters.reportType) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && report.status !== filters.status) {
        return false;
      }

      // File format filter
      if (filters.fileFormat !== 'all' && report.fileFormat !== filters.fileFormat) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const reportDate = new Date(report.generatedAt);
        const now = new Date();
        const diffDays = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (filters.dateRange) {
          case '7days':
            if (diffDays > 7) return false;
            break;
          case '30days':
            if (diffDays > 30) return false;
            break;
          case '90days':
            if (diffDays > 90) return false;
            break;
        }
      }

      return true;
    });

    // Sort reports
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'generatedAt':
          aValue = new Date(a.generatedAt).getTime();
          bValue = new Date(b.generatedAt).getTime();
          break;
        case 'fileSize':
          aValue = parseInt(a.fileSize) || 0;
          bValue = parseInt(b.fileSize) || 0;
          break;
        case 'reportType':
          aValue = a.reportType;
          bValue = b.reportType;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [reports, filters, sortField, sortDirection]);

  // ===== Event Handlers =====

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  /**
   * Handle report selection toggle
   */
  const handleReportSelection = useCallback((reportId: string) => {
    setSelectedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle select all toggle
   */
  const handleSelectAll = useCallback(() => {
    if (selectedReports.size === filteredAndSortedReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(filteredAndSortedReports.map(r => r.id)));
    }
  }, [selectedReports.size, filteredAndSortedReports]);

  /**
   * Download report
   */
  const handleDownloadReport = useCallback((report: GeneratedReport) => {
    if (!reportHelpers.isReportDownloadable(report)) {
      toast.error('報告無法下載');
      return;
    }

    const downloadUrl = reportsApi.getDownloadUrl(report.id);
    window.open(downloadUrl, '_blank');
    toast.success('正在下載報告');
  }, []);

  /**
   * Delete report
   */
  const handleDeleteReport = useCallback(async (reportId: string) => {
    try {
      const response = await reportsApi.deleteReport(reportId);
      if (response.success) {
        toast.success('報告已刪除');
        loadReports();
        onUpdate?.();
      }
    } catch (error: any) {
      toast.error('刪除報告失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  }, [loadReports, onUpdate]);

  /**
   * Bulk delete reports
   */
  const handleBulkDelete = useCallback(async () => {
    if (selectedReports.size === 0) return;

    const reportIds = Array.from(selectedReports);
    
    try {
      await Promise.all(reportIds.map(id => reportsApi.deleteReport(id)));
      toast.success(`已刪除 ${reportIds.length} 個報告`);
      setSelectedReports(new Set());
      loadReports();
      onUpdate?.();
    } catch (error: any) {
      toast.error('批量刪除報告失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  }, [selectedReports, loadReports, onUpdate]);

  /**
   * Add email to share list
   */
  const handleAddShareEmail = useCallback(() => {
    const email = emailInput.trim();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('請輸入有效的電子郵件地址');
      return;
    }

    if (shareEmails.includes(email)) {
      toast.error('此電子郵件地址已存在');
      return;
    }

    setShareEmails(prev => [...prev, email]);
    setEmailInput('');
  }, [emailInput, shareEmails]);

  /**
   * Share report
   */
  const handleShareReport = useCallback(async () => {
    if (!selectedReport || shareEmails.length === 0) {
      toast.error('請添加至少一個收件人');
      return;
    }

    try {
      const shareData: ShareReportData = {
        emails: shareEmails,
        message: shareMessage || undefined,
        expiresIn: 30 // 30 days
      };

      const response = await reportsApi.shareReport(selectedReport.id, shareData);
      if (response.success) {
        toast.success('報告已分享');
        setShowShareDialog(false);
        setSelectedReport(null);
        setShareEmails([]);
        setShareMessage('');
      }
    } catch (error: any) {
      toast.error('分享報告失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  }, [selectedReport, shareEmails, shareMessage]);

  /**
   * Open share dialog
   */
  const openShareDialog = useCallback((report: GeneratedReport) => {
    setSelectedReport(report);
    setShowShareDialog(true);
  }, []);

  // ===== Helper Functions =====

  /**
   * Get status icon and color
   */
  const getStatusIcon = (status: ReportStatus) => {
    const statusConfig = reportHelpers.getStatusDisplay(status);
    const icons = {
      'generating': Loader2,
      'completed': CheckCircle2,
      'failed': XCircle
    };
    const Icon = icons[status] || AlertCircle;
    return { Icon, color: statusConfig.color };
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== Render Functions =====

  /**
   * Render report card (grid view)
   */
  const renderReportCard = (report: GeneratedReport) => {
    const { Icon: StatusIcon, color: statusColor } = getStatusIcon(report.status);
    const isDownloadable = reportHelpers.isReportDownloadable(report);
    const isSelected = selectedReports.has(report.id);

    return (
      <Card 
        key={report.id} 
        className={`transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleReportSelection(report.id)}
                  className="rounded"
                />
                <span className="truncate">{report.name}</span>
              </CardTitle>
              <CardDescription className="flex items-center space-x-2 mt-1">
                <Badge variant="outline">
                  {reportHelpers.getReportTypeDisplayName(report.reportType)}
                </Badge>
                <Badge 
                  variant={statusColor === 'green' ? 'default' : 'secondary'}
                  className="flex items-center space-x-1"
                >
                  <StatusIcon className={`h-3 w-3 ${report.status === 'generating' ? 'animate-spin' : ''}`} />
                  <span>{reportHelpers.getStatusDisplay(report.status).name}</span>
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <Label className="text-xs text-muted-foreground">格式</Label>
              <div>{reportHelpers.getFileFormatDisplayName(report.fileFormat)}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">大小</Label>
              <div>{report.fileSize}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">生成時間</Label>
              <div>{formatDate(report.generatedAt)}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">到期時間</Label>
              <div>{report.expiresAt ? formatDate(report.expiresAt) : '無期限'}</div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between">
            <div className="flex space-x-1">
              {isDownloadable && (
                <Button size="sm" variant="outline" onClick={() => handleDownloadReport(report)}>
                  <Download className="h-3 w-3" />
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => onViewReport?.(report)}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => openShareDialog(report)}>
                <Share className="h-3 w-3" />
              </Button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認刪除報告</AlertDialogTitle>
                  <AlertDialogDescription>
                    您確定要刪除「{report.name}」嗎？此操作無法復原。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                    刪除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render report row (list view)
   */
  const renderReportRow = (report: GeneratedReport) => {
    const { Icon: StatusIcon, color: statusColor } = getStatusIcon(report.status);
    const isDownloadable = reportHelpers.isReportDownloadable(report);
    const isSelected = selectedReports.has(report.id);

    return (
      <div 
        key={report.id}
        className={`flex items-center space-x-4 p-4 border border-border rounded-lg hover:shadow-md transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleReportSelection(report.id)}
          className="rounded"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium truncate">{report.name}</h4>
            <Badge variant="outline">
              {reportHelpers.getReportTypeDisplayName(report.reportType)}
            </Badge>
            <Badge 
              variant={statusColor === 'green' ? 'default' : 'secondary'}
              className="flex items-center space-x-1"
            >
              <StatusIcon className={`h-3 w-3 ${report.status === 'generating' ? 'animate-spin' : ''}`} />
              <span>{reportHelpers.getStatusDisplay(report.status).name}</span>
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {reportHelpers.getFileFormatDisplayName(report.fileFormat)} • {report.fileSize} • {formatDate(report.generatedAt)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isDownloadable && (
            <Button size="sm" variant="outline" onClick={() => handleDownloadReport(report)}>
              <Download className="h-4 w-4 mr-1" />
              下載
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onViewReport?.(report)}>
            <Eye className="h-4 w-4 mr-1" />
            檢視
          </Button>
          <Button size="sm" variant="outline" onClick={() => openShareDialog(report)}>
            <Share className="h-4 w-4 mr-1" />
            分享
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確認刪除報告</AlertDialogTitle>
                <AlertDialogDescription>
                  您確定要刪除「{report.name}」嗎？此操作無法復原。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                  刪除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  };

  // ===== Main Render =====
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">報告庫</h2>
          <p className="text-muted-foreground">瀏覽和管理您的報告</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadReports} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">篩選和搜尋</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>搜尋</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋報告..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label>報告類型</Label>
              <Select
                value={filters.reportType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value as ReportType | 'all' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  <SelectItem value="competitor_benchmark">競爭對手分析</SelectItem>
                  <SelectItem value="market_position">市場定位分析</SelectItem>
                  <SelectItem value="swot_analysis">SWOT 分析</SelectItem>
                  <SelectItem value="keyword_analysis">關鍵字分析</SelectItem>
                  <SelectItem value="custom">自訂報告</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>狀態</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as ReportStatus | 'all' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="generating">生成中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="failed">生成失敗</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>檔案格式</Label>
              <Select
                value={filters.fileFormat}
                onValueChange={(value) => setFilters(prev => ({ ...prev, fileFormat: value as FileFormat | 'all' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部格式</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>時間範圍</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value as FilterOptions['dateRange'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部時間</SelectItem>
                  <SelectItem value="7days">近 7 天</SelectItem>
                  <SelectItem value="30days">近 30 天</SelectItem>
                  <SelectItem value="90days">近 90 天</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            找到 {filteredAndSortedReports.length} 個報告
            {selectedReports.size > 0 && (
              <span className="ml-2">• 已選擇 {selectedReports.size} 個</span>
            )}
          </div>
          
          {selectedReports.size > 0 && (
            <div className="flex items-center space-x-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    批量刪除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>確認批量刪除</AlertDialogTitle>
                    <AlertDialogDescription>
                      您確定要刪除所選的 {selectedReports.size} 個報告嗎？此操作無法復原。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>
                      刪除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Sort Controls */}
          <Select value={sortField} onValueChange={(value: SortField) => handleSortChange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="generatedAt">生成時間</SelectItem>
              <SelectItem value="name">名稱</SelectItem>
              <SelectItem value="fileSize">檔案大小</SelectItem>
              <SelectItem value="reportType">報告類型</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-md">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Select All */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectAll}
          >
            {selectedReports.size === filteredAndSortedReports.length ? '取消全選' : '全選'}
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分享報告</DialogTitle>
            <DialogDescription>
              分享「{selectedReport?.name}」給其他人
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>收件人電子郵件</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  placeholder="輸入電子郵件地址"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddShareEmail()}
                />
                <Button onClick={handleAddShareEmail}>新增</Button>
              </div>
              {shareEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {shareEmails.map((email, index) => (
                    <Badge key={index} variant="secondary">
                      {email}
                      <button
                        onClick={() => setShareEmails(prev => prev.filter(e => e !== email))}
                        className="ml-2 hover:bg-destructive hover:text-destructive-foreground rounded-sm"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>附加訊息（選填）</Label>
              <Textarea
                placeholder="輸入分享訊息..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              取消
            </Button>
            <Button onClick={handleShareReport}>
              分享報告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reports Display */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>載入報告中...</span>
        </div>
      ) : filteredAndSortedReports.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">沒有找到報告</h3>
          <p className="text-muted-foreground">
            {filters.search || filters.reportType !== 'all' || filters.status !== 'all' || filters.fileFormat !== 'all' || filters.dateRange !== 'all'
              ? '請調整篩選條件或搜尋關鍵字'
              : '還沒有任何報告，請先生成一些報告'
            }
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
          {filteredAndSortedReports.map(report => 
            viewMode === 'grid' ? renderReportCard(report) : renderReportRow(report)
          )}
        </div>
      )}
    </div>
  );
};

export default ReportLibrary;