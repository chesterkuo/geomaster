import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from './AuthModal';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // If not loading and not authenticated, show auth modal
    if (!isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    } else if (isAuthenticated) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated, isLoading]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">驗證中...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show protected content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, show fallback or auth modal
  return (
    <>
      {fallback || (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center space-y-6 max-w-md mx-auto p-6">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-primary">需要登入</h1>
              <p className="text-muted-foreground text-lg">請登入以存取完整功能</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                立即登入
              </button>
              <p className="text-sm text-muted-foreground">
                還沒有帳號嗎？登入窗口中可以選擇註冊
              </p>
            </div>
          </div>
        </div>
      )}
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Page will refresh automatically due to AuthModal implementation
        }}
      />
    </>
  );
}