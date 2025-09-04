import apiClient, { ApiResponse } from './client';

// 網站類型
export interface Website {
  id: string;
  url: string;
  name: string;
  description?: string;
  scanFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  organizationId: string;
  lastScanAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 網站內容類型
export interface WebsiteContent {
  id: string;
  websiteId: string;
  url: string;
  title: string;
  content?: string;
  metaDescription?: string;
  keywords?: string[];
  headings?: Record<string, string[]>;
  lastModified?: string;
  createdAt: string;
  updatedAt: string;
}

// 網站分析類型
export interface WebsiteAnalytics {
  website: Website;
  analytics: {
    content: {
      totalPages: number;
      avgContentLength: number;
      lastUpdated: string;
    };
    scans: {
      total: number;
      successful: number;
      failed: number;
      lastScan?: string;
    };
    aiVisibility?: {
      score: number;
      mentions: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
}

// 創建網站請求
export interface CreateWebsiteRequest {
  url: string;
  name: string;
  description?: string;
  scanFrequency?: 'daily' | 'weekly' | 'monthly' | 'manual';
}

// 更新網站請求
export interface UpdateWebsiteRequest {
  name?: string;
  description?: string;
  scanFrequency?: 'daily' | 'weekly' | 'monthly' | 'manual';
}

// 網站服務
export const websiteService = {
  // 創建網站
  async create(data: CreateWebsiteRequest): Promise<ApiResponse<{ website: Website }>> {
    const response = await apiClient.post<ApiResponse<{ website: Website }>>('/websites', data);
    return response.data;
  },

  // 獲取網站列表
  async getList(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ websites: Website[] }>> {
    const response = await apiClient.get<ApiResponse<{ websites: Website[] }>>('/websites', {
      params
    });
    return response.data;
  },

  // 獲取單個網站
  async getById(id: string): Promise<ApiResponse<{ website: Website }>> {
    const response = await apiClient.get<ApiResponse<{ website: Website }>>(`/websites/${id}`);
    return response.data;
  },

  // 更新網站
  async update(id: string, data: UpdateWebsiteRequest): Promise<ApiResponse<{ website: Website }>> {
    const response = await apiClient.put<ApiResponse<{ website: Website }>>(`/websites/${id}`, data);
    return response.data;
  },

  // 刪除網站
  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/websites/${id}`);
    return response.data;
  },

  // 獲取網站內容
  async getContent(id: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ contents: WebsiteContent[] }>> {
    const response = await apiClient.get<ApiResponse<{ contents: WebsiteContent[] }>>(`/websites/${id}/content`, {
      params
    });
    return response.data;
  },

  // 獲取網站分析
  async getAnalytics(id: string): Promise<ApiResponse<WebsiteAnalytics>> {
    const response = await apiClient.get<ApiResponse<WebsiteAnalytics>>(`/websites/${id}/analytics`);
    return response.data;
  }
};