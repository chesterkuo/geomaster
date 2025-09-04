import { useState, useEffect } from 'react';
import { authService, User } from '@/lib/api/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      if (authService.isAuthenticated()) {
        // 嘗試獲取用戶資料來驗證 token 是否有效
        const response = await authService.getProfile();
        if (response.success && response.data) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // Token 無效，清除本地存儲
          await authService.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      // 如果獲取用戶資料失敗，清除認證狀態
      setIsAuthenticated(false);
      setUser(null);
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
      setIsAuthenticated(true);
    }
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    register,
    logout,
    checkAuthStatus
  };
}