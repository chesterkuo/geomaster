import apiClient, { ApiResponse } from './client';

// Keyword types
export interface Keyword {
  id: string;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
  createdAt: string;
  updatedAt: string;
}

export interface KeywordCreateData {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
}

export interface KeywordType {
  id: string;
  name: string;
  description: string;
  count: number;
}

// Competitor types
export interface Competitor {
  id: string;
  websiteUrl: string;
  domain: string;
  name?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorCreateData {
  websiteUrl: string;
  name?: string;
}

export interface CompetitiveAnalysis {
  organization: {
    websites: Array<{ id: string; domain: string; name: string }>;
    totalMentions: number;
    totalCitations: number;
    platformBreakdown: Record<string, { mentions: number; citations: number }>;
  };
  competitors: Array<{
    id: string;
    domain: string;
    name: string;
    mentions: number;
    citations: number;
    platformBreakdown: Record<string, { mentions: number; citations: number }>;
  }>;
  timeframe: {
    start: string;
    end: string;
    period: string;
  };
}

// Tracking Settings types
export interface TrackingSettings {
  id: string;
  trackingEnabled: boolean;
  trackingFrequency: 'hourly' | 'daily' | 'weekly';
  platforms: string[];
  alertsEnabled: boolean;
  alertThreshold: number;
  alertEmails: string[];
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingSettingsUpdateData {
  trackingEnabled?: boolean;
  trackingFrequency?: 'hourly' | 'daily' | 'weekly';
  platforms?: string[];
  alertsEnabled?: boolean;
  alertThreshold?: number;
  alertEmails?: string[];
  settings?: Record<string, any>;
}

// Platform Settings types
export interface PlatformSettings {
  id: string;
  platform: 'chatgpt' | 'gemini' | 'perplexity' | 'claude';
  enabled: boolean;
  settings: Record<string, any>;
  apiKey?: string;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConfigData {
  platform: 'chatgpt' | 'gemini' | 'perplexity' | 'claude';
  enabled?: boolean;
  settings?: Record<string, any>;
  apiKey?: string;
}

export interface AvailablePlatform {
  id: string;
  name: string;
  description: string;
  icon: string;
  supported: boolean;
}

// AI Search API service
export const aiSearchService = {
  // Keyword Management APIs
  
  // GET /api/v1/tracking/keywords - List keywords
  async getKeywords(params?: {
    type?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{
    keywords: Keyword[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>> {
    const response = await apiClient.get('/tracking/keywords', { params });
    return response.data;
  },

  // POST /api/v1/tracking/keywords - Create keyword
  async createKeyword(data: KeywordCreateData): Promise<ApiResponse<Keyword>> {
    const response = await apiClient.post('/tracking/keywords', data);
    return response.data;
  },

  // PUT /api/v1/tracking/keywords/:id - Update keyword
  async updateKeyword(id: string, data: Partial<KeywordCreateData>): Promise<ApiResponse<Keyword>> {
    const response = await apiClient.put(`/tracking/keywords/${id}`, data);
    return response.data;
  },

  // DELETE /api/v1/tracking/keywords/:id - Delete keyword
  async deleteKeyword(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete(`/tracking/keywords/${id}`);
    return response.data;
  },

  // GET /api/v1/tracking/keyword-types - Get keyword types
  async getKeywordTypes(): Promise<ApiResponse<KeywordType[]>> {
    const response = await apiClient.get('/tracking/keyword-types');
    return response.data;
  },

  // Tracking Configuration APIs

  // GET /api/v1/tracking/settings - Get tracking settings
  async getTrackingSettings(): Promise<ApiResponse<TrackingSettings>> {
    const response = await apiClient.get('/tracking/settings');
    return response.data;
  },

  // PUT /api/v1/tracking/settings - Update tracking settings
  async updateTrackingSettings(data: TrackingSettingsUpdateData): Promise<ApiResponse<TrackingSettings>> {
    const response = await apiClient.put('/tracking/settings', data);
    return response.data;
  },

  // POST /api/v1/tracking/platforms - Configure platform
  async configurePlatform(data: PlatformConfigData): Promise<ApiResponse<PlatformSettings>> {
    const response = await apiClient.post('/tracking/platforms', data);
    return response.data;
  },

  // GET /api/v1/tracking/platforms - Get platform settings
  async getPlatformSettings(): Promise<ApiResponse<PlatformSettings[]>> {
    const response = await apiClient.get('/tracking/platforms');
    return response.data;
  },

  // GET /api/v1/tracking/platforms/available - Get available platforms
  async getAvailablePlatforms(): Promise<ApiResponse<AvailablePlatform[]>> {
    const response = await apiClient.get('/tracking/platforms/available');
    return response.data;
  },

  // Competition Analysis APIs

  // GET /api/v1/tracking/competitors - List competitors
  async getCompetitors(params?: {
    page?: number;
    limit?: number;
    active?: boolean;
  }): Promise<ApiResponse<{
    competitors: Competitor[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>> {
    const response = await apiClient.get('/tracking/competitors', { params });
    return response.data;
  },

  // POST /api/v1/tracking/competitors - Add competitor
  async addCompetitor(data: CompetitorCreateData): Promise<ApiResponse<Competitor>> {
    const response = await apiClient.post('/tracking/competitors', data);
    return response.data;
  },

  // DELETE /api/v1/tracking/competitors/:id - Remove competitor
  async removeCompetitor(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete(`/tracking/competitors/${id}`);
    return response.data;
  },

  // PUT /api/v1/tracking/competitors/:id - Update competitor
  async updateCompetitor(id: string, data: Partial<CompetitorCreateData & { isActive?: boolean }>): Promise<ApiResponse<Competitor>> {
    const response = await apiClient.put(`/tracking/competitors/${id}`, data);
    return response.data;
  },

  // GET /api/v1/tracking/competitive-analysis - Get competitive analysis
  async getCompetitiveAnalysis(params?: {
    timeframe?: '7d' | '30d' | '90d';
    platform?: string;
  }): Promise<ApiResponse<CompetitiveAnalysis>> {
    const response = await apiClient.get('/tracking/competitive-analysis', { params });
    return response.data;
  },

};