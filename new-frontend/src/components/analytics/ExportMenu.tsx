import { useState } from 'react';
import { Download, FileText, Image, Table, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

const getExportFormats = (t: any) => [
  {
    format: 'pdf' as ExportFormat,
    label: t('analytics.export.formats.pdfReport'),
    description: t('analytics.export.formats.pdfDescription'),
    icon: FileText,
  },
  {
    format: 'excel' as ExportFormat,
    label: t('analytics.export.formats.excelFile'),
    description: t('analytics.export.formats.excelDescription'),
    icon: Table,
  },
  {
    format: 'csv' as ExportFormat,
    label: t('analytics.export.formats.csvFile'),
    description: t('analytics.export.formats.csvDescription'),
    icon: Table,
  },
  {
    format: 'png' as ExportFormat,
    label: t('analytics.export.formats.pngImage'),
    description: t('analytics.export.formats.pngDescription'),
    icon: Image,
  }
];

const getExportTypes = (t: any) => [
  {
    type: 'dashboard' as ExportType,
    label: t('analytics.export.types.dashboard'),
  },
  {
    type: 'trends' as ExportType,
    label: t('analytics.export.types.trends'),
  },
  {
    type: 'sources' as ExportType,
    label: t('analytics.export.types.sources'),
  },
  {
    type: 'devices' as ExportType,
    label: t('analytics.export.types.devices'),
  },
  {
    type: 'pages' as ExportType,
    label: t('analytics.export.types.pages'),
  }
];

export const ExportMenu = ({ onExport, disabled, size = "default" }: ExportMenuProps) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [exportingItem, setExportingItem] = useState<string | null>(null);

  const exportFormats = getExportFormats(t);
  const exportTypes = getExportTypes(t);

  const handleExport = async (format: ExportFormat, type: ExportType) => {
    const exportKey = `${format}-${type}`;
    setIsExporting(true);
    setExportingItem(exportKey);

    try {
      await onExport(format, type);
      toast.success(t('analytics.export.messages.successExport', { format: exportFormats.find(f => f.format === format)?.label }), {
        description: t('analytics.export.messages.dataDownloaded', { type: exportTypes.find(et => et.type === type)?.label }),
        action: {
          label: t('analytics.export.actions.viewDownload'),
          onClick: () => {
            // Open downloads folder or show notification
          }
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('analytics.export.messages.exportFailed'), {
        description: error instanceof Error ? error.message : t('analytics.export.messages.tryAgainOrContact'),
        action: {
          label: t('analytics.export.actions.retry'),
          onClick: () => handleExport(format, type)
        }
      });
    } finally {
      setIsExporting(false);
      setExportingItem(null);
    }
  };

  const quickExports = [
    { format: 'pdf' as ExportFormat, type: 'dashboard' as ExportType, label: t('analytics.export.quick.fullReport') },
    { format: 'excel' as ExportFormat, type: 'dashboard' as ExportType, label: t('analytics.export.quick.dataTable') },
    { format: 'png' as ExportFormat, type: 'trends' as ExportType, label: t('analytics.export.quick.trendsChart') }
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
          {isExporting ? t('analytics.export.exporting') : t('analytics.export.export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2 text-sm font-medium text-foreground border-b">
{t('analytics.export.quickExport')}
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
{t('analytics.export.customExport')}
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
{t('analytics.export.downloadNote')}
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
        // Note: This would need t() function passed from parent component
        toast.info('PDF export under development', {
          description: 'This feature is coming soon, please use other formats'
        });
        throw new Error('PDF export not implemented');
      } else if (format === 'png') {
        // Handle image export - would use chart screenshot
        // Note: This would need t() function passed from parent component
        toast.info('Image export under development', {
          description: 'This feature is coming soon, please use other formats'
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