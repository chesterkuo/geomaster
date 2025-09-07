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

// 存儲 token 的鍵名
const TOKEN_KEY = 'geo_access_token';
const REFRESH_TOKEN_KEY = 'geo_refresh_token';
const ORGANIZATION_KEY = 'geo_organization_id';

// Clear any stale localStorage data on startup to prevent CORS issues
// This ensures fresh start without old organization ID data
const existingToken = localStorage.getItem(TOKEN_KEY);
const existingOrgId = localStorage.getItem(ORGANIZATION_KEY);

console.log('🧹 Checking existing localStorage:', {
  hasToken: !!existingToken,
  hasOrgId: !!existingOrgId,
  orgId: existingOrgId
});

// If we have org ID but no token, clear the org ID to prevent CORS issues
if (existingOrgId && !existingToken) {
  console.log('⚠️ Found orphaned organization ID without token, clearing...');
  localStorage.removeItem(ORGANIZATION_KEY);
}

// 創建 axios 實例
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    
    // Debug logging for CORS issues  
    console.log('🔍 API Request Debug:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      hasOrgId: !!orgId,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
      orgId: orgId || 'none',
      willAddOrgHeader: !!(token && orgId)
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Only add organization ID header for local development API
      // Production API (api-geo.blitzgame.site) doesn't support this header in CORS
      const isProductionAPI = API_BASE_URL.includes('api-geo.blitzgame.site');
      
      if (orgId && !isProductionAPI) {
        config.headers['X-Organization-ID'] = orgId;
        console.log('✅ Added X-Organization-ID header for local development API');
      } else if (isProductionAPI) {
        console.log('🚫 Production API detected, skipping X-Organization-ID header');
      }
    } else {
      // Explicitly ensure no org header is sent for unauthenticated requests
      delete config.headers['X-Organization-ID'];
      console.log('🚫 No token found, ensuring no X-Organization-ID header is sent');
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