import apiClient, { ApiResponse } from './client';

/**
 * Report Type Enum
 */
export type ReportType = 'competitor_benchmark' | 'market_position' | 'swot_analysis' | 'keyword_analysis' | 'custom';

/**
 * File Format Enum
 */
export type FileFormat = 'pdf' | 'excel' | 'csv' | 'json';

/**
 * Report Status Enum
 */
export type ReportStatus = 'generating' | 'completed' | 'failed';

/**
 * Schedule Type Enum
 */
export type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';

/**
 * Report Section Interface
 */
export interface ReportSection {
  id: string;
  name: string;
  type: 'chart' | 'table' | 'text' | 'image';
  config: Record<string, any>;
  order: number;
}

/**
 * Chart Configuration Interface
 */
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  dataSource: string;
  xAxis: string;
  yAxis: string;
  title: string;
}

/**
 * Template Configuration Interface
 */
export interface TemplateConfig {
  sections: ReportSection[];
  charts: ChartConfig[];
  format: FileFormat;
  branding: boolean;
  customizations: Record<string, any>;
}

/**
 * Report Parameters Interface
 */
export interface ReportParameters {
  dateRange?: {
    start: string;
    end: string;
  };
  competitors?: string[];
  keywords?: string[];
  websites?: string[];
  metrics?: string[];
  filters?: Record<string, any>;
  customOptions?: Record<string, any>;
}

/**
 * Report Template Interface
 */
export interface ReportTemplate {
  id: string;
  organizationId?: string;
  name: string;
  reportType: ReportType;
  templateConfig: TemplateConfig;
  isPublic: boolean;
  isSystemDefault: boolean;
  usageCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Report Template Preview Interface
 */
export interface ReportTemplatePreview {
  id: string;
  name: string;
  reportType: ReportType;
  sectionsCount: number;
  chartsCount: number;
  format: FileFormat;
  isPublic: boolean;
  isSystemDefault: boolean;
  usageCount: number;
}

/**
 * Generated Report Interface
 */
export interface GeneratedReport {
  id: string;
  organizationId: string;
  templateId?: string;
  name: string;
  reportType: ReportType;
  parameters?: ReportParameters;
  filePath?: string;
  fileFormat: FileFormat;
  fileSize: string;
  status: ReportStatus;
  isAccessible: boolean;
  isExpired: boolean;
  generatedBy?: string;
  generatedAt: string;
  expiresAt?: string;
  downloadUrl?: string;
  generationTime?: number;
}

/**
 * Scheduled Report Interface
 */
export interface ScheduledReport {
  id: string;
  organizationId: string;
  templateId: string;
  name: string;
  schedule: ScheduleConfig;
  recipients: string[];
  parameters?: ReportParameters;
  isActive: boolean;
  lastExecuted?: string;
  nextExecution?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  template?: {
    name: string;
    reportType: ReportType;
  };
}

/**
 * Schedule Configuration Interface
 */
export interface ScheduleConfig {
  type: ScheduleType;
  frequency: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  minute: number;
  timezone?: string;
}

/**
 * Report Share Interface
 */
export interface ReportShare {
  id: string;
  reportId: string;
  sharedBy: string;
  recipients: string[];
  message?: string;
  expiresAt?: string;
  accessCount: number;
  createdAt: string;
}

/**
 * Bulk Generation Request Interface
 */
export interface BulkGenerationRequest {
  templateId?: string;
  name: string;
  reportType: ReportType;
  parameters?: ReportParameters;
  fileFormat: FileFormat;
}

/**
 * Bulk Generation Result Interface
 */
export interface BulkGenerationResult {
  request: BulkGenerationRequest;
  success: boolean;
  reportId?: string;
  error?: string;
}

/**
 * Report Statistics Interface
 */
export interface ReportStatistics {
  storage: {
    totalSize: number;
    totalReports: number;
    averageSize: number;
  };
  counts: {
    templates: number;
    reports: number;
  };
  recent: GeneratedReport[];
  popular: ReportTemplatePreview[];
}

/**
 * Report Version Interface
 */
export interface ReportVersion {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  fileSize: string;
  status: ReportStatus;
  downloadUrl?: string;
}

/**
 * Report Template Creation Data
 */
export interface CreateReportTemplateData {
  name: string;
  reportType: ReportType;
  templateConfig: TemplateConfig;
  isPublic?: boolean;
}

/**
 * Report Template Update Data
 */
export interface UpdateReportTemplateData {
  name?: string;
  templateConfig?: TemplateConfig;
  isPublic?: boolean;
}

/**
 * Report Generation Data
 */
export interface GenerateReportData {
  templateId?: string;
  name: string;
  reportType: ReportType;
  parameters?: ReportParameters;
  fileFormat: FileFormat;
}

/**
 * Schedule Report Data
 */
export interface ScheduleReportData {
  templateId: string;
  name: string;
  schedule: ScheduleConfig;
  recipients: string[];
  parameters?: ReportParameters;
  isActive?: boolean;
}

/**
 * Share Report Data
 */
export interface ShareReportData {
  emails: string[];
  message?: string;
  expiresIn?: number; // days
}

/**
 * Report API Client
 */
export class ReportsAPI {
  
  // ===== Template Management =====
  
  /**
   * Get report templates
   */
  static async getTemplates(params?: {
    reportType?: ReportType;
    includePublic?: boolean;
    includeSystemDefault?: boolean;
  }): Promise<ApiResponse<{ templates: ReportTemplatePreview[]; total: number }>> {
    const searchParams = new URLSearchParams();
    if (params?.reportType) searchParams.append('reportType', params.reportType);
    if (params?.includePublic) searchParams.append('includePublic', 'true');
    if (params?.includeSystemDefault) searchParams.append('includeSystemDefault', 'true');

    const response = await apiClient.get(`/reports/templates?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get specific template
   */
  static async getTemplate(id: string): Promise<ApiResponse<{ template: ReportTemplate }>> {
    const response = await apiClient.get(`/reports/templates/${id}`);
    return response.data;
  }

  /**
   * Create new template
   */
  static async createTemplate(data: CreateReportTemplateData): Promise<ApiResponse<{ template: ReportTemplatePreview }>> {
    const response = await apiClient.post('/reports/templates', data);
    return response.data;
  }

  /**
   * Update template
   */
  static async updateTemplate(id: string, data: UpdateReportTemplateData): Promise<ApiResponse<{ template: ReportTemplatePreview }>> {
    const response = await apiClient.put(`/reports/templates/${id}`, data);
    return response.data;
  }

  /**
   * Delete template
   */
  static async deleteTemplate(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete(`/reports/templates/${id}`);
    return response.data;
  }

  /**
   * Clone template
   */
  static async cloneTemplate(id: string, name: string): Promise<ApiResponse<{ template: ReportTemplatePreview }>> {
    const response = await apiClient.post(`/reports/templates/${id}/clone`, { name });
    return response.data;
  }

  // ===== Report Generation =====

  /**
   * Generate single report
   */
  static async generateReport(data: GenerateReportData): Promise<ApiResponse<{ report: GeneratedReport; message: string }>> {
    const response = await apiClient.post('/reports', data);
    return response.data;
  }

  /**
   * Generate multiple reports
   */
  static async bulkGenerateReports(requests: BulkGenerationRequest[]): Promise<ApiResponse<{
    results: BulkGenerationResult[];
    totalRequested: number;
    successful: number;
    failed: number;
  }>> {
    const response = await apiClient.post('/reports/bulk-generate', { requests });
    return response.data;
  }

  /**
   * Get generated reports
   */
  static async getReports(params?: {
    reportType?: ReportType;
    status?: ReportStatus;
    limit?: number;
  }): Promise<ApiResponse<{ reports: GeneratedReport[]; total: number }>> {
    const searchParams = new URLSearchParams();
    if (params?.reportType) searchParams.append('reportType', params.reportType);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/reports?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get specific report
   */
  static async getReport(id: string): Promise<ApiResponse<{ report: GeneratedReport }>> {
    const response = await apiClient.get(`/reports/${id}`);
    return response.data;
  }

  /**
   * Delete report
   */
  static async deleteReport(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete(`/reports/${id}`);
    return response.data;
  }

  /**
   * Download report
   */
  static getDownloadUrl(id: string): string {
    return `${apiClient.defaults.baseURL}/reports/${id}/download`;
  }

  /**
   * Get report versions
   */
  static async getReportVersions(id: string): Promise<ApiResponse<{ versions: ReportVersion[]; total: number }>> {
    const response = await apiClient.get(`/reports/${id}/versions`);
    return response.data;
  }

  // ===== Scheduled Reports =====

  /**
   * Schedule a report
   */
  static async scheduleReport(data: ScheduleReportData): Promise<ApiResponse<{ scheduledReport: ScheduledReport }>> {
    const response = await apiClient.post('/reports/schedule', data);
    return response.data;
  }

  /**
   * Get scheduled reports
   */
  static async getScheduledReports(): Promise<ApiResponse<{ scheduledReports: ScheduledReport[]; total: number }>> {
    const response = await apiClient.get('/reports/scheduled');
    return response.data;
  }

  /**
   * Update scheduled report
   */
  static async updateScheduledReport(id: string, data: Partial<ScheduleReportData>): Promise<ApiResponse<{ scheduledReport: ScheduledReport }>> {
    const response = await apiClient.put(`/reports/scheduled/${id}`, data);
    return response.data;
  }

  /**
   * Delete scheduled report
   */
  static async deleteScheduledReport(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete(`/reports/scheduled/${id}`);
    return response.data;
  }

  // ===== Report Sharing =====

  /**
   * Share a report
   */
  static async shareReport(id: string, data: ShareReportData): Promise<ApiResponse<{ shareId: string; message: string }>> {
    const response = await apiClient.post(`/reports/${id}/share`, data);
    return response.data;
  }

  // ===== Statistics =====

  /**
   * Get report statistics
   */
  static async getStatistics(): Promise<ApiResponse<ReportStatistics>> {
    const response = await apiClient.get('/reports/stats');
    return response.data;
  }
}

/**
 * Export default reports API instance
 */
export const reportsApi = ReportsAPI;

/**
 * Helper functions for report management
 */
export const reportHelpers = {
  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get report type display name
   */
  getReportTypeDisplayName(type: ReportType): string {
    const displayNames: Record<ReportType, string> = {
      'competitor_benchmark': '競爭對手基準分析',
      'market_position': '市場定位分析',
      'swot_analysis': 'SWOT 分析',
      'keyword_analysis': '關鍵字分析',
      'custom': '自訂報告'
    };
    return displayNames[type] || type;
  },

  /**
   * Get file format display name
   */
  getFileFormatDisplayName(format: FileFormat): string {
    const displayNames: Record<FileFormat, string> = {
      'pdf': 'PDF 文件',
      'excel': 'Excel 試算表',
      'csv': 'CSV 文件',
      'json': 'JSON 數據'
    };
    return displayNames[format] || format;
  },

  /**
   * Get status display name and color
   */
  getStatusDisplay(status: ReportStatus): { name: string; color: string } {
    const statusDisplay: Record<ReportStatus, { name: string; color: string }> = {
      'generating': { name: '生成中', color: 'blue' },
      'completed': { name: '已完成', color: 'green' },
      'failed': { name: '生成失敗', color: 'red' }
    };
    return statusDisplay[status] || { name: status, color: 'gray' };
  },

  /**
   * Check if report is downloadable
   */
  isReportDownloadable(report: GeneratedReport): boolean {
    return report.status === 'completed' && report.isAccessible && !report.isExpired;
  },

  /**
   * Format schedule display
   */
  formatSchedule(schedule: ScheduleConfig): string {
    const typeMap = {
      'daily': '每日',
      'weekly': '每週',
      'monthly': '每月', 
      'quarterly': '每季',
      'custom': '自訂'
    };
    
    let result = typeMap[schedule.type] || schedule.type;
    
    if (schedule.type === 'weekly' && schedule.dayOfWeek !== undefined) {
      const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
      result += ` ${dayNames[schedule.dayOfWeek]}`;
    }
    
    if (schedule.type === 'monthly' && schedule.dayOfMonth !== undefined) {
      result += ` ${schedule.dayOfMonth}日`;
    }
    
    result += ` ${schedule.hour.toString().padStart(2, '0')}:${schedule.minute.toString().padStart(2, '0')}`;
    
    return result;
  }
};

export default reportsApi;