import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    { value: "general", label: t("settings.tabs.general") },
    { value: "profile", label: t("settings.tabs.profile") },
    { value: "apikeys", label: t("settings.tabs.apikeys") },
    ...(enableNotifications ? [{ value: "notifications", label: t("settings.tabs.notifications") }] : []),
    { value: "security", label: t("settings.tabs.security") },
    ...(enableIntegrations ? [{ value: "integrations", label: t("settings.tabs.integrations") }] : []),
    ...(enableAppearance ? [{ value: "appearance", label: t("settings.tabs.appearance") }] : [])
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
      toast.error(t('settings.messages.failedToLoadOrganizationSettings'), {
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
      toast.error(t('settings.messages.failedToLoadProfile'), {
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
      toast.error(t('settings.messages.failedToLoadSecuritySettings'), {
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
      toast.error(t('settings.messages.failedToLoadUserPreferences'), {
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
        toast.success(t('settings.messages.organizationSettingsUpdated'));
      }
    } catch (error: any) {
      toast.error(t('settings.messages.failedToUpdateOrganizationSettings'), {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error(t('settings.messages.pleaseFillAllPasswordFields'));
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('settings.messages.passwordsDoNotMatch'));
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error(t('settings.messages.passwordTooShort'));
      return;
    }

    try {
      const response = await settingsApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (response.success) {
        toast.success(t('settings.messages.passwordUpdated'));
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        loadSecuritySettings(); // Refresh security data
      }
    } catch (error: any) {
      toast.error(t('settings.messages.failedToUpdatePassword'), {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleSavePreferences = async () => {
    try {
      const response = await settingsApi.updateUserPreferences(preferencesForm);
      if (response.success) {
        setUserPreferences(response.data);
        toast.success(t('settings.messages.preferencesUpdated'));
      }
    } catch (error: any) {
      toast.error(t('settings.messages.failedToUpdatePreferences'), {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await authService.updateProfile(profileForm);
      if (response.success) {
        toast.success(t('settings.messages.profileUpdated'));
        // Reload profile data
        loadUserProfile();
      }
    } catch (error: any) {
      toast.error(t('settings.messages.failedToUpdateProfile'), {
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
      toast.error(t('settings.messages.failedToEnable2FA'), {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error(t('settings.messages.pleaseEnterSixDigitCode'));
      return;
    }

    try {
      const response = await settingsApi.verify2FA(verificationCode);
      if (response.success && response.data.verified) {
        toast.success(t('settings.messages.twoFactorEnabled'));
        setTwoFactorDialog(false);
        setVerificationCode("");
        setSetupStep(1);
        loadSecuritySettings(); // Refresh security data
      } else {
        toast.error(t('settings.messages.invalidVerificationCode'));
      }
    } catch (error: any) {
      toast.error(t('settings.messages.failedToVerify2FA'), {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleDisable2FA = async () => {
    try {
      const response = await settingsApi.disable2FA();
      if (response.success) {
        toast.success(t('settings.messages.twoFactorDisabled'));
        loadSecuritySettings(); // Refresh security data
      }
    } catch (error: any) {
      toast.error(t('settings.messages.failedToDisable2FA'), {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('settings.messages.copiedToClipboard'));
    } catch (error) {
      toast.error(t('settings.messages.copyFailed'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
          <h1 className="text-3xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-muted-foreground">{t("settings.description")}</p>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t("settings.auth.loginRequiredToManageSettings")}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t("settings.auth.loginToConfigureSettings")}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <UserIcon className="mr-2 h-4 w-4" />
                      {t("settings.auth.loginNow")}
                    </Button>
                    <p className="text-xs text-muted-foreground">{t("settings.auth.noAccountPrompt")}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    {t("settings.general.organizationSettings")}
                  </CardTitle>
                  <CardDescription>{t("settings.general.organizationDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">{t("settings.general.companyName")}</Label>
                      <Input
                        id="company"
                        value={orgFormData.name}
                        onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                        placeholder={t("settings.general.companyNamePlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">{t("settings.general.websiteUrl")}</Label>
                      <Input
                        id="website"
                        value={orgFormData.website}
                        onChange={(e) => setOrgFormData({ ...orgFormData, website: e.target.value })}
                        placeholder={t("settings.general.websiteUrlPlaceholder")}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">{t("settings.general.timezone")}</Label>
                      <Select value={orgFormData.timezone} onValueChange={(value) => setOrgFormData({ ...orgFormData, timezone: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Taipei">{t("settings.general.timezones.taipei")}</SelectItem>
                          <SelectItem value="Asia/Tokyo">{t("settings.general.timezones.tokyo")}</SelectItem>
                          <SelectItem value="UTC">{t("settings.general.timezones.utc")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">{t("settings.general.language")}</Label>
                      <Select value={orgFormData.language} onValueChange={(value) => setOrgFormData({ ...orgFormData, language: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zh-TW">{t("settings.general.languages.traditionalChinese")}</SelectItem>
                          <SelectItem value="zh-CN">{t("settings.general.languages.simplifiedChinese")}</SelectItem>
                          <SelectItem value="en">{t("settings.general.languages.english")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">{t("settings.general.currency")}</Label>
                      <Select value={orgFormData.currency} onValueChange={(value) => setOrgFormData({ ...orgFormData, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TWD">{t("settings.general.currencies.twd")}</SelectItem>
                          <SelectItem value="USD">{t("settings.general.currencies.usd")}</SelectItem>
                          <SelectItem value="EUR">{t("settings.general.currencies.eur")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("settings.general.dataPreferences")}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{t("settings.general.autoDataSync")}</Label>
                          <p className="text-sm text-muted-foreground">{t("settings.general.autoDataSyncDescription")}</p>
                        </div>
                        <Switch 
                          checked={orgFormData.autoDataSync}
                          onCheckedChange={(checked) => setOrgFormData({ ...orgFormData, autoDataSync: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex-1">
                          <Label>{t("settings.general.dataRetention")}</Label>
                          <p className="text-sm text-muted-foreground">{t("settings.general.dataRetentionDescription")}</p>
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
                          <Label>{t("settings.general.defaultReportFormat")}</Label>
                          <p className="text-sm text-muted-foreground">{t("settings.general.defaultReportFormatDescription")}</p>
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

                  <Button onClick={handleSaveOrganizationSettings}>{t("settings.general.saveChanges")}</Button>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t("settings.auth.loginRequiredToManageProfile")}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t("settings.auth.loginToEditPersonalInfo")}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <UserIcon className="mr-2 h-4 w-4" />
                      {t("settings.auth.loginNow")}
                    </Button>
                    <p className="text-xs text-muted-foreground">{t("settings.auth.noAccountPrompt")}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    {t("settings.profile.title")}
                  </CardTitle>
                  <CardDescription>{t("settings.profile.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t("settings.profile.fullName")}</Label>
                      <Input
                        id="fullName"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        placeholder={t("settings.profile.fullNamePlaceholder")}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("settings.profile.email")}</Label>
                      <Input
                        id="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">{t("settings.profile.emailReadOnly")}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>{t("settings.profile.accountInfo")}</Label>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t("settings.profile.role")}: </span>
                        <span className="font-medium">{user?.role || t("settings.profile.defaultRole")}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("settings.profile.createdAt")}: </span>
                        <span className="font-medium">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US') : t("settings.profile.unknown")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile}>{t("settings.profile.saveChanges")}</Button>
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
                    <p className="text-lg font-medium text-muted-foreground mb-2">{t("settings.auth.loginRequiredToManageNotifications")}</p>
                    <p className="text-sm text-muted-foreground mb-6">{t("settings.auth.loginToConfigureNotifications")}</p>
                    <div className="space-y-3">
                      <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                        <UserIcon className="mr-2 h-4 w-4" />
                        {t("settings.auth.loginNow")}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      {t("settings.notifications.title")}
                    </CardTitle>
                    <CardDescription>{t("settings.notifications.description")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">{t("settings.notifications.emailNotifications")}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>{t("settings.notifications.seoAlerts")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.notifications.seoAlertsDescription")}</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>{t("settings.notifications.rankingChanges")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.notifications.rankingChangesDescription")}</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>{t("settings.notifications.weeklyReport")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.notifications.weeklyReportDescription")}</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>{t("settings.notifications.monthlyReport")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.notifications.monthlyReportDescription")}</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">{t("settings.notifications.pushNotifications")}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>{t("settings.notifications.realTimeAlerts")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.notifications.realTimeAlertsDescription")}</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>{t("settings.notifications.taskReminders")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.notifications.taskRemindersDescription")}</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <Button>{t("settings.notifications.saveSettings")}</Button>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t("settings.auth.loginRequiredToManageSecurity")}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t("settings.auth.loginToManageSecuritySettings")}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <UserIcon className="mr-2 h-4 w-4" />
                      {t("settings.auth.loginNow")}
                    </Button>
                    <p className="text-xs text-muted-foreground">{t("settings.auth.noAccountPrompt")}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {t("settings.security.passwordSettings")}
                    </CardTitle>
                    <CardDescription>{t("settings.security.passwordDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">{t("settings.security.currentPassword")}</Label>
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
                        <Label htmlFor="new-password">{t("settings.security.newPassword")}</Label>
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
                        <Label htmlFor="confirm-password">{t("settings.security.confirmNewPassword")}</Label>
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
                    <Button onClick={handleChangePassword}>{t("settings.security.updatePassword")}</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("settings.security.twoFactorAuth")}</CardTitle>
                    <CardDescription>{t("settings.security.twoFactorDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t("settings.security.enableTwoFactor")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.security.status")}: {securitySettings?.twoFactorEnabled ? t("settings.security.enabled") : t("settings.security.disabled")}
                        </p>
                      </div>
                      {securitySettings?.twoFactorEnabled ? (
                        <Button variant="outline" onClick={handleDisable2FA}>
                          {t("settings.security.disable2FA")}
                        </Button>
                      ) : (
                        <Button onClick={handleEnable2FA}>
                          <QrCode className="h-4 w-4 mr-2" />
                          {t("settings.security.enable2FA")}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("settings.security.loginHistory")}</CardTitle>
                    <CardDescription>{t("settings.security.loginHistoryDescription")}</CardDescription>
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
                        {t("settings.security.noLoginHistory")}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("settings.security.activeSessions")}</CardTitle>
                    <CardDescription>{t("settings.security.activeSessionsDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {session.device}
                            {session.current && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{t("settings.security.currentSession")}</span>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.location} • {t("settings.security.lastActive")}: {formatDate(session.lastActive)}
                          </div>
                        </div>
                        {!session.current && (
                          <Button size="sm" variant="outline">
                            {t("settings.security.terminateSession")}
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
                    <p className="text-lg font-medium text-muted-foreground mb-2">{t("settings.auth.loginRequiredToManageIntegrations")}</p>
                    <p className="text-sm text-muted-foreground mb-6">{t("settings.auth.loginToManageIntegrations")}</p>
                    <div className="space-y-3">
                      <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                        <UserIcon className="mr-2 h-4 w-4" />
                        {t("settings.auth.loginNow")}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {t("settings.integrations.title")}
                    </CardTitle>
                    <CardDescription>{t("settings.integrations.description")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {[
                        { name: "Google Analytics", status: t("settings.integrations.connected"), description: t("settings.integrations.googleAnalyticsDesc") },
                        { name: "Google Search Console", status: t("settings.integrations.notConnected"), description: t("settings.integrations.googleSearchConsoleDesc") },
                        { name: "Facebook Pixel", status: t("settings.integrations.connected"), description: t("settings.integrations.facebookPixelDesc") },
                        { name: "Google Ads", status: t("settings.integrations.notConnected"), description: t("settings.integrations.googleAdsDesc") }
                      ].map((integration, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div>
                            <h4 className="font-medium">{integration.name}</h4>
                            <p className="text-sm text-muted-foreground">{integration.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${integration.status === t("settings.integrations.connected") ? "text-green-600" : "text-muted-foreground"}`}>
                              {integration.status}
                            </span>
                            <Button size="sm" variant={integration.status === t("settings.integrations.connected") ? "outline" : "default"}>
                              {integration.status === t("settings.integrations.connected") ? t("settings.integrations.manage") : t("settings.integrations.connect")}
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
                    <p className="text-lg font-medium text-muted-foreground mb-2">{t("settings.auth.loginRequiredToCustomizeAppearance")}</p>
                    <p className="text-sm text-muted-foreground mb-6">{t("settings.auth.loginToConfigureAppearance")}</p>
                    <div className="space-y-3">
                      <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                        <UserIcon className="mr-2 h-4 w-4" />
                        {t("settings.auth.loginNow")}
                      </Button>
                      <p className="text-xs text-muted-foreground">{t("settings.auth.noAccountPrompt")}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      {t("settings.appearance.title")}
                    </CardTitle>
                    <CardDescription>{t("settings.appearance.description")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">{t("settings.appearance.themeSettings")}</h3>
                      <div className="space-y-2">
                        <Label>{t("settings.appearance.themeMode")}</Label>
                        <Select value={preferencesForm.theme} onValueChange={(value) => setPreferencesForm({ ...preferencesForm, theme: value })}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">{t("settings.appearance.lightMode")}</SelectItem>
                            <SelectItem value="dark">{t("settings.appearance.darkMode")}</SelectItem>
                            <SelectItem value="system">{t("settings.appearance.systemMode")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">{t("settings.appearance.displaySettings")}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>{t("settings.appearance.compactMode")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.appearance.compactModeDescription")}</p>
                          </div>
                          <Switch 
                            checked={preferencesForm.compactMode}
                            onCheckedChange={(checked) => setPreferencesForm({ ...preferencesForm, compactMode: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>{t("settings.appearance.animations")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.appearance.animationsDescription")}</p>
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
                      <h3 className="text-lg font-medium">{t("settings.appearance.dashboardSettings")}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("settings.appearance.defaultView")}</Label>
                          <Select value={preferencesForm.defaultView} onValueChange={(value) => setPreferencesForm({ ...preferencesForm, defaultView: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="overview">{t("settings.appearance.overview")}</SelectItem>
                              <SelectItem value="analytics">{t("settings.appearance.analytics")}</SelectItem>
                              <SelectItem value="reports">{t("settings.appearance.reports")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("settings.appearance.itemsPerPage")}</Label>
                          <Select value={preferencesForm.itemsPerPage.toString()} onValueChange={(value) => setPreferencesForm({ ...preferencesForm, itemsPerPage: parseInt(value) })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">{t("settings.appearance.items5")}</SelectItem>
                              <SelectItem value="10">{t("settings.appearance.items10")}</SelectItem>
                              <SelectItem value="25">{t("settings.appearance.items25")}</SelectItem>
                              <SelectItem value="50">{t("settings.appearance.items50")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleSavePreferences}>{t("settings.appearance.saveSettings")}</Button>
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
              <DialogTitle>{t("settings.security.setup2FA")}</DialogTitle>
              <DialogDescription>
                {setupStep === 1 ? t("settings.security.scanQRCode") : t("settings.security.enterVerificationCode")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {setupStep === 1 && twoFactorSetup && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img src={twoFactorSetup.qrCode} alt="QR Code" className="max-w-48 max-h-48" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.twoFactor.backupCodes")}</Label>
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
                    <Label htmlFor="verification-code">{t("settings.security.verificationCode")}</Label>
                    <Input
                      id="verification-code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder={t("settings.security.enterSixDigitCode")}
                      maxLength={6}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTwoFactorDialog(false)}>
                {t("common.cancel")}
              </Button>
              {setupStep === 1 ? (
                <Button onClick={() => setSetupStep(2)}>
                  {t("settings.security.nextStep")}
                </Button>
              ) : (
                <Button onClick={handleVerify2FA}>
                  {t("settings.security.verifyAndEnable")}
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