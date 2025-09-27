import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import i18n from '@/i18n';
import { secureTokenManager } from '@/lib/secure-storage';
import { logger } from '@/lib/secure-logger';

// API 配置 - Environment-based configuration
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'https://api-geo-staging.boxtradex.io' : 'https://api-geo.boxtradex.io');
const API_VERSION = '/api/v1';

// Environment configuration check (development only)
logger.info('API Client initialized', { API_BASE_URL });

// Clear any stale localStorage data on startup to prevent CORS issues
// This ensures fresh start without old organization ID data
const existingToken = secureTokenManager.getAccessToken();
const existingOrgId = secureTokenManager.getOrganizationId();

// Clean up orphaned organization data
if (existingOrgId && !existingToken) {
  secureTokenManager.setOrganizationId('');
}

// 創建 axios 實例
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: 30000,
  // Note: withCredentials removed - using JWT-only authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token 管理 - Now using secure storage
export const tokenManager = secureTokenManager;

// 請求攔截器 - 添加認證 token 和組織 ID
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    const orgId = tokenManager.getOrganizationId();
    const currentLocale = i18n.language || 'en-US';

    // Request configuration logging (development only)
    logger.apiRequest(config.url || '', config.method || 'GET');

    // Always add locale header for internationalization
    config.headers['Accept-Language'] = currentLocale;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // Only add organization ID header for local development API
      // Production API (boxtradex.io) doesn't support this header in CORS
      const isProductionAPI = API_BASE_URL.includes('boxtradex.io');

      if (orgId && !isProductionAPI) {
        config.headers['X-Organization-ID'] = orgId;
        // X-Organization-ID header added for local development
      } else if (isProductionAPI) {
        // Production API - skipping X-Organization-ID header
      }
    } else {
      // Explicitly ensure no org header is sent for unauthenticated requests
      delete config.headers['X-Organization-ID'];
      // No token - ensuring no X-Organization-ID header is sent
    }

    // Accept-Language header configured

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });

  failedQueue = [];
};

// 回應攔截器 - 處理錯誤和 token 刷新
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Log API errors for debugging
    logger.apiError('API request failed', {
      status: error.response?.status,
      url: originalRequest?.url
    });

    // 如果是 401 錯誤且有 refresh token，嘗試刷新
    if (error.response?.status === 401 && !originalRequest?._retry) {
      const refreshToken = tokenManager.getRefreshToken();

      if (refreshToken) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (originalRequest?.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest!);
          }).catch((err) => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        isRefreshing = true;

        try {
          // Attempting token refresh
          const response = await axios.post(`${API_BASE_URL}${API_VERSION}/auth/refresh`, {
            refreshToken
          });

          const { token, refreshToken: newRefreshToken } = response.data.data;
          tokenManager.setAccessToken(token);
          tokenManager.setRefreshToken(newRefreshToken);

          // Token refresh successful

          // Dispatch success event
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('auth:token-refresh-success');
            window.dispatchEvent(event);
          }

          processQueue(null, token);

          // Update authorization header and retry
          if (originalRequest?.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }

          return apiClient(originalRequest!);
        } catch (refreshError: any) {
          logger.error('Token refresh failed', { error: refreshError });

          // More specific error handling
          const refreshErrorStatus = refreshError.response?.status;
          const refreshErrorMessage = refreshError.response?.data?.message || refreshError.message;

          processQueue(refreshError, null);

          // Only clear tokens and redirect if refresh token is truly invalid
          if (refreshErrorStatus === 401 || refreshErrorStatus === 403) {
            // Refresh token invalid, clearing session
            tokenManager.clearTokens();

            // Graceful redirect with notification
            if (typeof window !== 'undefined') {
              // Show user-friendly message before redirect
              const event = new CustomEvent('auth:session-expired', {
                detail: { message: 'Your session has expired. Please log in again.' }
              });
              window.dispatchEvent(event);

              // Delay redirect to allow user to see the message
              setTimeout(() => {
                window.location.href = '/login';
              }, 2000);
            }
          } else {
            // For other errors (network, server issues), don't force logout
            // Temporary refresh failure, keeping session

            // Dispatch failure event for non-critical errors
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('auth:token-refresh-failure', {
                detail: { message: refreshErrorMessage, status: refreshErrorStatus }
              });
              window.dispatchEvent(event);
            }
          }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available
        // No refresh token available
        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
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