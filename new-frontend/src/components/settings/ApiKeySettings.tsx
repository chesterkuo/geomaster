import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Eye,
  EyeOff,
  Key,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  ExternalLink,
  Trash2,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import apiClient from '@/lib/api/client';

interface PlatformSetting {
  id: string;
  platform: string;
  enabled: boolean;
  hasApiKey: boolean;
  apiKeyMasked?: string;
  settings: any;
  lastSync?: string;
}

interface ApiKeyRequirements {
  platform: string;
  format: string;
  example: string;
  documentation: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  providerInfo?: {
    name?: string;
    model?: string;
    quotaUsed?: number;
    quotaLimit?: number;
  };
}

const PLATFORM_LABELS = {
  chatgpt: 'ChatGPT (OpenAI)',
  gemini: 'Google Gemini',
  claude: 'Anthropic Claude',
  perplexity: 'Perplexity AI'
};

const PLATFORM_COLORS = {
  chatgpt: 'bg-green-100 text-green-800',
  gemini: 'bg-blue-100 text-blue-800',
  claude: 'bg-orange-100 text-orange-800',
  perplexity: 'bg-purple-100 text-purple-800'
};

export function ApiKeySettings() {
  const { t } = useTranslation();
  const [platforms, setPlatforms] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [requirements, setRequirements] = useState<ApiKeyRequirements | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Utility function to ensure fixed-length API key display
  const normalizeApiKeyDisplay = (apiKeyMasked: string | undefined): string => {
    if (!apiKeyMasked) return '';
    
    // If already in correct format (4 chars + 8 stars + 4 chars = 16 total), return as is
    if (apiKeyMasked.length === 16 && /^.{4}\*{8}.{4}$/.test(apiKeyMasked)) {
      return apiKeyMasked;
    }
    
    // Handle legacy formats like "***1234" or other patterns
    if (apiKeyMasked.includes('***')) {
      const parts = apiKeyMasked.split('***');
      if (parts.length === 2 && parts[1].length >= 4) {
        const start = parts[0].substring(0, 4) || '****';
        const end = parts[1].substring(parts[1].length - 4);
        return `${start.padEnd(4, '*')}********${end}`;
      }
    }
    
    // For any other format, try to extract meaningful parts
    if (apiKeyMasked.length >= 8) {
      const start = apiKeyMasked.substring(0, 4);
      const end = apiKeyMasked.substring(apiKeyMasked.length - 4);
      return `${start}********${end}`;
    }
    
    // Fallback for very short keys
    return '****-***-****';
  };

  useEffect(() => {
    loadPlatformSettings();
  }, []);

  const loadPlatformSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/platforms');
      if (response.data.success) {
        setPlatforms(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error loading platform settings:', error);
      toast({
        title: t('settings.apiKeys.messages.loadFailed'),
        description: error.response?.data?.message || t('settings.apiKeys.messages.loadFailedDescription'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRequirements = async (platform: string) => {
    try {
      const response = await apiClient.get(`/platforms/${platform}/requirements`);
      if (response.data.success) {
        setRequirements(response.data.data);
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
    }
  };

  const openApiKeyDialog = async (platform: string) => {
    setSelectedPlatform(platform);
    setApiKey('');
    setShowApiKey(false);
    setValidationResult(null);
    setDialogOpen(true);
    await loadRequirements(platform);
  };

  const validateApiKey = async () => {
    if (!selectedPlatform || !apiKey.trim()) {
      return;
    }

    try {
      setValidating(true);
      const response = await apiClient.post(`/platforms/${selectedPlatform}/validate`, {
        apiKey: apiKey.trim()
      });
      
      if (response.data.success) {
        setValidationResult(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || t('settings.apiKeys.validation.failed');
      setValidationResult({
        isValid: false,
        error: errorMessage
      });
    } finally {
      setValidating(false);
    }
  };

  const saveApiKey = async () => {
    if (!selectedPlatform || !apiKey.trim() || !validationResult?.isValid) {
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.put(`/platforms/${selectedPlatform}/api-key`, {
        apiKey: apiKey.trim(),
        enabled: true
      });

      if (response.data.success) {
        toast({
          title: t('settings.apiKeys.messages.saveSuccess'),
          description: t('settings.apiKeys.messages.saveSuccessDescription', {
            platform: t(`settings.apiKeys.platforms.${selectedPlatform}`)
          }),
        });
        
        // 直接更新本地狀態，避免重新載入的延遲
        const updatedData = response.data.data;
        setPlatforms(prev => {
          const existingIndex = prev.findIndex(p => p.platform === selectedPlatform);
          if (existingIndex >= 0) {
            // 更新現有平台設定
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              enabled: updatedData.enabled,
              hasApiKey: updatedData.hasApiKey,
              apiKeyMasked: updatedData.apiKeyMasked,
              lastSync: new Date().toISOString()
            };
            return updated;
          } else {
            // 新增平台設定
            return [...prev, {
              id: '',
              platform: selectedPlatform,
              enabled: updatedData.enabled,
              hasApiKey: updatedData.hasApiKey,
              apiKeyMasked: updatedData.apiKeyMasked,
              settings: {},
              lastSync: new Date().toISOString()
            }];
          }
        });
        
        // 清空敏感資料並關閉對話框
        setApiKey('');
        setValidationResult(null);
        setDialogOpen(false);
        await loadPlatformSettings();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error saving API key:', error);
      toast({
        title: t('settings.apiKeys.messages.saveFailed'),
        description: error.response?.data?.message || t('settings.apiKeys.messages.saveFailedDescription'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeApiKey = async (platform: string) => {
    if (!confirm(t('settings.apiKeys.messages.removeConfirm', {
      platform: t(`settings.apiKeys.platforms.${platform}`)
    }))) {
      return;
    }

    try {
      const response = await apiClient.delete(`/platforms/${platform}/api-key`);
      
      if (response.data.success) {
        toast({
          title: t('settings.apiKeys.messages.removeSuccess'),
          description: t('settings.apiKeys.messages.removeSuccessDescription', {
            platform: t(`settings.apiKeys.platforms.${platform}`)
          }),
        });
        
        // 直接更新本地狀態
        const updatedData = response.data.data;
        setPlatforms(prev => {
          const existingIndex = prev.findIndex(p => p.platform === platform);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              enabled: updatedData.enabled,
              hasApiKey: updatedData.hasApiKey,
              apiKeyMasked: null,
              lastSync: undefined
            };
            return updated;
          }
          return prev;
        });
        
        await loadPlatformSettings();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error removing API key:', error);
      toast({
        title: t('settings.apiKeys.messages.removeFailed'),
        description: error.response?.data?.message || t('settings.apiKeys.messages.removeFailedDescription'),
        variant: "destructive",
      });
    }
  };

  const togglePlatform = async (platform: string, enabled: boolean) => {
    try {
      const response = await apiClient.put(`/platforms/${platform}/toggle`, {
        enabled
      });
      
      if (response.data.success) {
        const statusKey = enabled ? 'enabled' : 'disabled';
        toast({
          title: t(`settings.apiKeys.messages.toggleSuccess`, {
            platform: t(`settings.apiKeys.platforms.${platform}`),
            status: t(`settings.apiKeys.status.${statusKey}`)
          }),
        });
        
        // 直接更新本地狀態
        const updatedData = response.data.data;
        setPlatforms(prev => {
          const existingIndex = prev.findIndex(p => p.platform === platform);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              enabled: updatedData.enabled,
              hasApiKey: updatedData.hasApiKey
            };
            return updated;
          }
          return prev;
        });
        
        await loadPlatformSettings();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error toggling platform:', error);
      toast({
        title: t('settings.apiKeys.messages.toggleFailed'),
        description: error.response?.data?.message || t('settings.apiKeys.messages.toggleFailedDescription'),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('settings.apiKeys.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.apiKeys.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">{t('settings.apiKeys.loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('settings.apiKeys.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.apiKeys.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(PLATFORM_LABELS).map((platform) => {
            const setting = platforms.find(p => p.platform === platform);
            const hasApiKey = setting?.hasApiKey || false;
            const isEnabled = setting?.enabled || false;

            return (
              <div key={platform}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS]}>
                      {t(`settings.apiKeys.platforms.${platform}`)}
                    </Badge>
                    {hasApiKey ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">{t('settings.apiKeys.status.configured')}</span>
                        {setting?.apiKeyMasked && (
                          <span className="text-xs text-gray-500 font-mono">
                            {normalizeApiKeyDisplay(setting.apiKeyMasked)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{t('settings.apiKeys.status.notConfigured')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {hasApiKey && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`${platform}-enabled`} className="text-sm">
                          {t('settings.apiKeys.status.enabled')}
                        </Label>
                        <Switch
                          id={`${platform}-enabled`}
                          checked={isEnabled}
                          onCheckedChange={(checked) => togglePlatform(platform, checked)}
                        />
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openApiKeyDialog(platform)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      {hasApiKey ? t('settings.apiKeys.actions.edit') : t('settings.apiKeys.actions.setup')}
                    </Button>
                    
                    {hasApiKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeApiKey(platform)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {platform !== 'perplexity' && <Separator className="mt-4" />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPlatform && t('settings.apiKeys.dialog.title', {
                platform: t(`settings.apiKeys.platforms.${selectedPlatform}`)
              })}
            </DialogTitle>
            <DialogDescription>
              {t('settings.apiKeys.dialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {requirements && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>{t('settings.apiKeys.requirements.format')}</strong>{requirements.format}</p>
                    <p><strong>{t('settings.apiKeys.requirements.example')}</strong><code className="text-xs">{requirements.example}</code></p>
                    {requirements.documentation && (
                      <a
                        href={requirements.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {t('settings.apiKeys.requirements.documentation')} <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="api-key">{t('settings.apiKeys.dialog.apiKeyLabel')}</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder={t('settings.apiKeys.dialog.apiKeyPlaceholder')}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setValidationResult(null);
                  }}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {apiKey.trim() && (
              <Button
                type="button"
                variant="outline"
                onClick={validateApiKey}
                disabled={validating}
                className="w-full"
              >
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('settings.apiKeys.dialog.validating')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('settings.apiKeys.dialog.validate')}
                  </>
                )}
              </Button>
            )}

            {validationResult && (
              <Alert className={validationResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  {validationResult.isValid ? (
                    <div>
                      <p className="text-green-700 font-medium">{t('settings.apiKeys.validation.success')}</p>
                      {validationResult.providerInfo && (
                        <div className="mt-2 text-sm text-green-600">
                          <p>{t('settings.apiKeys.validation.provider')}: {validationResult.providerInfo.name}</p>
                          {validationResult.providerInfo.model && (
                            <p>{t('settings.apiKeys.validation.model')}: {validationResult.providerInfo.model}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-700">{validationResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('settings.apiKeys.dialog.cancel')}
            </Button>
            <Button
              onClick={saveApiKey}
              disabled={!validationResult?.isValid || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('settings.apiKeys.dialog.saving')}
                </>
              ) : (
                t('settings.apiKeys.dialog.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}