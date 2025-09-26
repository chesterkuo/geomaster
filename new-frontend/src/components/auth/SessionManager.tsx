import { useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function SessionManager() {
  const { t } = useTranslation();

  useEffect(() => {
    const handleSessionExpired = (event: CustomEvent) => {
      console.log('🚪 Session expired event received');

      // Show user-friendly notification
      toast.error(t('auth.sessionExpired'), {
        description: event.detail?.message || t('auth.sessionExpiredDescription'),
        duration: 5000,
      });
    };

    const handleTokenRefreshSuccess = () => {
      console.log('✅ Token refresh successful');

      // Optionally show success message for debugging
      if (process.env.NODE_ENV === 'development') {
        toast.success('Session refreshed', {
          duration: 2000,
        });
      }
    };

    const handleTokenRefreshFailure = (event: CustomEvent) => {
      console.log('❌ Token refresh failed');

      // Show warning but don't force logout immediately
      toast.warning(t('auth.sessionIssue'), {
        description: t('auth.sessionIssueDescription'),
        duration: 4000,
      });
    };

    // Listen for custom auth events
    window.addEventListener('auth:session-expired', handleSessionExpired as EventListener);
    window.addEventListener('auth:token-refresh-success', handleTokenRefreshSuccess);
    window.addEventListener('auth:token-refresh-failure', handleTokenRefreshFailure as EventListener);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired as EventListener);
      window.removeEventListener('auth:token-refresh-success', handleTokenRefreshSuccess);
      window.removeEventListener('auth:token-refresh-failure', handleTokenRefreshFailure as EventListener);
    };
  }, [t]);

  return null; // This component doesn't render anything
}