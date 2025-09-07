import apiClient, { ApiResponse } from './client';

export interface DashboardOverview {
  totalWebsites: number;
  totalScans: number;
  averageGeoScore: number;
  totalMentions: number;
}

export interface RecentActivity {
  type: string;
  message: string;
  timestamp: string;
  websiteId: string;
}

export interface TopPerformingWebsite {
  websiteId: string;
  url: string;
  name: string;
  geoScore: number;
  mentions: number;
}

export interface Alert {
  type: string;
  message: string;
  timestamp: string;
  websiteId: string;
  severity: string;
}

export interface PlatformDistribution {
  platform: string;
  mentions: number;
  totalQueries: number;
  mentionRate: string;
}

export interface TimeRange {
  from: string;
  to: string;
}

export interface DashboardStats {
  overview: DashboardOverview;
  recentActivity: RecentActivity[];
  topPerforming: TopPerformingWebsite[];
  alerts: Alert[];
  platformDistribution: PlatformDistribution[];
  timeRange: TimeRange;
}

export const dashboardService = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  }
};