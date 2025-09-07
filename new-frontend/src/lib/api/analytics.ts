import apiClient, { ApiResponse } from './client';

// Analytics Dashboard Types
export interface AnalyticsDashboard {
  overview: {
    totalViews: number;
    uniqueVisitors: number;
    averageSessionDuration: string;
    bounceRate: number;
    growth: {
      views: number;
      visitors: number;
      sessionDuration: number;
      bounceRate: number;
    };
  };
  trafficSources: {
    organic: number;
    direct: number;
    social: number;
    referral: number;
    email: number;
    paid: number;
  };
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  topPages: Array<{
    path: string;
    views: number;
    uniqueViews: number;
    bounceRate: number;
    avgTimeOnPage: string;
  }>;
  realtimeUsers: number;
}

// Analytics Trends Types
export interface AnalyticsTrends {
  period: string;
  trends: Array<{
    date: string;
    views: number;
    visitors: number;
    sessions: number;
    bounceRate: number;
  }>;
  comparison: {
    viewsChange: number;
    visitorsChange: number;
    sessionsChange: number;
    bounceRateChange: number;
  };
}

// Platform Performance Types
export interface PlatformPerformance {
  platforms: Array<{
    name: string;
    views: number;
    uniqueVisitors: number;
    conversionRate: number;
    revenue: number;
  }>;
  summary: {
    totalPlatforms: number;
    bestPerforming: string;
    averageConversion: number;
    totalRevenue: number;
  };
}

// Analytics Snapshot Types
export interface AnalyticsSnapshot {
  id: string;
  websiteId: string;
  snapshotType: 'daily' | 'weekly' | 'monthly';
  data: {
    views: number;
    visitors: number;
    sessions: number;
    bounceRate: number;
    avgSessionDuration: string;
    topPages: Array<{
      path: string;
      views: number;
    }>;
  };
  createdAt: string;
}

// Performance Insights Types
export interface PerformanceInsights {
  insights: Array<{
    type: 'improvement' | 'warning' | 'opportunity';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
    metrics?: {
      current: number;
      target: number;
      unit: string;
    };
  }>;
  score: {
    overall: number;
    traffic: number;
    engagement: number;
    conversion: number;
  };
}

// Competitor Analysis Types
export interface CompetitorAnalysis {
  competitors: Array<{
    domain: string;
    estimatedTraffic: number;
    topKeywords: string[];
    marketShare: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  benchmarks: {
    trafficGap: number;
    keywordOpportunities: number;
    contentGaps: string[];
    recommendations: string[];
  };
  marketPosition: {
    rank: number;
    totalCompetitors: number;
    marketShare: number;
  };
}

// Bulk Snapshot Request Types
export interface BulkSnapshotRequest {
  websiteIds: string[];
  snapshotType: 'daily' | 'weekly' | 'monthly';
  includeComparison: boolean;
}

export interface BulkSnapshotResponse {
  snapshots: AnalyticsSnapshot[];
  summary: {
    totalProcessed: number;
    successful: number;
    failed: number;
    averageProcessingTime: number;
  };
}

// Request Parameters
export interface AnalyticsParams {
  websiteId?: string;
  period?: '7d' | '30d' | '90d' | '1y';
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface SnapshotParams {
  websiteId: string;
  type: 'daily' | 'weekly' | 'monthly';
  includeComparison?: boolean;
}

export const analyticsService = {
  // Get analytics dashboard data
  async getDashboard(websiteId: string): Promise<ApiResponse<AnalyticsDashboard>> {
    const response = await apiClient.get<ApiResponse<AnalyticsDashboard>>(
      `/analytics/dashboard/${websiteId}`
    );
    return response.data;
  },

  // Get analytics trends
  async getTrends(websiteId: string, params?: AnalyticsParams): Promise<ApiResponse<AnalyticsTrends>> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.granularity) queryParams.append('granularity', params.granularity);
    
    const response = await apiClient.get<ApiResponse<AnalyticsTrends>>(
      `/analytics/trends/${websiteId}?${queryParams.toString()}`
    );
    return response.data;
  },

  // Get platform performance
  async getPlatformPerformance(websiteId: string, params?: AnalyticsParams): Promise<ApiResponse<PlatformPerformance>> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    
    const response = await apiClient.get<ApiResponse<PlatformPerformance>>(
      `/analytics/platforms/${websiteId}?${queryParams.toString()}`
    );
    return response.data;
  },

  // Generate analytics snapshot
  async generateSnapshot(params: SnapshotParams): Promise<ApiResponse<AnalyticsSnapshot>> {
    const response = await apiClient.post<ApiResponse<AnalyticsSnapshot>>(
      `/analytics/snapshot/${params.websiteId}`,
      {
        type: params.type,
        includeComparison: params.includeComparison || false
      }
    );
    return response.data;
  },

  // Get performance insights
  async getInsights(websiteId: string): Promise<ApiResponse<PerformanceInsights>> {
    const response = await apiClient.get<ApiResponse<PerformanceInsights>>(
      `/analytics/insights/${websiteId}`
    );
    return response.data;
  },

  // Analyze competitors
  async analyzeCompetitors(websiteId: string): Promise<ApiResponse<CompetitorAnalysis>> {
    const response = await apiClient.post<ApiResponse<CompetitorAnalysis>>(
      `/analytics/competitors/analyze/${websiteId}`
    );
    return response.data;
  },

  // Get competitor summary
  async getCompetitorSummary(): Promise<ApiResponse<{
    totalAnalyzed: number;
    recentAnalyses: Array<{
      websiteId: string;
      analyzedAt: string;
      competitorsFound: number;
      marketPosition: number;
    }>;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/analytics/competitors/summary'
    );
    return response.data;
  },

  // Bulk generate snapshots (admin only)
  async bulkGenerateSnapshots(request: BulkSnapshotRequest): Promise<ApiResponse<BulkSnapshotResponse>> {
    const response = await apiClient.post<ApiResponse<BulkSnapshotResponse>>(
      '/analytics/snapshots/bulk',
      request
    );
    return response.data;
  },

  // Get historical snapshots
  async getSnapshots(websiteId: string, params?: {
    type?: 'daily' | 'weekly' | 'monthly';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    snapshots: AnalyticsSnapshot[];
    total: number;
    hasMore: boolean;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics/snapshots/${websiteId}?${queryParams.toString()}`
    );
    return response.data;
  }
};

export default analyticsService;