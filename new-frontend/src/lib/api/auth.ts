import apiClient, { ApiResponse, tokenManager } from './client';

// 用戶類型
export interface User {
  id: string;
  email: string;
  fullName: string;
  company?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// 組織類型
export interface Organization {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

// 註冊請求
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  company?: string;
}

// 登入請求
export interface LoginRequest {
  email: string;
  password: string;
}

// 認證回應
export interface AuthResponse {
  user: User;
  organization: Organization;
  organizations?: Organization[];
  token: string;
  refreshToken: string;
}

// 認證服務
export const authService = {
  // 註冊
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    
    // 儲存 tokens
    if (response.data.success && response.data.data) {
      const { token, refreshToken, organization } = response.data.data;
      tokenManager.setAccessToken(token);
      tokenManager.setRefreshToken(refreshToken);
      if (organization) {
        tokenManager.setOrganizationId(organization.id);
      }
    }
    
    return response.data;
  },

  // 登入
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    
    // 儲存 tokens
    if (response.data.success && response.data.data) {
      const { token, refreshToken, organizations } = response.data.data;
      tokenManager.setAccessToken(token);
      tokenManager.setRefreshToken(refreshToken);
      
      // 如果有組織，使用第一個
      if (organizations && organizations.length > 0) {
        tokenManager.setOrganizationId(organizations[0].id);
      }
    }
    
    return response.data;
  },

  // 登出
  async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
      return response.data;
    } finally {
      // 無論成功與否，都清除本地 tokens
      tokenManager.clearTokens();
    }
  },

  // 獲取用戶資料
  async getProfile(): Promise<ApiResponse<{ user: User; organizations: Organization[] }>> {
    const response = await apiClient.get<ApiResponse<{ user: User; organizations: Organization[] }>>('/auth/profile');
    return response.data;
  },

  // 更新用戶資料
  async updateProfile(data: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    return response.data;
  },

  // 請求密碼重置
  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
    return response.data;
  },

  // 重置密碼
  async resetPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
      token,
      password
    });
    return response.data;
  },

  // 檢查是否已登入
  isAuthenticated(): boolean {
    return !!tokenManager.getAccessToken();
  }
};