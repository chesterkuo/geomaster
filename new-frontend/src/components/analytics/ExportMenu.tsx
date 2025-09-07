import { useState } from 'react';
import { Download, FileText, Image, Table, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'png' | 'json';
export type ExportType = 'dashboard' | 'trends' | 'sources' | 'devices' | 'pages';

interface ExportMenuProps {
  onExport: (format: ExportFormat, type: ExportType) => Promise<void>;
  disabled?: boolean;
  size?: "default" | "sm" | "lg";
}

const exportFormats = [
  {
    format: 'pdf' as ExportFormat,
    label: 'PDF 報告',
    description: '完整的分析報告',
    icon: FileText,
  },
  {
    format: 'excel' as ExportFormat,
    label: 'Excel 檔案',
    description: '可編輯的數據表格',
    icon: Table,
  },
  {
    format: 'csv' as ExportFormat,
    label: 'CSV 檔案',
    description: '純數據格式',
    icon: Table,
  },
  {
    format: 'png' as ExportFormat,
    label: 'PNG 圖片',
    description: '圖表截圖',
    icon: Image,
  }
];

const exportTypes = [
  {
    type: 'dashboard' as ExportType,
    label: '總覽數據',
  },
  {
    type: 'trends' as ExportType,
    label: '趨勢分析',
  },
  {
    type: 'sources' as ExportType,
    label: '流量來源',
  },
  {
    type: 'devices' as ExportType,
    label: '裝置分析',
  },
  {
    type: 'pages' as ExportType,
    label: '頁面效能',
  }
];

export const ExportMenu = ({ onExport, disabled, size = "default" }: ExportMenuProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingItem, setExportingItem] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat, type: ExportType) => {
    const exportKey = `${format}-${type}`;
    setIsExporting(true);
    setExportingItem(exportKey);

    try {
      await onExport(format, type);
      toast.success(`已成功匯出 ${exportFormats.find(f => f.format === format)?.label}`, {
        description: `${exportTypes.find(t => t.type === type)?.label} 數據已下載`,
        action: {
          label: '查看下載',
          onClick: () => {
            // Open downloads folder or show notification
          }
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('匯出失敗', {
        description: error instanceof Error ? error.message : '請稍後重試或聯繫支援',
        action: {
          label: '重試',
          onClick: () => handleExport(format, type)
        }
      });
    } finally {
      setIsExporting(false);
      setExportingItem(null);
    }
  };

  const quickExports = [
    { format: 'pdf' as ExportFormat, type: 'dashboard' as ExportType, label: '完整報告 (PDF)' },
    { format: 'excel' as ExportFormat, type: 'dashboard' as ExportType, label: '數據表格 (Excel)' },
    { format: 'png' as ExportFormat, type: 'trends' as ExportType, label: '趨勢圖表 (PNG)' }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={size} 
          disabled={disabled || isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? '匯出中...' : '匯出'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2 text-sm font-medium text-foreground border-b">
          快速匯出
        </div>
        {quickExports.map((item, index) => {
          const exportKey = `${item.format}-${item.type}`;
          const isCurrentlyExporting = exportingItem === exportKey;
          
          return (
            <DropdownMenuItem
              key={index}
              onClick={() => handleExport(item.format, item.type)}
              disabled={isExporting}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isCurrentlyExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="flex-1">{item.label}</span>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <div className="px-3 py-2 text-sm font-medium text-foreground border-b">
          自定義匯出
        </div>
        
        {exportFormats.map((format) => (
          <div key={format.format} className="px-3 py-2">
            <div className="flex items-center gap-2 mb-2">
              <format.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{format.label}</span>
            </div>
            <div className="ml-6 space-y-1">
              {exportTypes.map((type) => {
                const exportKey = `${format.format}-${type.type}`;
                const isCurrentlyExporting = exportingItem === exportKey;
                
                return (
                  <Button
                    key={type.type}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExport(format.format, type.type)}
                    disabled={isExporting}
                    className="w-full justify-start h-8 px-2 text-xs"
                  >
                    {isCurrentlyExporting ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                      <div className="w-3 h-3 mr-2" />
                    )}
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
        
        <DropdownMenuSeparator />
        
        <div className="px-3 py-2 text-xs text-muted-foreground">
          匯出的檔案將會自動下載到您的電腦
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Hook for handling exports
export const useAnalyticsExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async (format: ExportFormat, type: ExportType, data?: any) => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (format === 'csv' || format === 'excel') {
        // Handle data export
        const csvContent = generateCSV(data, type);
        downloadFile(csvContent, `analytics-${type}.${format}`, 
                    format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel');
      } else if (format === 'json') {
        // Handle JSON export
        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, `analytics-${type}.json`, 'application/json');
      } else if (format === 'pdf') {
        // Handle PDF export - would integrate with PDF library
        toast.info('PDF 匯出功能開發中', {
          description: '此功能即將推出，請使用其他格式'
        });
        throw new Error('PDF export not implemented');
      } else if (format === 'png') {
        // Handle image export - would use chart screenshot
        toast.info('圖片匯出功能開發中', {
          description: '此功能即將推出，請使用其他格式'
        });
        throw new Error('PNG export not implemented');
      }
      
      return true;
    } catch (error) {
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportData, isExporting };
};

// Helper functions
const generateCSV = (data: any, type: ExportType): string => {
  if (!data) return '';
  
  switch (type) {
    case 'dashboard':
      return 'Metric,Value,Change\n' +
             `Total Views,${data.overview?.totalViews || 0},${data.overview?.growth?.views || 0}%\n` +
             `Unique Visitors,${data.overview?.uniqueVisitors || 0},${data.overview?.growth?.visitors || 0}%\n` +
             `Bounce Rate,${data.overview?.bounceRate || 0}%,${data.overview?.growth?.bounceRate || 0}%\n`;
    
    case 'trends':
      if (!data.trends) return '';
      let csv = 'Date,Views,Visitors,Sessions,Bounce Rate\n';
      data.trends.forEach((item: any) => {
        csv += `${item.date},${item.views},${item.visitors},${item.sessions},${item.bounceRate}%\n`;
      });
      return csv;
    
    case 'sources':
      if (!data.trafficSources) return '';
      return 'Source,Visitors\n' +
             `Organic,${data.trafficSources.organic}\n` +
             `Direct,${data.trafficSources.direct}\n` +
             `Social,${data.trafficSources.social}\n` +
             `Referral,${data.trafficSources.referral}\n` +
             `Email,${data.trafficSources.email}\n` +
             `Paid,${data.trafficSources.paid}\n`;
    
    default:
      return JSON.stringify(data);
  }
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default ExportMenu;