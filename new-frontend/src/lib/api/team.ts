import apiClient, { ApiResponse } from './client';

// 團隊相關介面定義
export interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
}

export interface Invitation {
  id: number;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  message?: string;
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: number;
  userId?: string;
  organizationId: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface ActivityParams extends PaginationParams {
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Team API 服務
export const teamApi = {
  // 獲取可用角色
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await apiClient.get('/team/roles');
    return response.data;
  },

  // 獲取團隊成員列表
  async getMembers(params?: PaginationParams): Promise<ApiResponse<{ members: TeamMember[], pagination: any }>> {
    const response = await apiClient.get('/team/members', { params });
    return response.data;
  },

  // 更新成員
  async updateMember(
    id: string, 
    updates: { role?: string; status?: string }
  ): Promise<ApiResponse<TeamMember>> {
    const response = await apiClient.put(`/team/members/${id}`, updates);
    return response.data;
  },

  // 移除成員
  async removeMember(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/team/members/${id}`);
    return response.data;
  },

  // 獲取邀請列表
  async getInvitations(params?: PaginationParams): Promise<ApiResponse<{ invitations: Invitation[], pagination: any }>> {
    const response = await apiClient.get('/team/invitations', { params });
    return response.data;
  },

  // 發送邀請
  async sendInvitation(data: {
    email: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    message?: string;
  }): Promise<ApiResponse<Invitation>> {
    const response = await apiClient.post('/team/invitations', data);
    return response.data;
  },

  // 重新發送邀請
  async resendInvitation(id: number): Promise<ApiResponse<Invitation>> {
    const response = await apiClient.post(`/team/invitations/${id}/resend`);
    return response.data;
  },

  // 取消邀請
  async cancelInvitation(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/team/invitations/${id}`);
    return response.data;
  },

  // 獲取活動記錄
  async getActivity(params?: ActivityParams): Promise<ApiResponse<{ activities: ActivityLog[], pagination: any }>> {
    const response = await apiClient.get('/team/activity', { params });
    return response.data;
  },
};

// Invitation API 服務 (不需要認證)
export const invitationApi = {
  // 根據token獲取邀請詳情
  async getInvitationByToken(token: string): Promise<ApiResponse<{
    email: string;
    role: string;
    organizationName: string;
    message?: string;
    expiresAt: string;
    invitedBy: string;
  }>> {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/v1/invitations/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  // 接受邀請並創建用戶
  async acceptInvitation(token: string, data: {
    fullName: string;
    password: string;
  }): Promise<ApiResponse<{
    user: {
      id: string;
      email: string;
      fullName: string;
    };
    organization: string;
    role: string;
  }>> {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/v1/invitations/${token}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

export default teamApi;