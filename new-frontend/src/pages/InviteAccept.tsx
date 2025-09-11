import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { invitationApi } from '@/lib/api/team';

interface InvitationData {
  email: string;
  role: string;
  organizationName: string;
  message?: string;
  expiresAt: string;
  invitedBy: string;
}

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const result = await invitationApi.getInvitationByToken(token!);
      if (result.success) {
        setInvitation(result.data);
      } else {
        setError(result.message || '無法載入邀請資訊');
      }
    } catch (err: any) {
      setError('邀請連結無效或已過期');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      setError('請填寫您的姓名');
      return;
    }
    
    if (!formData.password) {
      setError('請設定密碼');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('密碼至少需要6個字符');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('密碼確認不匹配');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const result = await invitationApi.acceptInvitation(token!, {
        fullName: formData.fullName,
        password: formData.password
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(result.message || '接受邀請時發生錯誤');
      }
    } catch (err: any) {
      setError('接受邀請時發生錯誤，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      owner: '擁有者',
      admin: '管理員',
      editor: '編輯者',
      viewer: '查看者'
    };
    return roleNames[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-gray-600 dark:text-gray-400">載入邀請資訊中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">邀請無效</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')}
              className="w-full"
            >
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">歡迎加入！</CardTitle>
            <CardDescription>
              您已成功加入 {invitation?.organizationName}，正在跳轉到系統...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <CardTitle>團隊邀請</CardTitle>
          <CardDescription>
            您受邀加入 <strong>{invitation?.organizationName}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">邀請郵箱:</span>
              <span className="text-sm font-medium">{invitation?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">角色:</span>
              <span className="text-sm font-medium">{getRoleDisplayName(invitation?.role || '')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">邀請者:</span>
              <span className="text-sm font-medium">{invitation?.invitedBy}</span>
            </div>
          </div>

          {invitation?.message && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>邀請訊息:</strong> {invitation.message}
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">您的姓名 *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="請輸入您的完整姓名"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">設定密碼 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少6個字符"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">確認密碼 *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次輸入密碼"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  處理中...
                </>
              ) : (
                '接受邀請並加入團隊'
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-sm"
            >
              取消
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}