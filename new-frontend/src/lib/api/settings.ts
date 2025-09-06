import apiClient, { ApiResponse } from './client';

// 設定相關介面定義
export interface OrganizationSettings {
  company: {
    name: string;
    website?: string;
    timezone: string;
    language: string;
    currency: string;
  };
  preferences: {
    autoDataSync: boolean;
    dataRetentionMonths: number;
    defaultReportFormat: string;
  };
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  passwordLastChanged: string | null;
  activeSessions: number;
  loginHistory: Array<{
    timestamp: string;
    ipAddress: string;
    location?: string;
    device: string;
  }>;
}

export interface UserPreferences {
  appearance: {
    theme: string;
    compactMode: boolean;
    animations: boolean;
    language: string;
  };
  dashboard: {
    defaultView: string;
    itemsPerPage: number;
    chartColors?: string[];
  };
}

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface TwoFactorSetup {
  qrCode: string;
  backupCodes: string[];
}

// Settings API 服務
export const settingsApi = {
  // 組織設定
  async getOrganizationSettings(): Promise<ApiResponse<OrganizationSettings>> {
    const response = await apiClient.get('/settings/organization');
    return response.data;
  },

  async updateOrganizationSettings(
    updates: Partial<OrganizationSettings['company'] & OrganizationSettings['preferences']>
  ): Promise<ApiResponse<OrganizationSettings>> {
    const response = await apiClient.put('/settings/organization', updates);
    return response.data;
  },

  // 安全設定
  async getSecuritySettings(): Promise<ApiResponse<SecuritySettings>> {
    const response = await apiClient.get('/settings/security');
    return response.data;
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.put('/settings/password', data);
    return response.data;
  },

  async getActiveSessions(): Promise<ApiResponse<ActiveSession[]>> {
    const response = await apiClient.get('/settings/security/sessions');
    return response.data;
  },

  // 用戶偏好設定
  async getUserPreferences(): Promise<ApiResponse<UserPreferences>> {
    const response = await apiClient.get('/settings/preferences');
    return response.data;
  },

  async updateUserPreferences(
    updates: Partial<UserPreferences['appearance'] & UserPreferences['dashboard']>
  ): Promise<ApiResponse<UserPreferences>> {
    const response = await apiClient.put('/settings/preferences', updates);
    return response.data;
  },

  // 兩步驗證 (2FA)
  async enable2FA(): Promise<ApiResponse<TwoFactorSetup>> {
    const response = await apiClient.post('/settings/2fa/enable');
    return response.data;
  },

  async verify2FA(token: string): Promise<ApiResponse<{ verified: boolean; message: string }>> {
    const response = await apiClient.post('/settings/2fa/verify', { token });
    return response.data;
  },

  async disable2FA(): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post('/settings/2fa/disable');
    return response.data;
  },
};

export default settingsApi;