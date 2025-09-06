import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// API 配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.74.100.10:8000';
const API_VERSION = '/api/v1';

// Debug log to verify environment variable
console.log('🔧 API Client Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL,
  FULL_API_URL: `${API_BASE_URL}${API_VERSION}`
});

// 創建 axios 實例
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 存儲 token 的鍵名
const TOKEN_KEY = 'geo_access_token';
const REFRESH_TOKEN_KEY = 'geo_refresh_token';
const ORGANIZATION_KEY = 'geo_organization_id';

// Token 管理
export const tokenManager = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getOrganizationId: () => localStorage.getItem(ORGANIZATION_KEY),
  
  setAccessToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  setOrganizationId: (orgId: string) => localStorage.setItem(ORGANIZATION_KEY, orgId),
  
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ORGANIZATION_KEY);
  }
};

// 請求攔截器 - 添加認證 token 和組織 ID
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    const orgId = tokenManager.getOrganizationId();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (orgId) {
      config.headers['X-Organization-ID'] = orgId;
    }
    
    // Debug logging for authentication issues  
    if (config.url?.includes('/content/') || config.url?.includes('optimization')) {
      console.log('🔍 API Request Debug:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        hasOrgId: !!orgId,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
        orgId: orgId || 'none',
        headers: config.headers
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 回應攔截器 - 處理錯誤和 token 刷新
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // 如果是 401 錯誤且有 refresh token，嘗試刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = tokenManager.getRefreshToken();
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}${API_VERSION}/auth/refresh`, {
            refreshToken
          });
          
          const { token, refreshToken: newRefreshToken } = response.data.data;
          tokenManager.setAccessToken(token);
          tokenManager.setRefreshToken(newRefreshToken);
          
          // 重試原始請求
          return apiClient(originalRequest);
        } catch (refreshError) {
          // 刷新失敗，清除 tokens 並跳轉到登入頁
          tokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// API 回應類型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API 錯誤類型
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export default apiClient;