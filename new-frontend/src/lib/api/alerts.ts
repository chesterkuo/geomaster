import apiClient, { ApiResponse } from './client';

// Alert types
export interface AlertCondition {
  metric: 'mention_count' | 'sentiment_score' | 'visibility_percentage' | 'geo_score';
  operator: 'greater_than' | 'less_than' | 'equals' | 'percentage_change';
  value: number;
  timeframe: '1h' | '1d' | '7d' | '30d';
}

export interface AlertConfiguration {
  id: string;
  organizationId: string;
  websiteId?: string;
  name: string;
  description?: string;
  alertType: 'mention_spike' | 'visibility_drop' | 'competitor_outrank' | 'score_change' | 'new_mention' | 'sentiment_change';
  conditions: AlertCondition[];
  notificationChannels?: string[];
  isActive: boolean;
  cooldownMinutes: number;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
  website?: {
    id: string;
    name: string;
    domain: string;
  };
}

export interface AlertHistory {
  id: string;
  alertConfigurationId: string;
  organizationId: string;
  alertType: string;
  triggeredAt: string;
  notificationStatus: 'pending' | 'sent' | 'failed' | 'retry';
  triggerData: any;
  notificationsSent?: string;
  failureReason?: string;
  sentAt?: string;
  retryCount: number;
  alertConfiguration?: AlertConfiguration;
}

export interface MetricsSnapshot {
  id: string;
  organizationId: string;
  websiteId: string;
  metricType: string;
  platform?: string;
  timeWindow: string;
  metricValue: number;
  previousValue?: number;
  changePercentage?: number;
  recordedAt: string;
}

export interface CreateAlertRequest {
  websiteId?: string;
  name: string;
  description?: string;
  alertType: string;
  conditions: AlertCondition[];
  notificationChannels?: string[];
  cooldownMinutes?: number;
}

export interface UpdateAlertRequest extends Partial<CreateAlertRequest> {
  isActive?: boolean;
}

export interface GetAlertsRequest {
  websiteId?: string;
  alertType?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface GetAlertHistoryRequest {
  alertConfigurationId?: string;
  websiteId?: string;
  alertType?: string;
  status?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface AlertDashboard {
  totalAlerts: number;
  activeAlerts: number;
  triggeredToday: number;
  failedNotifications: number;
  recentAlerts: AlertHistory[];
  alertsByType: Record<string, number>;
  performanceStats: {
    averageResponseTime: number;
    notificationSuccessRate: number;
    mostTriggeredAlert: string;
  };
}

// Alert API service
export const alertsApi = {
  // Alert configurations
  async createAlert(data: CreateAlertRequest): Promise<ApiResponse<AlertConfiguration>> {
    const response = await apiClient.post('/alerts/configurations', data);
    return response.data;
  },

  async getAlerts(params: GetAlertsRequest = {}): Promise<ApiResponse<AlertConfiguration[]>> {
    const response = await apiClient.get('/alerts/configurations', { params });
    return response.data;
  },

  async getAlert(id: string): Promise<ApiResponse<AlertConfiguration>> {
    const response = await apiClient.get(`/alerts/configurations/${id}`);
    return response.data;
  },

  async updateAlert(id: string, data: UpdateAlertRequest): Promise<ApiResponse<AlertConfiguration>> {
    const response = await apiClient.put(`/alerts/configurations/${id}`, data);
    return response.data;
  },

  async deleteAlert(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/alerts/configurations/${id}`);
    return response.data;
  },

  async testAlert(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await apiClient.post(`/alerts/configurations/${id}/test`);
    return response.data;
  },

  // Alert history
  async getAlertHistory(params: GetAlertHistoryRequest = {}): Promise<ApiResponse<AlertHistory[]>> {
    const response = await apiClient.get('/alerts/history', { params });
    return response.data;
  },

  async resendNotification(historyId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await apiClient.post(`/alerts/history/${historyId}/resend`);
    return response.data;
  },

  // Dashboard and metrics
  async getAlertDashboard(): Promise<ApiResponse<AlertDashboard>> {
    const response = await apiClient.get('/alerts/dashboard');
    return response.data;
  },

  async getMetricsSnapshots(params: {
    websiteId?: string;
    metricType?: string;
    platform?: string;
    timeWindow?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<MetricsSnapshot[]>> {
    const response = await apiClient.get('/alerts/metrics/snapshots', { params });
    return response.data;
  },

  // Manual triggers
  async triggerManualCheck(data: {
    websiteId?: string;
    organizationId?: string;
  }): Promise<ApiResponse<{ alertsChecked: number; alertsTriggered: number }>> {
    const response = await apiClient.post('/alerts/trigger-check', data);
    return response.data;
  },

  async collectMetrics(data: {
    websiteId?: string;
    organizationId?: string;
  }): Promise<ApiResponse<{ websitesProcessed: number; snapshotsCreated: number }>> {
    const response = await apiClient.post('/alerts/collect-metrics', data);
    return response.data;
  }
};

export default alertsApi;