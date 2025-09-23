import React, { useState, useEffect } from 'react';
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
        title: "載入失敗",
        description: error.response?.data?.message || "無法載入平台設定",
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
      const errorMessage = error.response?.data?.message || error.message || '驗證失敗';
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
          title: "儲存成功",
          description: `${PLATFORM_LABELS[selectedPlatform as keyof typeof PLATFORM_LABELS]} API Key 已儲存並啟用`,
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
        title: "儲存失敗",
        description: error.response?.data?.message || "無法儲存 API Key",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeApiKey = async (platform: string) => {
    if (!confirm(`確定要移除 ${PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS]} 的 API Key 嗎？`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/platforms/${platform}/api-key`);
      
      if (response.data.success) {
        toast({
          title: "移除成功",
          description: `${PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS]} API Key 已移除`,
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
        title: "移除失敗",
        description: error.response?.data?.message || "無法移除 API Key",
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
        toast({
          title: enabled ? "平台已啟用" : "平台已停用",
          description: `${PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS]} 已${enabled ? '啟用' : '停用'}`,
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
        title: "操作失敗",
        description: error.response?.data?.message || "無法切換平台狀態",
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
            AI API Key 管理
          </CardTitle>
          <CardDescription>
            管理各個 AI 平台的 API Key 設定
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">載入中...</span>
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
            AI API Key 管理
          </CardTitle>
          <CardDescription>
            管理各個 AI 平台的 API Key 設定。您可以新增、編輯或移除 API Key，系統會自動驗證其有效性。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(PLATFORM_LABELS).map(([platform, label]) => {
            const setting = platforms.find(p => p.platform === platform);
            const hasApiKey = setting?.hasApiKey || false;
            const isEnabled = setting?.enabled || false;

            return (
              <div key={platform}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS]}>
                      {label}
                    </Badge>
                    {hasApiKey ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">API Key 已設定</span>
                        {setting?.apiKeyMasked && (
                          <span className="text-xs text-gray-500 font-mono">
                            {normalizeApiKeyDisplay(setting.apiKeyMasked)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">未設定 API Key</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {hasApiKey && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`${platform}-enabled`} className="text-sm">
                          啟用
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
                      {hasApiKey ? '編輯' : '設定'}
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

      {/* API Key 設定對話框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              設定 {selectedPlatform && PLATFORM_LABELS[selectedPlatform as keyof typeof PLATFORM_LABELS]} API Key
            </DialogTitle>
            <DialogDescription>
              請輸入您的 API Key，系統會自動驗證其有效性後再儲存。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {requirements && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>格式要求：</strong>{requirements.format}</p>
                    <p><strong>範例：</strong><code className="text-xs">{requirements.example}</code></p>
                    {requirements.documentation && (
                      <a 
                        href={requirements.documentation} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                      >
                        查看官方文檔 <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="輸入您的 API Key"
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
                    驗證中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    驗證 API Key
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
                      <p className="text-green-700 font-medium">驗證成功！</p>
                      {validationResult.providerInfo && (
                        <div className="mt-2 text-sm text-green-600">
                          <p>提供商: {validationResult.providerInfo.name}</p>
                          {validationResult.providerInfo.model && (
                            <p>模型: {validationResult.providerInfo.model}</p>
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
              取消
            </Button>
            <Button
              onClick={saveApiKey}
              disabled={!validationResult?.isValid || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  儲存中...
                </>
              ) : (
                '儲存 API Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}