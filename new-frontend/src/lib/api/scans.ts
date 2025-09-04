import apiClient, { ApiResponse } from './client';

// 掃描類型
export type ScanType = 'quick' | 'standard' | 'comprehensive';

// 掃描狀態
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';

// 掃描結果類型
export interface Scan {
  id: string;
  websiteId: string;
  scanType: ScanType;
  status: ScanStatus;
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  results?: ScanResults;
  createdAt: string;
  updatedAt: string;
  website?: {
    id: string;
    url: string;
    domain: string;
    name: string;
  };
}

// 基礎掃描結果（免費版）
export interface BasicScanResults {
  score: number;
  summary: {
    status: 'good' | 'warning' | 'critical';
    message: string;
    keyIssues: string[];
  };
  preview: {
    technicalHealth: number;
    contentQuality: number;
    aiVisibility: number;
  };
  upgradeReasons: string[];
}

// 完整掃描結果（付費版）
export interface DetailedScanResults {
  score: number;
  technicalHealth: {
    weight: number;
    score: number;
    items: ScanItem[];
  };
  contentQuality: {
    weight: number;
    score: number;
    items: ScanItem[];
  };
  aiVisibility: {
    weight: number;
    score: number;
    items: ScanItem[];
  };
  competitors: {
    averageScore: number;
    ranking: number;
    totalCompetitors: number;
    details: Array<{
      name: string;
      score: number;
      strengths: string[];
    }>;
  };
  optimization: {
    potentialTrafficGain: number;
    potentialConversionGain: number;
    priorityActions: Array<{
      action: string;
      impact: 'high' | 'medium' | 'low';
      difficulty: 'easy' | 'medium' | 'hard';
      timeframe: string;
    }>;
    roadmap: Array<{
      phase: string;
      duration: string;
      actions: string[];
      expectedResults: string;
    }>;
  };
}

// 統一掃描結果類型
export type ScanResults = BasicScanResults | DetailedScanResults;

// 掃描項目
export interface ScanItem {
  name: string;
  status: 'good' | 'warning' | 'critical';
  detail: string;
  score?: number;
  recommendation?: string;
}

// 開始掃描請求
export interface StartScanRequest {
  websiteId: string;
  scanType: ScanType;
}

// 掃描服務
export const scanService = {
  // 開始新掃描
  async start(data: StartScanRequest): Promise<ApiResponse<Scan>> {
    const response = await apiClient.post<ApiResponse<Scan>>('/scans', data);
    return response.data;
  },

  // 開始網站掃描（不需要 websiteId）
  async startWebsiteScan(url: string, scanType: ScanType = 'quick'): Promise<ApiResponse<Scan & { websiteId: string }>> {
    // 先創建或查找網站
    const websiteResponse = await apiClient.post('/websites/scan-init', {
      url,
      name: new URL(url).hostname
    });
    
    const websiteId = websiteResponse.data.data.website.id;
    
    // 開始掃描 (包含URL以供後端直接使用)
    const response = await apiClient.post<ApiResponse<Scan>>('/scans', {
      websiteId,
      scanType,
      url  // 添加 URL 參數供後端直接使用
    });
    
    return {
      ...response.data,
      data: {
        ...response.data.data,
        websiteId
      }
    };
  },

  // 匿名掃描（免費診斷）
  async startAnonymousScan(url: string): Promise<ApiResponse<Scan & { websiteId: string }>> {
    // 使用公開端點進行匿名掃描
    const response = await apiClient.post<ApiResponse<Scan & { websiteId: string }>>('/scans/anonymous', {
      url,
      scanType: 'basic'
    });
    
    return response.data;
  },

  // 獲取匿名掃描狀態（免費診斷）
  async getAnonymousStatus(scanId: string): Promise<ApiResponse<Scan>> {
    const response = await apiClient.get<ApiResponse<Scan>>(`/scans/anonymous/${scanId}`);
    return response.data;
  },

  // 獲取掃描狀態
  async getStatus(scanId: string): Promise<ApiResponse<Scan>> {
    const response = await apiClient.get<ApiResponse<Scan>>(`/scans/${scanId}`);
    return response.data;
  },

  // 獲取掃描列表
  async getList(params?: {
    websiteId?: string;
    status?: ScanStatus;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Scan[]>> {
    const response = await apiClient.get<ApiResponse<Scan[]>>('/scans', {
      params
    });
    return response.data;
  },

  // 取消掃描
  async cancel(scanId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/scans/${scanId}/cancel`);
    return response.data;
  },

  // 重新執行掃描
  async retry(scanId: string): Promise<ApiResponse<Scan>> {
    const response = await apiClient.post<ApiResponse<Scan>>(`/scans/${scanId}/retry`);
    return response.data;
  },

  // 獲取掃描結果報告
  async getReport(scanId: string): Promise<ApiResponse<{ 
    scan: Scan; 
    detailedResults: ScanResults; 
    recommendations: string[] 
  }>> {
    const response = await apiClient.get<ApiResponse<{ 
      scan: Scan; 
      detailedResults: ScanResults; 
      recommendations: string[] 
    }>>(`/scans/${scanId}/report`);
    return response.data;
  },

  // 輪詢掃描狀態直到完成
  async pollStatus(scanId: string, interval: number = 3000, maxAttempts: number = 60): Promise<Scan> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await this.getStatus(scanId);
      const scan = response.data;
      
      if (scan.status === 'completed' || scan.status === 'failed') {
        return scan;
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    }
    
    throw new Error('掃描超時');
  }
};