import { useState, useEffect } from 'react';
import { authService, User, Organization } from '@/lib/api/auth';
import { tokenManager } from '@/lib/api/client';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const token = tokenManager.getAccessToken();
      
      if (!token) {
        // 沒有 token，直接設為未認證
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // 有 token，嘗試獲取用戶資料來驗證 token 是否有效
      try {
        const response = await authService.getProfile();
        if (response.success && response.data) {
          setUser(response.data.user);
          setOrganization(response.data.organizations?.[0] || null);
          setIsAuthenticated(true);
        } else {
          // Token 無效，清除本地存儲
          await authService.logout();
          setIsAuthenticated(false);
          setUser(null);
          setOrganization(null);
        }
      } catch (profileError) {
        // 如果獲取用戶資料失敗，清除認證狀態和 token
        console.warn('Profile fetch failed, clearing auth:', profileError);
        tokenManager.clearTokens();
        setIsAuthenticated(false);
        setUser(null);
        setOrganization(null);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    if (response.success) {
      setUser(response.data.user);
      setOrganization(response.data.organization || response.data.organizations?.[0] || null);
      setIsAuthenticated(true);
    }
    return response;
  };

  const register = async (userData: {
    fullName: string;
    email: string;
    password: string;
    company?: string;
  }) => {
    const response = await authService.register(userData);
    if (response.success) {
      setUser(response.data.user);
      setOrganization(response.data.organization || null);
      setIsAuthenticated(true);
    }
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setOrganization(null);
  };

  return {
    isAuthenticated,
    user,
    organization,
    isLoading,
    login,
    register,
    logout,
    checkAuthStatus
  };
}