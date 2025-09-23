import apiClient, { ApiResponse } from './client';

// Types for competitive analysis
export interface Competitor {
  id: string;
  name: string;
  domain: string;
  websiteUrl: string;
  isActive: boolean;
  addedAt: string;
  lastAnalyzed?: string;
  status: 'active' | 'inactive' | 'analyzing' | 'error';
}

export interface CompetitorMetrics {
  competitorId: string;
  domain: string;
  name: string;
  metrics: {
    geoScore: number;
    visibilityScore: number;
    mentionCount: number;
    averagePosition: number;
    sentimentScore: number;
    technicalScore: number;
    contentScore: number;
  };
  trends: {
    visibilityTrend: number; // percentage change
    mentionTrend: number;
    positionTrend: number;
  };
  platforms: {
    chatgpt: { mentions: number; avgPosition: number; sentiment: number; };
    perplexity: { mentions: number; avgPosition: number; sentiment: number; };
    gemini: { mentions: number; avgPosition: number; sentiment: number; };
    claude: { mentions: number; avgPosition: number; sentiment: number; };
  };
}

export interface CompetitorAnalysisData {
  websiteId: string;
  analysis: {
    yourBrand: {
      name: string;
      metrics: CompetitorMetrics['metrics'];
      marketShare: number;
    };
    competitors: Array<CompetitorMetrics & { marketShare: number; }>;
    benchmarks: {
      industryAverage: CompetitorMetrics['metrics'];
      topPerformer: CompetitorMetrics['metrics'];
    };
  };
  insights: Array<{
    type: 'opportunity' | 'threat' | 'strength' | 'weakness';
    title: string;
    description: string;
    competitor?: string;
    impact: 'high' | 'medium' | 'low';
    recommendedAction: string;
  }>;
  gapAnalysis: Array<{
    category: string;
    yourScore: number;
    competitorAverage: number;
    gap: number;
    recommendations: string[];
  }>;
}

export interface KeywordOpportunity {
  keyword: string;
  volume: number;
  difficulty: string;
  competitorRanking: Array<{
    competitor: string;
    position: number;
    mentions: number;
  }>;
  yourPosition?: number;
  opportunity: 'high' | 'medium' | 'low';
  potentialImpact: string;
}

export interface CompetitorFilters {
  websiteId?: string;
  competitorIds?: string[];
  platforms?: string[];
  timeRange?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

// API service for competitive analysis
class CompetitorsService {

  // Get list of competitors
  async getCompetitors(filters: CompetitorFilters = {}): Promise<ApiResponse<{
    competitors: Competitor[];
    total: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    
    // Remove websiteId from competitors API as it's not needed according to API docs
    const { websiteId, ...validFilters } = filters;
    
    Object.entries(validFilters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get(`/tracking/competitors?${queryParams}`);
    return response.data;
  }

  // Add a new competitor
  async addCompetitor(competitor: {
    name: string;
    websiteUrl: string;
    domain?: string;
  }): Promise<ApiResponse<Competitor>> {
    const response = await apiClient.post('/tracking/competitors', competitor);
    return response.data;
  }

  // Remove a competitor
  async removeCompetitor(competitorId: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete(`/tracking/competitors/${competitorId}`);
    return response.data;
  }

  // Update competitor information
  async updateCompetitor(competitorId: string, updates: Partial<Pick<Competitor, 'name' | 'isActive'>>): Promise<ApiResponse<Competitor>> {
    const response = await apiClient.put(`/tracking/competitors/${competitorId}`, updates);
    return response.data;
  }

  // Get competitive analysis data
  async getCompetitiveAnalysis(websiteId: string, timeRange: string = '30d'): Promise<ApiResponse<CompetitorAnalysisData>> {
    // Use 'timeframe' parameter as expected by backend, and remove websiteId from query
    const response = await apiClient.get(`/tracking/competitive-analysis?timeframe=${timeRange}`);
    return response.data;
  }

  // Analyze competitors (trigger analysis)
  async analyzeCompetitors(websiteId: string, competitorIds?: string[]): Promise<ApiResponse<{
    analysisId: string;
    status: 'started' | 'in_progress' | 'completed' | 'error';
    estimatedCompletionTime?: string;
  }>> {
    const payload = { websiteId, competitorIds };
    const response = await apiClient.post(`/analytics/competitors/analyze/${websiteId}`, payload);
    return response.data;
  }

  // Get competitor summary/overview
  async getCompetitorSummary(filters: CompetitorFilters = {}): Promise<ApiResponse<{
    summary: {
      totalCompetitors: number;
      activeCompetitors: number;
      avgGeoScore: number;
      topPerformer: {
        name: string;
        domain: string;
        geoScore: number;
      };
      marketLeader: {
        name: string;
        domain: string;
        marketShare: number;
      };
    };
    recentAnalyses: Array<{
      competitorId: string;
      name: string;
      analyzedAt: string;
      geoScore: number;
      changeFromPrevious: number;
    }>;
    alerts: Array<{
      type: 'new_competitor' | 'performance_change' | 'opportunity';
      title: string;
      description: string;
      competitor: string;
      createdAt: string;
    }>;
  }>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get(`/analytics/competitors/summary?${queryParams}`);
    return response.data;
  }

  // Get competitor benchmarks
  async getCompetitorBenchmarks(websiteId: string, competitorIds: string[]): Promise<ApiResponse<{
    benchmarks: Array<{
      competitor: CompetitorMetrics;
      comparison: {
        vsYourBrand: Record<string, { yourScore: number; theirScore: number; difference: number; }>;
        vsIndustryAverage: Record<string, { theirScore: number; industryScore: number; performance: 'above' | 'below' | 'average'; }>;
      };
    }>;
    overallComparison: {
      category: string;
      yourRank: number;
      totalCompetitors: number;
      leaders: Array<{ name: string; score: number; }>;
      laggards: Array<{ name: string; score: number; }>;
    }[];
  }>> {
    const response = await apiClient.post('/analytics/competitors/benchmarks', { websiteId, competitorIds });
    return response.data;
  }

  // Get keyword opportunities from competitor analysis
  async getKeywordOpportunities(websiteId: string, competitorIds?: string[]): Promise<ApiResponse<{
    opportunities: KeywordOpportunity[];
    categories: Array<{
      category: string;
      totalOpportunities: number;
      highImpactCount: number;
      avgDifficulty: string;
    }>;
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      description: string;
      expectedImpact: string;
      timeToImplement: string;
    }>;
  }>> {
    const payload = { websiteId, competitorIds };
    const response = await apiClient.post('/analytics/competitors/keyword-opportunities', payload);
    return response.data;
  }

  // Get competitor performance history
  async getCompetitorHistory(competitorId: string, timeRange: string = '90d'): Promise<ApiResponse<{
    competitor: Competitor;
    history: Array<{
      date: string;
      metrics: CompetitorMetrics['metrics'];
      platforms: CompetitorMetrics['platforms'];
      events?: Array<{
        type: string;
        description: string;
        impact: 'positive' | 'negative' | 'neutral';
      }>;
    }>;
    trends: {
      overallTrend: 'improving' | 'declining' | 'stable';
      keyChanges: Array<{
        metric: string;
        change: number;
        period: string;
        significance: 'major' | 'minor';
      }>;
    };
  }>> {
    const response = await apiClient.get(`/analytics/competitors/${competitorId}/history?timeRange=${timeRange}`);
    return response.data;
  }

  // Export competitive analysis report
  async exportCompetitiveAnalysis(options: {
    websiteId: string;
    competitorIds?: string[];
    format: 'csv' | 'xlsx' | 'pdf';
    timeRange: string;
    sections: Array<'overview' | 'benchmarks' | 'gaps' | 'opportunities' | 'trends'>;
  }): Promise<ApiResponse<{
    downloadUrl: string;
    fileName: string;
    expiresAt: string;
  }>> {
    const response = await apiClient.post('/analytics/competitors/export', options);
    return response.data;
  }

  // Get competitive alerts and notifications
  async getCompetitiveAlerts(websiteId: string, filters: {
    type?: string[];
    severity?: 'high' | 'medium' | 'low';
    limit?: number;
    page?: number;
  } = {}): Promise<ApiResponse<{
    alerts: Array<{
      id: string;
      type: 'performance_drop' | 'new_competitor' | 'ranking_change' | 'opportunity';
      title: string;
      description: string;
      competitor: string;
      severity: 'high' | 'medium' | 'low';
      createdAt: string;
      isRead: boolean;
      actionUrl?: string;
    }>;
    summary: {
      total: number;
      unread: number;
      highSeverity: number;
    };
  }>> {
    const queryParams = new URLSearchParams({ websiteId });
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get(`/analytics/competitors/alerts?${queryParams}`);
    return response.data;
  }
}

export const competitorsService = new CompetitorsService();
export default competitorsService;