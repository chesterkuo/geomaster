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
        console.log('🚫 No access token found');
        setIsAuthenticated(false);
        setUser(null);
        setOrganization(null);
        return;
      }

      console.log('🔍 Checking auth status with existing token...');

      // 有 token，嘗試獲取用戶資料來驗證 token 是否有效
      try {
        const response = await authService.getProfile();
        if (response.success && response.data) {
          console.log('✅ Profile fetch successful, user authenticated');
          setUser(response.data.user);
          setOrganization(response.data.organizations?.[0] || null);
          setIsAuthenticated(true);
        } else {
          console.warn('⚠️ Profile fetch returned unsuccessful response');
          // Token 可能無效，但不要立即清除 - 讓 interceptor 處理
          setIsAuthenticated(false);
          setUser(null);
          setOrganization(null);
        }
      } catch (profileError: any) {
        console.warn('⚠️ Profile fetch failed:', profileError);

        // More graceful error handling - don't immediately clear tokens
        // Let the axios interceptor handle token refresh if needed
        const status = profileError.response?.status;

        if (status === 401) {
          // 401 will be handled by axios interceptor for token refresh
          console.log('🔄 401 error - token refresh will be attempted by interceptor');
          // Don't clear tokens here - let the interceptor handle it
          setIsAuthenticated(false);
          setUser(null);
          setOrganization(null);
        } else if (status >= 500) {
          // Server error - keep tokens and retry later
          console.warn('🔧 Server error during profile check, keeping session');
          // Keep existing auth state for server errors
        } else {
          // Other errors (network, etc.) - don't force logout
          console.warn('🌐 Network or other error during profile check');
          setIsAuthenticated(false);
          setUser(null);
          setOrganization(null);
        }
      }
    } catch (error) {
      console.error('❌ Auth status check failed:', error);
      // Don't clear tokens on general errors - could be network issues
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