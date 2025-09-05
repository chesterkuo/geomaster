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

// 頁面資料類型
export interface Page {
  id: string;
  title: string;
  url: string;
  type: '產品頁' | '部落格' | 'FAQ' | '服務頁' | '其他';
  traffic: '高' | '中' | '低';
  geoScore?: number;
  lastAnalyzedAt?: string;
  analysisStatus: 'pending' | 'analyzing' | 'completed' | 'failed';
  issues?: string[];
  estimatedImprovement?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 頁面新增資料類型
export interface PageCreateData {
  title: string;
  url: string;
  type: '產品頁' | '部落格' | 'FAQ' | '服務頁' | '其他';
  traffic: '高' | '中' | '低';
}

// 內容服務
export const contentService = {
  // 獲取優化建議
  async getOptimizationSuggestions(data: { url: string; content?: string }): Promise<ApiResponse<{
    suggestions: Array<{
      type: string;
      current: string;
      suggested: string;
      reason: string;
      priority: string;
    }>;
    geoScore: number;
    improvements: {
      current: number;
      potential: number;
    };
  }>> {
    const response = await apiClient.post('/content/optimization-suggestions', data);
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
  },

  // 頁面管理相關API
  // 獲取所有頁面
  async getPages(): Promise<ApiResponse<Page[]>> {
    const response = await apiClient.get<ApiResponse<Page[]>>('/content/pages');
    return response.data;
  },

  // 新增頁面
  async addPage(data: PageCreateData): Promise<ApiResponse<Page>> {
    const response = await apiClient.post<ApiResponse<Page>>('/content/pages', data);
    return response.data;
  },

  // 更新頁面
  async updatePage(pageId: string, data: Partial<PageCreateData>): Promise<ApiResponse<Page>> {
    const response = await apiClient.put<ApiResponse<Page>>(`/content/pages/${pageId}`, data);
    return response.data;
  },

  // 刪除頁面
  async deletePage(pageId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/content/pages/${pageId}`);
    return response.data;
  },

  // 分析單個頁面
  async analyzePage(pageId: string): Promise<ApiResponse<{
    pageId: string;
    geoScore: number;
    estimatedImprovement: number;
    issues: string[];
    message: string;
  }>> {
    const response = await apiClient.post<ApiResponse<{
      pageId: string;
      geoScore: number;
      estimatedImprovement: number;
      issues: string[];
      message: string;
    }>>(`/content/pages/${pageId}/analyze`);
    return response.data;
  },

  // 批量分析頁面
  async batchAnalyzePages(pageIds: string[]): Promise<ApiResponse<{
    message: string;
    total: number;
    successful: number;
    failed: number;
  }>> {
    const response = await apiClient.post<ApiResponse<{
      message: string;
      total: number;
      successful: number;
      failed: number;
    }>>('/content/pages/batch-analyze', { pageIds });
    return response.data;
  }
};