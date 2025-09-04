import apiClient, { ApiResponse } from './client';

// 優化建議類型
export interface OptimizationSuggestion {
  type: 'technical' | 'content' | 'seo' | 'performance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: string;
  timeframe: string;
  implementation: string[];
  resources?: string[];
}

// 優化請求類型
export interface OptimizationRequest {
  websiteId: string;
  url: string;
  focusAreas?: Array<'technical' | 'content' | 'seo' | 'performance'>;
  targetAudience?: string;
  businessGoals?: string[];
}

// 優化響應類型
export interface OptimizationResponse {
  websiteId: string;
  url: string;
  overallScore: number;
  potentialImprovement: number;
  suggestions: OptimizationSuggestion[];
  timeline: {
    phase: string;
    duration: string;
    actions: string[];
    expectedResults: string;
  }[];
  createdAt: string;
}

// 內容服務
export const contentService = {
  // 獲取優化建議
  async getOptimizationSuggestions(data: OptimizationRequest): Promise<ApiResponse<OptimizationResponse>> {
    const response = await apiClient.post<ApiResponse<OptimizationResponse>>('/content/optimization-suggestions', data);
    return response.data;
  },

  // 獲取內容分析
  async analyzeContent(websiteId: string, url: string): Promise<ApiResponse<{
    readabilityScore: number;
    keywordDensity: Record<string, number>;
    contentLength: number;
    headingStructure: Array<{ level: number; text: string }>;
    suggestions: string[];
  }>> {
    const response = await apiClient.post<ApiResponse<{
      readabilityScore: number;
      keywordDensity: Record<string, number>;
      contentLength: number;
      headingStructure: Array<{ level: number; text: string }>;
      suggestions: string[];
    }>>('/content/analyze', { websiteId, url });
    return response.data;
  },

  // 生成內容建議
  async generateContentSuggestions(data: {
    websiteId: string;
    contentType: 'blog' | 'page' | 'faq' | 'product';
    topic: string;
    targetKeywords: string[];
    tone?: 'professional' | 'casual' | 'technical' | 'friendly';
    length?: 'short' | 'medium' | 'long';
  }): Promise<ApiResponse<{
    suggestions: Array<{
      title: string;
      outline: string[];
      keypoints: string[];
      estimatedLength: number;
    }>;
    seoTips: string[];
  }>> {
    const response = await apiClient.post<ApiResponse<{
      suggestions: Array<{
        title: string;
        outline: string[];
        keypoints: string[];
        estimatedLength: number;
      }>;
      seoTips: string[];
    }>>('/content/suggestions', data);
    return response.data;
  },

  // 競爭對手內容分析
  async analyzeCompetitors(websiteId: string, competitors: string[]): Promise<ApiResponse<{
    competitors: Array<{
      url: string;
      contentScore: number;
      strengths: string[];
      opportunities: string[];
      keyTopics: string[];
    }>;
    insights: string[];
    recommendations: string[];
  }>> {
    const response = await apiClient.post<ApiResponse<{
      competitors: Array<{
        url: string;
        contentScore: number;
        strengths: string[];
        opportunities: string[];
        keyTopics: string[];
      }>;
      insights: string[];
      recommendations: string[];
    }>>('/content/competitor-analysis', { websiteId, competitors });
    return response.data;
  }
};