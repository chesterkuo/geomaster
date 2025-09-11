import apiClient, { ApiResponse } from './client';

// Types for visibility tracking
export interface VisibilityTrend {
  date: string;
  chatgpt: number;
  perplexity: number;
  gemini: number;
  claude: number;
}

export interface PlatformMention {
  id: string;
  platform: 'chatgpt' | 'perplexity' | 'gemini' | 'claude';
  query: string;
  mention: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  isCited: boolean;
  citationPosition?: number;
  timestamp: string;
  url?: string;
}

export interface PlatformPerformance {
  platform: string;
  mentionRate: number;
  change: number;
  position: number;
  totalMentions: number;
  averageSentiment: number;
}

export interface VisibilityStats {
  brandMentionRate: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  averagePosition: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  sentimentScore: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
}

export interface VisibilityFilters {
  websiteId?: string;
  platform?: string;
  dateRange?: string;
  period?: string;
  page?: number;
  limit?: number;
}

export interface VisibilityExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  dateRange: string;
  platforms: string[];
  includeDetails: boolean;
}

// API service for visibility tracking
class VisibilityService {
  
  // Get visibility trends over time
  async getVisibilityTrends(params: VisibilityFilters = {}): Promise<ApiResponse<{
    trends: VisibilityTrend[];
    summary: {
      averageVisibility: number;
      growth: number;
      topPerformingPlatform: string;
      totalMentions: number;
      totalQueries: number;
    };
  }>> {
    // websiteId is required by backend
    if (!params.websiteId) {
      throw new Error('websiteId is required for visibility trends');
    }
    
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/tracking/visibility-trends?${queryParams}`);
    return response.data;
  }

  // Get AI platform mentions
  async getMentions(params: VisibilityFilters = {}): Promise<ApiResponse<{
    mentions: PlatformMention[];
    summary: {
      total: number;
      byPlatform: Record<string, number>;
      bySentiment: Record<string, number>;
    };
  }>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        // Skip 'period' parameter as it's not supported by mentions endpoint
        // The mentions endpoint uses 'dateRange' instead
        if (key !== 'period') {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get(`/tracking/mentions?${queryParams}`);
    return response.data;
  }

  // Get platform performance data
  async getPlatformPerformance(params: VisibilityFilters = {}): Promise<ApiResponse<{
    platforms: PlatformPerformance[];
    overall: VisibilityStats;
  }>> {
    try {
      // Get mentions data to calculate platform performance
      const mentionsResponse = await this.getMentions({ ...params, limit: 100 });
      const mentions = mentionsResponse.data.mentions;

      // Calculate platform performance metrics
      const platformStats: Record<string, {
        mentions: PlatformMention[];
        totalMentions: number;
        cited: number;
        avgPosition: number;
        sentiment: Record<string, number>;
      }> = {};

      // Initialize platform data
      ['chatgpt', 'perplexity', 'gemini', 'claude'].forEach(platform => {
        platformStats[platform] = {
          mentions: [],
          totalMentions: 0,
          cited: 0,
          avgPosition: 0,
          sentiment: { positive: 0, neutral: 0, negative: 0 }
        };
      });

      // Aggregate mention data by platform
      mentions.forEach(mention => {
        const platform = mention.platform.toLowerCase();
        if (platformStats[platform]) {
          platformStats[platform].mentions.push(mention);
          platformStats[platform].totalMentions++;
          if (mention.isCited) platformStats[platform].cited++;
          platformStats[platform].sentiment[mention.sentiment]++;
        }
      });

      // Calculate performance metrics for each platform
      const platforms: PlatformPerformance[] = Object.entries(platformStats).map(([platform, stats]) => {
        const positions = stats.mentions
          .filter(m => m.citationPosition)
          .map(m => m.citationPosition!)
          .filter(p => p > 0);
        
        const avgPosition = positions.length > 0 
          ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length 
          : 0;

        const mentionRate = stats.totalMentions > 0 ? (stats.cited / stats.totalMentions) * 100 : 0;
        const averageSentiment = stats.totalMentions > 0 
          ? (stats.sentiment.positive * 2 + stats.sentiment.neutral * 1) / stats.totalMentions 
          : 0;

        return {
          platform: platform.charAt(0).toUpperCase() + platform.slice(1),
          mentionRate: Math.round(mentionRate * 100) / 100,
          change: Math.floor(Math.random() * 20) - 10, // Mock change data
          position: Math.round(avgPosition * 100) / 100,
          totalMentions: stats.totalMentions,
          averageSentiment: Math.round(averageSentiment * 100) / 100
        };
      });

      // Calculate overall stats
      const totalMentions = mentions.length;
      const citedMentions = mentions.filter(m => m.isCited).length;
      const brandMentionRate = totalMentions > 0 ? (citedMentions / totalMentions) * 100 : 0;
      
      const allPositions = mentions
        .filter(m => m.citationPosition)
        .map(m => m.citationPosition!);
      const avgPosition = allPositions.length > 0 
        ? allPositions.reduce((sum, pos) => sum + pos, 0) / allPositions.length 
        : 0;

      const sentimentScore = totalMentions > 0 
        ? (mentions.filter(m => m.sentiment === 'positive').length / totalMentions) * 100 
        : 0;

      const overall: VisibilityStats = {
        brandMentionRate: {
          value: Math.round(brandMentionRate * 100) / 100,
          change: Math.floor(Math.random() * 20) - 10,
          trend: brandMentionRate > 50 ? 'up' : 'down'
        },
        averagePosition: {
          value: Math.round(avgPosition * 100) / 100,
          change: Math.floor(Math.random() * 10) - 5,
          trend: avgPosition < 3 ? 'up' : 'down'
        },
        sentimentScore: {
          value: Math.round(sentimentScore * 100) / 100,
          change: Math.floor(Math.random() * 15) - 7,
          trend: sentimentScore > 60 ? 'up' : 'down'
        }
      };

      return {
        success: true,
        data: {
          platforms,
          overall
        }
      };
    } catch (error) {
      console.error('Error getting platform performance:', error);
      throw error;
    }
  }

  // Get visibility statistics for dashboard (using mentions data as backend doesn't have visibility-stats endpoint)
  async getVisibilityStats(websiteId?: string): Promise<ApiResponse<VisibilityStats & {
    platformDistribution: Record<string, number>;
    recentTrends: VisibilityTrend[];
  }>> {
    try {
      // Since visibility-stats endpoint doesn't exist, we'll use mentions data to calculate stats
      const mentionsResponse = await this.getMentions({ websiteId, limit: 100 });
      const mentions = mentionsResponse.data.mentions;
      
      // Calculate platform distribution
      const platformDistribution: Record<string, number> = {};
      mentions.forEach(mention => {
        platformDistribution[mention.platform] = (platformDistribution[mention.platform] || 0) + 1;
      });

      // Calculate visibility stats from mentions data
      const totalMentions = mentions.length;
      const citedMentions = mentions.filter(m => m.isCited).length;
      const brandMentionRate = totalMentions > 0 ? (citedMentions / totalMentions) * 100 : 0;
      
      const avgPosition = mentions
        .filter(m => m.citationPosition)
        .reduce((sum, m) => sum + (m.citationPosition || 0), 0) / Math.max(1, mentions.filter(m => m.citationPosition).length);

      const sentimentScore = mentions.length > 0 
        ? (mentions.filter(m => m.sentiment === 'positive').length / mentions.length) * 100 
        : 0;

      // Generate mock recent trends for now
      const recentTrends: VisibilityTrend[] = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          chatgpt: Math.floor(Math.random() * 50) + 25,
          perplexity: Math.floor(Math.random() * 40) + 20,
          gemini: Math.floor(Math.random() * 45) + 15,
          claude: Math.floor(Math.random() * 35) + 10
        };
      });

      return {
        success: true,
        data: {
          brandMentionRate: {
            value: Math.round(brandMentionRate * 100) / 100,
            change: Math.floor(Math.random() * 20) - 10,
            trend: brandMentionRate > 50 ? 'up' : 'down'
          },
          averagePosition: {
            value: Math.round(avgPosition * 100) / 100 || 0,
            change: Math.floor(Math.random() * 10) - 5,
            trend: avgPosition < 3 ? 'up' : 'down'
          },
          sentimentScore: {
            value: Math.round(sentimentScore * 100) / 100,
            change: Math.floor(Math.random() * 15) - 7,
            trend: sentimentScore > 60 ? 'up' : 'down'
          },
          platformDistribution,
          recentTrends
        }
      };
    } catch (error) {
      console.error('Error getting visibility stats:', error);
      throw error;
    }
  }

  // Export visibility data
  async exportVisibilityData(options: VisibilityExportOptions): Promise<ApiResponse<{
    downloadUrl: string;
    fileName: string;
  }>> {
    const response = await apiClient.post('/tracking/export-visibility', options);
    return response.data;
  }

  // Get visibility insights and recommendations
  async getVisibilityInsights(websiteId: string, period: string = '30d'): Promise<ApiResponse<{
    insights: Array<{
      type: 'opportunity' | 'alert' | 'trend';
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      actionable: boolean;
    }>;
    recommendations: Array<{
      category: string;
      suggestion: string;
      priority: 'high' | 'medium' | 'low';
      estimatedImpact: string;
    }>;
  }>> {
    const response = await apiClient.get(`/tracking/insights?websiteId=${websiteId}&period=${period}`);
    return response.data;
  }

  // Get historical visibility data for charts
  async getVisibilityHistory(websiteId: string, timeRange: '7d' | '30d' | '90d' | '12m' = '30d'): Promise<ApiResponse<{
    history: Array<{
      date: string;
      platforms: Record<string, {
        visibility: number;
        mentions: number;
        sentiment: number;
      }>;
      overallScore: number;
    }>;
    comparison: {
      previousPeriod: number;
      industryBenchmark: number;
      competitorAverage: number;
    };
  }>> {
    const response = await apiClient.get(`/tracking/history?websiteId=${websiteId}&timeRange=${timeRange}`);
    return response.data;
  }

  // Search mentions by keyword
  async searchMentions(query: string, params: VisibilityFilters = {}): Promise<ApiResponse<{
    mentions: PlatformMention[];
    total: number;
    relatedKeywords: string[];
  }>> {
    const queryParams = new URLSearchParams({ query });
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        // Skip 'period' parameter as it's not supported by mentions endpoint
        // The mentions endpoint uses 'dateRange' instead
        if (key !== 'period') {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get(`/tracking/search-mentions?${queryParams}`);
    return response.data;
  }

  // Get platform-specific analytics
  async getPlatformAnalytics(platform: string, websiteId?: string, timeRange: string = '30d'): Promise<ApiResponse<{
    platform: string;
    metrics: {
      totalMentions: number;
      averagePosition: number;
      sentimentBreakdown: Record<string, number>;
      topQueries: Array<{ query: string; mentions: number; avgPosition: number; }>;
      trends: VisibilityTrend[];
    };
    competitorComparison: Array<{
      competitor: string;
      mentions: number;
      averagePosition: number;
    }>;
  }>> {
    const params = new URLSearchParams({ platform, timeRange });
    if (websiteId) params.append('websiteId', websiteId);

    const response = await apiClient.get(`/tracking/platform-analytics?${params}`);
    return response.data;
  }
}

export const visibilityService = new VisibilityService();
export default visibilityService;