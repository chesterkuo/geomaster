import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings as SettingsIcon, Globe, Bell, Shield, Database, Palette, Loader2, QrCode, Copy, Eye, EyeOff, Lock, User as UserIcon } from "lucide-react";
import { settingsApi, OrganizationSettings, SecuritySettings, UserPreferences, ActiveSession, TwoFactorSetup } from "@/lib/api/settings";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth/AuthModal";
import { authService, User } from "@/lib/api/auth";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";

const Settings = () => {
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  
  // Feature flags from environment variables
  const enableNotifications = import.meta.env.VITE_ENABLE_NOTIFICATIONS_SETTINGS === 'true';
  const enableIntegrations = import.meta.env.VITE_ENABLE_INTEGRATIONS_SETTINGS === 'true';
  const enableAppearance = import.meta.env.VITE_ENABLE_APPEARANCE_SETTINGS === 'true';
  
  // Create dynamic tabs array based on feature flags
  const availableTabs = [
    { value: "general", label: "一般設定" },
    { value: "profile", label: "個人資料" },
    { value: "apikeys", label: "AI API Keys" },
    ...(enableNotifications ? [{ value: "notifications", label: "通知設定" }] : []),
    { value: "security", label: "安全設定" },
    ...(enableIntegrations ? [{ value: "integrations", label: "整合設定" }] : []),
    ...(enableAppearance ? [{ value: "appearance", label: "外觀設定" }] : [])
  ];
  
  const gridColsClass = `grid-cols-${availableTabs.length}`;
  
  // Organization settings state
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);
  const [orgFormData, setOrgFormData] = useState({
    name: "",
    website: "",
    timezone: "Asia/Taipei",
    language: "zh-TW",
    currency: "TWD",
    autoDataSync: true,
    dataRetentionMonths: 12,
    defaultReportFormat: "pdf"
  });
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // User preferences state
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [preferencesForm, setPreferencesForm] = useState({
    theme: "dark",
    compactMode: false,
    animations: true,
    language: "zh-TW",
    defaultView: "overview",
    itemsPerPage: 10
  });
  
  // User profile state
  const [profileForm, setProfileForm] = useState({
    fullName: ""
  });
  
  // 2FA state
  const [twoFactorDialog, setTwoFactorDialog] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [setupStep, setSetupStep] = useState(1); // 1: QR code, 2: verification

  // Load data on component mount and tab change
  useEffect(() => {
    if (activeTab === "general") loadOrganizationSettings();
    else if (activeTab === "profile") loadUserProfile();
    else if (activeTab === "security") loadSecuritySettings();
    else if (activeTab === "appearance") loadUserPreferences();
  }, [activeTab]);

  // Load data on initial mount if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "general") loadOrganizationSettings();
      else if (activeTab === "profile") loadUserProfile();
      else if (activeTab === "security") loadSecuritySettings();
      else if (activeTab === "appearance") loadUserPreferences();
    }
  }, [isAuthenticated]);
  
  // Load user profile data from current user
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || ""
      });
    }
  }, [user]);

  const loadOrganizationSettings = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        // Clear data when not authenticated
        setOrgSettings(null);
        setLoading(false);
        return;
      }
      
      const response = await settingsApi.getOrganizationSettings();
      if (response.success) {
        setOrgSettings(response.data);
        setOrgFormData({
          name: response.data.company.name,
          website: response.data.company.website || "",
          timezone: response.data.company.timezone,
          language: response.data.company.language,
          currency: response.data.company.currency,
          autoDataSync: response.data.preferences.autoDataSync,
          dataRetentionMonths: response.data.preferences.dataRetentionMonths,
          defaultReportFormat: response.data.preferences.defaultReportFormat
        });
      }
    } catch (error: any) {
      toast.error('獲取組織設定失敗', {
        description: error.response?.data?.message || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      
      const response = await authService.getProfile();
      if (response.success && response.data.user) {
        setProfileForm({
          fullName: response.data.user.fullName || ""
        });
      }
    } catch (error: any) {
      toast.error('獲取個人資料失敗', {
        description: error.response?.data?.message || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSecuritySettings = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        // Clear data when not authenticated
        setSecuritySettings(null);
        setActiveSessions([]);
        setLoading(false);
        return;
      }
      
      const [securityResponse, sessionsResponse] = await Promise.all([
        settingsApi.getSecuritySettings(),
        settingsApi.getActiveSessions()
      ]);
      
      if (securityResponse.success) {
        setSecuritySettings(securityResponse.data);
      }
      if (sessionsResponse.success) {
        setActiveSessions(sessionsResponse.data.sessions || []);
      }
    } catch (error: any) {
      toast.error('獲取安全設定失敗', {
        description: error.response?.data?.message || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        // Clear data when not authenticated
        setUserPreferences(null);
        setLoading(false);
        return;
      }
      
      const response = await settingsApi.getUserPreferences();
      if (response.success) {
        setUserPreferences(response.data);
        setPreferencesForm({
          theme: response.data.appearance.theme,
          compactMode: response.data.appearance.compactMode,
          animations: response.data.appearance.animations,
          language: response.data.appearance.language,
          defaultView: response.data.dashboard.defaultView,
          itemsPerPage: response.data.dashboard.itemsPerPage
        });
      }
    } catch (error: any) {
      toast.error('獲取用戶偏好失敗', {
        description: error.response?.data?.message || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrganizationSettings = async () => {
    try {
      const response = await settingsApi.updateOrganizationSettings(orgFormData);
      if (response.success) {
        setOrgSettings(response.data);
        toast.success('組織設定已更新');
      }
    } catch (error: any) {
      toast.error('更新組織設定失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('請填寫所有密碼欄位');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('新密碼與確認密碼不一致');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('新密碼至少需要8個字元');
      return;
    }

    try {
      const response = await settingsApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (response.success) {
        toast.success('密碼已更新');
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        loadSecuritySettings(); // Refresh security data
      }
    } catch (error: any) {
      toast.error('更新密碼失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleSavePreferences = async () => {
    try {
      const response = await settingsApi.updateUserPreferences(preferencesForm);
      if (response.success) {
        setUserPreferences(response.data);
        toast.success('偏好設定已更新');
      }
    } catch (error: any) {
      toast.error('更新偏好設定失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await authService.updateProfile(profileForm);
      if (response.success) {
        toast.success('個人資料已更新');
        // Reload profile data
        loadUserProfile();
      }
    } catch (error: any) {
      toast.error('更新個人資料失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await settingsApi.enable2FA();
      if (response.success) {
        setTwoFactorSetup(response.data);
        setTwoFactorDialog(true);
        setSetupStep(1);
      }
    } catch (error: any) {
      toast.error('啟用2FA失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('請輸入6位數驗證碼');
      return;
    }

    try {
      const response = await settingsApi.verify2FA(verificationCode);
      if (response.success && response.data.verified) {
        toast.success('2FA已成功啟用');
        setTwoFactorDialog(false);
        setVerificationCode("");
        setSetupStep(1);
        loadSecuritySettings(); // Refresh security data
      } else {
        toast.error('驗證碼無效');
      }
    } catch (error: any) {
      toast.error('驗證2FA失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleDisable2FA = async () => {
    try {
      const response = await settingsApi.disable2FA();
      if (response.success) {
        toast.success('2FA已停用');
        loadSecuritySettings(); // Refresh security data
      }
    } catch (error: any) {
      toast.error('停用2FA失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已複製到剪貼板');
    } catch (error) {
      toast.error('複製失敗');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">系統設定</h1>
          <p className="text-muted-foreground">管理您的帳戶和應用程式偏好設定</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${gridColsClass}`}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <SettingsIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能管理設定</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可配置組織設定、安全選項和個人偏好</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <UserIcon className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                    <p className="text-xs text-muted-foreground">還沒有帳號嗎？登入窗口中可以選擇註冊</p>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    組織設定
                  </CardTitle>
                  <CardDescription>管理您的組織基本資訊和偏好設定</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">公司名稱</Label>
                      <Input 
                        id="company" 
                        value={orgFormData.name}
                        onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                        placeholder="輸入公司名稱" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">網站網址</Label>
                      <Input 
                        id="website" 
                        value={orgFormData.website}
                        onChange={(e) => setOrgFormData({ ...orgFormData, website: e.target.value })}
                        placeholder="https://example.com" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">時區</Label>
                      <Select value={orgFormData.timezone} onValueChange={(value) => setOrgFormData({ ...orgFormData, timezone: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Taipei">台北 (GMT+8)</SelectItem>
                          <SelectItem value="Asia/Tokyo">東京 (GMT+9)</SelectItem>
                          <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">語言</Label>
                      <Select value={orgFormData.language} onValueChange={(value) => setOrgFormData({ ...orgFormData, language: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zh-TW">繁體中文</SelectItem>
                          <SelectItem value="zh-CN">简体中文</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">貨幣</Label>
                      <Select value={orgFormData.currency} onValueChange={(value) => setOrgFormData({ ...orgFormData, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TWD">台幣 (TWD)</SelectItem>
                          <SelectItem value="USD">美元 (USD)</SelectItem>
                          <SelectItem value="EUR">歐元 (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">資料偏好設定</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>自動資料同步</Label>
                          <p className="text-sm text-muted-foreground">每小時自動同步網站數據</p>
                        </div>
                        <Switch 
                          checked={orgFormData.autoDataSync}
                          onCheckedChange={(checked) => setOrgFormData({ ...orgFormData, autoDataSync: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex-1">
                          <Label>資料保留期間</Label>
                          <p className="text-sm text-muted-foreground">保留歷史數據月數</p>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            min="1"
                            max="60"
                            value={orgFormData.dataRetentionMonths}
                            onChange={(e) => setOrgFormData({ ...orgFormData, dataRetentionMonths: parseInt(e.target.value) || 12 })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex-1">
                          <Label>預設報告格式</Label>
                          <p className="text-sm text-muted-foreground">匯出報告的預設格式</p>
                        </div>
                        <div className="w-32">
                          <Select value={orgFormData.defaultReportFormat} onValueChange={(value) => setOrgFormData({ ...orgFormData, defaultReportFormat: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="excel">Excel</SelectItem>
                              <SelectItem value="csv">CSV</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveOrganizationSettings}>儲存變更</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能管理個人資料</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可編輯您的姓名等個人資訊</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <UserIcon className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                    <p className="text-xs text-muted-foreground">還沒有帳號嗎？登入窗口中可以選擇註冊</p>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    個人資料
                  </CardTitle>
                  <CardDescription>管理您的個人基本資訊</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">姓名</Label>
                      <Input 
                        id="fullName" 
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        placeholder="輸入您的姓名" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">電子郵件 (唯讀)</Label>
                      <Input 
                        id="email" 
                        value={user?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">電子郵件地址無法修改</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>帳戶資訊</Label>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">角色: </span>
                        <span className="font-medium">{user?.role || "用戶"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">建立時間: </span>
                        <span className="font-medium">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-TW') : "未知"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile}>儲存變更</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="apikeys" className="space-y-6">
            <ApiKeySettings />
          </TabsContent>

          {enableNotifications && (
            <TabsContent value="notifications" className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !isAuthenticated ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能管理通知設定</p>
                    <p className="text-sm text-muted-foreground mb-6">登入後即可設定電子郵件通知、推播通知和提醒偏好</p>
                    <div className="space-y-3">
                      <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                        <UserIcon className="mr-2 h-4 w-4" />
                        立即登入
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      通知偏好設定
                    </CardTitle>
                    <CardDescription>選擇您希望接收的通知類型</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">電子郵件通知</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>SEO 警報</Label>
                            <p className="text-sm text-muted-foreground">當網站出現SEO問題時通知</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>排名變化</Label>
                            <p className="text-sm text-muted-foreground">關鍵字排名重大變化通知</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>週報</Label>
                            <p className="text-sm text-muted-foreground">每週SEO表現摘要報告</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>月報</Label>
                            <p className="text-sm text-muted-foreground">每月詳細分析報告</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">推播通知</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>即時警報</Label>
                            <p className="text-sm text-muted-foreground">重要事件的即時推播通知</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>任務提醒</Label>
                            <p className="text-sm text-muted-foreground">優化任務和截止日期提醒</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <Button>儲存通知設定</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          <TabsContent value="security" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能管理安全設定</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可管理密碼、雙重驗證和登入記錄</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <UserIcon className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                    <p className="text-xs text-muted-foreground">還沒有帳號嗎？登入窗口中可以選擇註冊</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      密碼設定
                    </CardTitle>
                    <CardDescription>更新您的登入密碼</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">目前密碼</Label>
                        <div className="relative">
                          <Input 
                            id="current-password" 
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">新密碼</Label>
                        <div className="relative">
                          <Input 
                            id="new-password" 
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">確認新密碼</Label>
                        <div className="relative">
                          <Input 
                            id="confirm-password" 
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleChangePassword}>更新密碼</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>兩步驗證 (2FA)</CardTitle>
                    <CardDescription>增強您的帳戶安全性</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>啟用兩步驗證</Label>
                        <p className="text-sm text-muted-foreground">
                          狀態: {securitySettings?.twoFactorEnabled ? '已啟用' : '未啟用'}
                        </p>
                      </div>
                      {securitySettings?.twoFactorEnabled ? (
                        <Button variant="outline" onClick={handleDisable2FA}>
                          停用 2FA
                        </Button>
                      ) : (
                        <Button onClick={handleEnable2FA}>
                          <QrCode className="h-4 w-4 mr-2" />
                          啟用 2FA
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>登入記錄</CardTitle>
                    <CardDescription>查看最近的登入活動</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {securitySettings?.loginHistory?.map((login, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <div className="font-medium">{login.device}</div>
                          <div className="text-sm text-muted-foreground">
                            {login.ipAddress} • {login.location}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(login.timestamp)}
                        </div>
                      </div>
                    ))}
                    {(!securitySettings?.loginHistory || securitySettings.loginHistory.length === 0) && (
                      <div className="text-center py-4 text-muted-foreground">
                        沒有登入記錄
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>活躍會話</CardTitle>
                    <CardDescription>管理您的登入會話</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {session.device}
                            {session.current && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">目前會話</span>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.location} • 最後活動: {formatDate(session.lastActive)}
                          </div>
                        </div>
                        {!session.current && (
                          <Button size="sm" variant="outline">
                            終止會話
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {enableIntegrations && (
            <TabsContent value="integrations" className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !isAuthenticated ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能管理整合設定</p>
                    <p className="text-sm text-muted-foreground mb-6">登入後即可連接和管理第三方服務整合</p>
                    <div className="space-y-3">
                      <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                        <UserIcon className="mr-2 h-4 w-4" />
                        立即登入
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      第三方整合
                    </CardTitle>
                    <CardDescription>連接外部服務和工具</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {[
                        { name: "Google Analytics", status: "已連接", description: "網站流量分析" },
                        { name: "Google Search Console", status: "未連接", description: "搜尋引擎數據" },
                        { name: "Facebook Pixel", status: "已連接", description: "社群媒體追蹤" },
                        { name: "Google Ads", status: "未連接", description: "廣告效果追蹤" }
                      ].map((integration, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div>
                            <h4 className="font-medium">{integration.name}</h4>
                            <p className="text-sm text-muted-foreground">{integration.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${integration.status === "已連接" ? "text-green-600" : "text-muted-foreground"}`}>
                              {integration.status}
                            </span>
                            <Button size="sm" variant={integration.status === "已連接" ? "outline" : "default"}>
                              {integration.status === "已連接" ? "管理" : "連接"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {enableAppearance && (
            <TabsContent value="appearance" className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !isAuthenticated ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <Palette className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能自訂外觀</p>
                    <p className="text-sm text-muted-foreground mb-6">登入後即可設定主題、顯示偏好和儀表板配置</p>
                    <div className="space-y-3">
                      <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                        <UserIcon className="mr-2 h-4 w-4" />
                        立即登入
                      </Button>
                      <p className="text-xs text-muted-foreground">還沒有帳號嗎？登入窗口中可以選擇註冊</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      外觀設定
                    </CardTitle>
                    <CardDescription>自訂應用程式的外觀和主題</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">主題設定</h3>
                      <div className="space-y-2">
                        <Label>主題模式</Label>
                        <Select value={preferencesForm.theme} onValueChange={(value) => setPreferencesForm({ ...preferencesForm, theme: value })}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">淺色模式</SelectItem>
                            <SelectItem value="dark">深色模式</SelectItem>
                            <SelectItem value="system">跟隨系統</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">顯示設定</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>緊湊模式</Label>
                            <p className="text-sm text-muted-foreground">減少介面元素間距</p>
                          </div>
                          <Switch 
                            checked={preferencesForm.compactMode}
                            onCheckedChange={(checked) => setPreferencesForm({ ...preferencesForm, compactMode: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>動畫效果</Label>
                            <p className="text-sm text-muted-foreground">啟用介面動畫和轉場效果</p>
                          </div>
                          <Switch 
                            checked={preferencesForm.animations}
                            onCheckedChange={(checked) => setPreferencesForm({ ...preferencesForm, animations: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">儀表板設定</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>預設檢視</Label>
                          <Select value={preferencesForm.defaultView} onValueChange={(value) => setPreferencesForm({ ...preferencesForm, defaultView: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="overview">總覽</SelectItem>
                              <SelectItem value="analytics">分析</SelectItem>
                              <SelectItem value="reports">報告</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>每頁項目數</Label>
                          <Select value={preferencesForm.itemsPerPage.toString()} onValueChange={(value) => setPreferencesForm({ ...preferencesForm, itemsPerPage: parseInt(value) })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 項</SelectItem>
                              <SelectItem value="10">10 項</SelectItem>
                              <SelectItem value="25">25 項</SelectItem>
                              <SelectItem value="50">50 項</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleSavePreferences}>儲存外觀設定</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* 2FA Setup Dialog */}
        <Dialog open={twoFactorDialog} onOpenChange={setTwoFactorDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>設定兩步驗證</DialogTitle>
              <DialogDescription>
                {setupStep === 1 ? '掃描 QR 碼來設定您的驗證器應用程式' : '輸入驗證碼來完成設定'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {setupStep === 1 && twoFactorSetup && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img src={twoFactorSetup.qrCode} alt="QR Code" className="max-w-48 max-h-48" />
                  </div>
                  <div className="space-y-2">
                    <Label>備用代碼 (請妥善保管)</Label>
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                      {twoFactorSetup.backupCodes.map((code, index) => (
                        <div key={index} className="bg-muted p-2 rounded flex justify-between items-center">
                          <span>{code}</span>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(code)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {setupStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">驗證碼</Label>
                    <Input
                      id="verification-code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="輸入6位數驗證碼"
                      maxLength={6}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTwoFactorDialog(false)}>
                取消
              </Button>
              {setupStep === 1 ? (
                <Button onClick={() => setSetupStep(2)}>
                  下一步
                </Button>
              ) : (
                <Button onClick={handleVerify2FA}>
                  驗證並啟用
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Reload data after login based on current tab
          if (activeTab === "general") loadOrganizationSettings();
          else if (activeTab === "profile") loadUserProfile();
          else if (activeTab === "security") loadSecuritySettings();
          else if (activeTab === "appearance") loadUserPreferences();
        }}
      />
    </DashboardLayout>
  );
};

export default Settings;