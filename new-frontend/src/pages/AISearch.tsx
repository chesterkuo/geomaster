import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Plus, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  Target,
  Users,
  Eye,
  BarChart3,
  MessageSquare,
  Star,
  Clock,
  X,
  Lock,
  User,
  Loader2,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import { useVisibilityTrends, useVisibilityStats, usePlatformPerformance, useVisibilityHistory } from "@/hooks/useVisibility";
import { useCompetitiveAnalysis, useCompetitors, useAddCompetitor } from "@/hooks/useCompetitors";
import { VisibilityTrendsChart } from "@/components/charts/VisibilityTrendsChart";
import { PlatformDistributionChart } from "@/components/charts/PlatformDistributionChart";
import { CompetitorComparisonChart } from "@/components/charts/CompetitorComparisonChart";
import { aiSearchService, Keyword, Competitor, TrackingSettings, PlatformSettings } from "@/lib/api/aiSearch";
import { websiteService, Website } from "@/lib/api/websites";
import { tokenManager } from "@/lib/api/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth/AuthModal";
import { useTranslation } from "react-i18next";

const AISearch = () => {
  const { t } = useTranslation();
  const { isAuthenticated, organization } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Helper function to check if a platform is available (considering API keys)
  const isPlatformAvailable = (platform: string): { available: boolean; hasApiKey: boolean; message: string } => {
    const platformSetting = platformSettings.find(p => p.platform === platform);
    // Check both hasApiKey field and apiKey field for backward compatibility
    const hasApiKey = platformSetting?.hasApiKey || (platformSetting?.apiKey && platformSetting.apiKey !== null && platformSetting.apiKey !== '') || false;
    
    // Debug logging
    console.log(`Platform: ${platform}, Setting:`, platformSetting, `HasApiKey: ${hasApiKey}`);
    
    // If organization is not on free plan, all platforms are available
    if (organization?.plan !== 'free') {
      return { available: true, hasApiKey, message: `${organization?.plan} ${t('aiSearch.platforms.paidPlanNote')}` };
    }
    
    // For free plan users
    if (platform === 'gemini') {
      return { available: true, hasApiKey, message: t('aiSearch.platforms.free') };
    }
    
    // For paid-only platforms on free plan
    if (hasApiKey) {
      return { available: true, hasApiKey: true, message: t('aiSearch.platforms.useYourApiKey') };
    }
    
    return { available: false, hasApiKey: false, message: t('aiSearch.platforms.needUpgradeOrApiKey') };
  };
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");
  const [newWebsiteName, setNewWebsiteName] = useState("");
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [newCompetitorUrl, setNewCompetitorUrl] = useState("");
  const [newCompetitorName, setNewCompetitorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    chatgpt: true,
    gemini: false,
    perplexity: false,
    claude: true
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      
      // Check actual token availability instead of just React auth state
      const hasValidAuth = tokenManager.getAccessToken() && tokenManager.getOrganizationId();
      
      if (!hasValidAuth) {
        // Show preview/mock data when not authenticated
        setTimeout(() => {
          setKeywords([
            { id: '1', keyword: '專案管理', intent: 'informational', isActive: true, createdAt: '2024-01-01' },
            { id: '2', keyword: '團隊協作工具', intent: 'commercial', isActive: true, createdAt: '2024-01-01' },
            { id: '3', keyword: 'Scrum 方法論', intent: 'informational', isActive: true, createdAt: '2024-01-01' },
          ]);
          setCompetitors([
            { id: '1', name: 'Competitor A', websiteUrl: 'https://competitor-a.com', isActive: true, createdAt: '2024-01-01' },
            { id: '2', name: 'Competitor B', websiteUrl: 'https://competitor-b.com', isActive: true, createdAt: '2024-01-01' },
          ]);
          setLoading(false);
        }, 1000);
        return;
      }

      // Load real data for authenticated users
      const [keywordsRes, competitorsRes, trackingRes, platformsRes, websitesRes] = await Promise.all([
        aiSearchService.getKeywords(),
        aiSearchService.getCompetitors(),
        aiSearchService.getTrackingSettings(),
        aiSearchService.getPlatformSettings(),
        websiteService.getList()
      ]);

      if (keywordsRes.success) setKeywords(keywordsRes.data.keywords || []);
      if (competitorsRes.success) setCompetitors(competitorsRes.data.competitors || []);
      if (trackingRes.success) setTrackingSettings(trackingRes.data);
      if (platformsRes.success) {
        console.log('Platform settings from API:', platformsRes.data);
        setPlatformSettings(platformsRes.data);
        // Store in localStorage for console debugging
        localStorage.setItem('platformSettings', JSON.stringify(platformsRes.data));
        // Update selected platforms based on API data
        const platformMap: any = {};
        platformsRes.data.forEach(p => {
          platformMap[p.platform] = p.enabled;
        });
        setSelectedPlatforms(prev => ({ ...prev, ...platformMap }));
      }
      
      // Load websites and set the first one as selected
      if (websitesRes.success && websitesRes.data.websites.length > 0) {
        setWebsites(websitesRes.data.websites);
        setSelectedWebsiteId(websitesRes.data.websites[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('aiSearch.messages.loadDataFailed'));
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = async (intent: string) => {
    if (!newKeyword.trim()) return;
    
    try {
      const response = await aiSearchService.createKeyword({
        keyword: newKeyword,
        intent: intent as any
      });
      
      if (response.success) {
        setKeywords([...keywords, response.data]);
        setNewKeyword("");
        toast.success(t('aiSearch.messages.keywordAdded'));
      }
    } catch (error) {
      console.error('Error adding keyword:', error);
      toast.error(t('aiSearch.messages.keywordAddFailed'));
    }
  };

  const removeKeyword = async (keywordId: string) => {
    try {
      const response = await aiSearchService.deleteKeyword(keywordId);
      if (response.success) {
        setKeywords(keywords.filter(k => k.id !== keywordId));
        toast.success(t('aiSearch.messages.keywordRemoved'));
      }
    } catch (error) {
      console.error('Error removing keyword:', error);
      toast.error(t('aiSearch.messages.keywordRemoveFailed'));
    }
  };

  const addCompetitor = async () => {
    if (!newCompetitor.trim()) return;
    
    try {
      const response = await aiSearchService.addCompetitor({
        websiteUrl: newCompetitor,
        name: newCompetitor
      });
      
      if (response.success) {
        setCompetitors([...competitors, response.data]);
        setNewCompetitor("");
        toast.success(t('aiSearch.messages.competitorAdded'));
      }
    } catch (error) {
      console.error('Error adding competitor:', error);
      toast.error(t('aiSearch.messages.competitorAddFailed'));
    }
  };

  const removeCompetitor = async (competitorId: string) => {
    try {
      const response = await aiSearchService.removeCompetitor(competitorId);
      if (response.success) {
        setCompetitors(competitors.filter(c => c.id !== competitorId));
        toast.success(t('aiSearch.messages.competitorRemoved'));
      }
    } catch (error) {
      console.error('Error removing competitor:', error);
      toast.error(t('aiSearch.messages.competitorRemoveFailed'));
    }
  };

  const updateTrackingSettings = async (frequency: string) => {
    try {
      const enabledPlatforms = Object.entries(selectedPlatforms)
        .filter(([_, enabled]) => enabled)
        .map(([platform]) => platform);
      
      const requestData = {
        trackingEnabled: true,
        trackingFrequency: frequency as any,
        platforms: enabledPlatforms
      };

      
      const response = await aiSearchService.updateTrackingSettings(requestData);
      
      if (response.success) {
        setTrackingSettings(response.data);
        toast.success(t('aiSearch.messages.trackingSettingsUpdated'));
      }
    } catch (error: any) {
      console.error('Error updating tracking settings:', error);
      
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message;
        if (errorMessage && errorMessage.includes('plan allows maximum')) {
          // Plan limitation error
          toast.error(`🚫 ${errorMessage}`, {
            duration: 6000,
          });
        } else {
          toast.error(t('aiSearch.messages.insufficientPermissions'));
        }
        console.log('403 錯誤詳情:', {
          status: error.response?.status,
          message: errorMessage,
          url: error.config?.url,
          method: error.config?.method,
          hasToken: !!localStorage.getItem('geo_access_token'),
          hasOrgId: !!localStorage.getItem('geo_organization_id'),
          organizationPlan: organization?.plan,
          enabledPlatforms: Object.entries(selectedPlatforms).filter(([_, enabled]) => enabled).length
        });
      } else if (error.response?.status === 401) {
        toast.error(t('aiSearch.messages.authRequired'));
        setShowAuthModal(true);
      } else {
        toast.error(error.response?.data?.message || t('aiSearch.messages.trackingSettingsUpdateFailed'));
      }
    }
  };

  // Get keywords by intent
  const getBrandKeywords = () => keywords.filter(k => k.intent === 'commercial' || k.intent === 'navigational');
  const getIndustryKeywords = () => keywords.filter(k => k.intent === 'informational' || k.intent === 'transactional');

  // Date range for visibility data
  const [visibilityDateRange, setVisibilityDateRange] = useState('30d');
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | undefined>();
  
  // Fetch visibility data with React Query
  console.log('📊 Fetching visibility trends with:', { dateRange: visibilityDateRange, websiteId: selectedWebsiteId });
  const { data: visibilityTrends, isLoading: trendsLoading, error: trendsError } = useVisibilityTrends(
    { dateRange: visibilityDateRange, websiteId: selectedWebsiteId },
    { enabled: isAuthenticated }
  );
  
  const { data: visibilityStats, isLoading: statsLoading } = useVisibilityStats(
    selectedWebsiteId,
    { enabled: isAuthenticated }
  );
  
  const { data: platformPerformance, isLoading: platformLoading } = usePlatformPerformance(
    { dateRange: visibilityDateRange, websiteId: selectedWebsiteId },
    { enabled: isAuthenticated }
  );
  
  const { data: visibilityHistory } = useVisibilityHistory(
    selectedWebsiteId || '',
    visibilityDateRange as '7d' | '30d' | '90d' | '12m',
    { enabled: isAuthenticated && !!selectedWebsiteId }
  );
  
  // Fetch competitive analysis data
  const { data: competitiveAnalysis, isLoading: competitiveLoading, error: competitiveError } = useCompetitiveAnalysis(
    selectedWebsiteId || '',
    visibilityDateRange,
    { enabled: isAuthenticated && !!selectedWebsiteId }
  );
  
  const { data: competitorsList } = useCompetitors(
    { websiteId: selectedWebsiteId },
    { enabled: isAuthenticated }
  );

  // Use the addCompetitor mutation hook
  const addCompetitorMutation = useAddCompetitor();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('aiSearch.title')}</h1>
            <p className="text-muted-foreground">
              {t('aiSearch.description')}
              {!isAuthenticated && <span className="ml-2 text-amber-600">• {t('aiSearch.loginRequired')}</span>}
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground"
            disabled={!isAuthenticated}
            onClick={isAuthenticated ? undefined : () => setShowAuthModal(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            {t('aiSearch.trackingSettings')}
          </Button>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">{t('aiSearch.tabs.setup')}</TabsTrigger>
            <TabsTrigger value="overview">{t('aiSearch.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="analysis">{t('aiSearch.tabs.analysis')}</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('aiSearch.overview.loginRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('aiSearch.overview.loginRequiredDesc')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('aiSearch.actions.login')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle>{t('aiSearch.setup.title')}</CardTitle>
                  <CardDescription>{t('aiSearch.setup.description')}</CardDescription>
                </CardHeader>
              <CardContent className="space-y-6">
                {/* 品牌關鍵字 */}
                <div className="space-y-3">
                  <h4 className="font-medium">{t('aiSearch.setup.brandKeywords')}</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {getBrandKeywords().map((keyword) => (
                      <Badge key={keyword.id} variant="default" className="flex items-center gap-2">
                        {keyword.keyword}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive"
                          onClick={() => removeKeyword(keyword.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('aiSearch.setup.brandKeywordPlaceholder')}
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword('commercial')}
                    />
                    <Button onClick={() => isAuthenticated ? addKeyword('commercial') : setShowAuthModal(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 產業關鍵字 */}
                <div className="space-y-3">
                  <h4 className="font-medium">{t('aiSearch.setup.industryKeywords')}</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {getIndustryKeywords().map((keyword) => (
                      <Badge key={keyword.id} variant="secondary" className="flex items-center gap-2">
                        {keyword.keyword}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive"
                          onClick={() => removeKeyword(keyword.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('aiSearch.setup.industryKeywordPlaceholder')}
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword('informational')}
                    />
                    <Button onClick={() => isAuthenticated ? addKeyword('informational') : setShowAuthModal(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 競爭對手 */}
                <div className="space-y-3">
                  <h4 className="font-medium">{t('aiSearch.setup.competitors')}</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {competitors.map((competitor) => (
                      <Badge key={competitor.id} variant="outline" className="flex items-center gap-2">
                        {competitor.name || competitor.domain}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive"
                          onClick={() => removeCompetitor(competitor.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('aiSearch.setup.competitorPlaceholder')}
                      value={newCompetitor}
                      onChange={(e) => setNewCompetitor(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
                    />
                    <Button onClick={() => isAuthenticated ? addCompetitor() : setShowAuthModal(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                  {/* 追蹤頻率 */}
                  <div className="space-y-3">
                    <h4 className="font-medium">{t('aiSearch.setup.trackingFrequency')}</h4>
                    <Select 
                      defaultValue={trackingSettings?.trackingFrequency || "daily"}
                      onValueChange={(value) => updateTrackingSettings(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{t('aiSearch.frequency.daily')}</SelectItem>
                        <SelectItem value="weekly">{t('aiSearch.frequency.weekly')}</SelectItem>
                        <SelectItem value="hourly">{t('aiSearch.frequency.hourly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* AI 平台 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{t('aiSearch.setup.aiPlatforms')}</h4>
                      {organization?.plan === 'free' && (
                        <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                          {t('aiSearch.platforms.freePlanNote')}
                        </div>
                      )}
                      {organization?.plan && organization.plan !== 'free' && (
                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                          {organization.plan} {t('aiSearch.platforms.paidPlanNote')}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="chatgpt" 
                          checked={selectedPlatforms.chatgpt}
                          disabled={!isPlatformAvailable('chatgpt').available}
                          onCheckedChange={(checked) => {
                            const platformStatus = isPlatformAvailable('chatgpt');
                            if (!platformStatus.available) {
                              toast.error(t('aiSearch.messages.chatgptRequiresUpgrade'));
                              return;
                            }
                            setSelectedPlatforms({...selectedPlatforms, chatgpt: checked as boolean});
                          }}
                        />
                        <label htmlFor="chatgpt" className={`text-sm ${!isPlatformAvailable('chatgpt').available ? 'text-gray-400' : ''}`}>
                          {t('aiSearch.platforms.chatgpt')}
                          <span className="ml-2 text-xs text-amber-600">({isPlatformAvailable('chatgpt').message})</span>
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="gemini" 
                          checked={selectedPlatforms.gemini}
                          onCheckedChange={(checked) => {
                            setSelectedPlatforms({...selectedPlatforms, gemini: checked as boolean});
                          }}
                        />
                        <label htmlFor="gemini" className="text-sm">
                          {t('aiSearch.platforms.gemini')}
                          {organization?.plan === 'free' && <span className="ml-2 text-xs text-green-600">({t('aiSearch.platforms.free')})</span>}
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="perplexity" 
                          checked={selectedPlatforms.perplexity}
                          disabled={!isPlatformAvailable('perplexity').available}
                          onCheckedChange={(checked) => {
                            const platformStatus = isPlatformAvailable('perplexity');
                            if (!platformStatus.available) {
                              toast.error(t('aiSearch.messages.perplexityRequiresUpgrade'));
                              return;
                            }
                            setSelectedPlatforms({...selectedPlatforms, perplexity: checked as boolean});
                          }}
                        />
                        <label htmlFor="perplexity" className={`text-sm ${!isPlatformAvailable('perplexity').available ? 'text-gray-400' : ''}`}>
                          {t('aiSearch.platforms.perplexity')}
                          <span className="ml-2 text-xs text-amber-600">({isPlatformAvailable('perplexity').message})</span>
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="claude" 
                          checked={selectedPlatforms.claude}
                          disabled={!isPlatformAvailable('claude').available}
                          onCheckedChange={(checked) => {
                            const platformStatus = isPlatformAvailable('claude');
                            if (!platformStatus.available) {
                              toast.error(t('aiSearch.messages.claudeRequiresUpgrade'));
                              return;
                            }
                            setSelectedPlatforms({...selectedPlatforms, claude: checked as boolean});
                          }}
                        />
                        <label htmlFor="claude" className={`text-sm ${!isPlatformAvailable('claude').available ? 'text-gray-400' : ''}`}>
                          {t('aiSearch.platforms.claude')}
                          <span className="ml-2 text-xs text-amber-600">({isPlatformAvailable('claude').message})</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary text-primary-foreground"
                  onClick={async () => {
                    if (!isAuthenticated) {
                      setShowAuthModal(true);
                      return;
                    }
                    
                    try {
                      // 開始追蹤 - 更新追蹤設定並啟動追蹤
                      const enabledPlatforms = Object.entries(selectedPlatforms)
                        .filter(([_, enabled]) => enabled)
                        .map(([platform]) => platform);
                      
                      if (enabledPlatforms.length === 0) {
                        toast.error(t('aiSearch.messages.pleaseSelectPlatform'));
                        return;
                      }
                      
                      // 檢查選中的平台是否都可用
                      const unavailablePlatforms = enabledPlatforms.filter(platform => 
                        !isPlatformAvailable(platform).available
                      );
                      
                      if (unavailablePlatforms.length > 0) {
                        const platformNames = unavailablePlatforms.map(p => {
                          switch(p) {
                            case 'chatgpt': return 'ChatGPT';
                            case 'claude': return 'Claude';
                            case 'perplexity': return 'Perplexity';
                            case 'gemini': return 'Gemini';
                            default: return p;
                          }
                        }).join(', ');
                        toast.error(t('aiSearch.messages.platformRequiresUpgrade', { platforms: platformNames }));
                        return;
                      }
                      
                      if (keywords.length === 0) {
                        toast.error(t('aiSearch.messages.pleaseAddKeyword'));
                        return;
                      }
                      
                      // 更新追蹤設定並啟動追蹤
                      const response = await aiSearchService.updateTrackingSettings({
                        trackingEnabled: true,
                        trackingFrequency: trackingSettings?.trackingFrequency || 'daily',
                        platforms: enabledPlatforms
                      });
                      
                      if (response.success) {
                        setTrackingSettings(response.data);
                        toast.success(t('aiSearch.messages.trackingStarted', { keywords: keywords.length, platforms: enabledPlatforms.length }));
                      }
                    } catch (error: any) {
                      console.error('啟動追蹤失敗:', error);
                      toast.error(error.response?.data?.message || error.message || t('aiSearch.messages.trackingStartFailed'));
                    }
                  }}
                  disabled={!isAuthenticated || keywords.length === 0}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {t('aiSearch.actions.startTracking')}
                </Button>
              </CardContent>
            </Card>
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            {(loading || trendsLoading || statsLoading || platformLoading) ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">{t('aiSearch.overview.loadingData')}</span>
              </div>
            ) : trendsError ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-lg font-medium text-orange-500 mb-2">{t('aiSearch.overview.dataCollecting')}</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('aiSearch.overview.dataCollectingDesc')}
                  </p>
                  <div className="space-y-2">
                    <Button onClick={() => window.location.reload()} variant="outline">
                      {t('aiSearch.overview.recheckData')}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {t('aiSearch.overview.troubleshootNote')}
                    </p>
                  </div>
                </div>
              </div>
            ) : !selectedWebsiteId && !showAddWebsite ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('aiSearch.overview.noWebsiteSetup')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('aiSearch.overview.needAddWebsite')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAddWebsite(true)} className="bg-primary text-primary-foreground">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('aiSearch.overview.addWebsite')}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {t('aiSearch.overview.addWebsiteNote')}
                    </p>
                  </div>
                </div>
              </div>
            ) : showAddWebsite ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('aiSearch.website.title')}</CardTitle>
                    <CardDescription>{t('aiSearch.website.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('aiSearch.website.urlLabel')}</label>
                      <Input
                        value={newWebsiteUrl}
                        onChange={(e) => setNewWebsiteUrl(e.target.value)}
                        placeholder={t('aiSearch.website.urlPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('aiSearch.website.nameLabel')}</label>
                      <Input
                        value={newWebsiteName}
                        onChange={(e) => setNewWebsiteName(e.target.value)}
                        placeholder={t('aiSearch.website.namePlaceholder')}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          if (!newWebsiteUrl) {
                            toast.error(t('aiSearch.messages.pleaseEnterUrl'));
                            return;
                          }
                          
                          try {
                            const response = await websiteService.create({
                              url: newWebsiteUrl,
                              name: newWebsiteName || new URL(newWebsiteUrl).hostname,
                              scanFrequency: 'daily'
                            });
                            
                            if (response.success) {
                              toast.success(t('aiSearch.messages.websiteAdded'));
                              setWebsites([...websites, response.data.website]);
                              setSelectedWebsiteId(response.data.website.id);
                              setShowAddWebsite(false);
                              setNewWebsiteUrl("");
                              setNewWebsiteName("");
                            } else {
                              toast.error(response.error || t('aiSearch.messages.websiteAddFailed'));
                            }
                          } catch (error: any) {
                            console.error("創建網站錯誤:", error);
                            if (error.response?.status === 401) {
                              toast.error("請重新登入後再試");
                              setShowAuthModal(true);
                            } else if (error.response?.status === 403) {
                              const errorMsg = error.response?.data?.message || "權限不足，請聯絡管理員或升級您的方案";
                              
                              // 特別處理網站數量限制錯誤
                              if (errorMsg.includes("Maximum websites limit")) {
                                toast.error("❌ 組織網站數量已達上限！請刪除舊網站或升級方案");
                                setTimeout(() => {
                                  toast.info("💡 解決方案：\n1. 前往主頁刪除不需要的網站\n2. 聯絡管理員提升組織網站限制\n3. 升級到更高方案");
                                }, 2000);
                              } else {
                                toast.error(`權限錯誤：${errorMsg}`);
                              }
                              console.log("403錯誤詳情:", error.response?.data);
                              
                              // 診斷 admin 權限問題
                              console.log("權限診斷信息:", {
                                statusCode: error.response?.status,
                                errorMessage: error.response?.data?.message,
                                hasToken: !!localStorage.getItem('geo_access_token'),
                                hasOrgId: !!localStorage.getItem('geo_organization_id'),
                                organizationId: localStorage.getItem('geo_organization_id')
                              });
                            } else if (error.response?.data?.message) {
                              toast.error(error.response.data.message);
                            } else {
                              toast.error("添加網站失敗，請稍後再試");
                            }
                          }
                        }}
                        className="bg-primary text-primary-foreground"
                      >
                        {t('aiSearch.website.confirmAdd')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddWebsite(false);
                          setNewWebsiteUrl("");
                          setNewWebsiteName("");
                        }}
                      >
                        {t('aiSearch.website.cancel')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('aiSearch.overview.loginRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('aiSearch.overview.loginRequiredDesc')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('aiSearch.actions.login')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Controls and Info */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">{t('aiSearch.overview.website')}</label>
                      <Select value={selectedWebsiteId || ''} onValueChange={(value) => {
                        if (value === 'add-new') {
                          setShowAddWebsite(true);
                        } else {
                          setSelectedWebsiteId(value);
                        }
                      }}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder={t('aiSearch.overview.selectWebsite')} />
                        </SelectTrigger>
                        <SelectContent>
                          {websites.map((website) => (
                            <SelectItem key={website.id} value={website.id}>
                              {website.name || website.url}
                            </SelectItem>
                          ))}
                          <SelectItem value="add-new">
                            <Plus className="mr-2 h-4 w-4 inline" />
                            {t('aiSearch.overview.addNewWebsite')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">{t('aiSearch.overview.timeRange')}</label>
                      <div className="flex gap-2">
                        <Button
                          variant={visibilityDateRange === '7d' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            console.log('🔄 Date range changed to: 7d');
                            setVisibilityDateRange('7d');
                          }}
                        >
                          {t('aiSearch.timeRanges.7d')}
                        </Button>
                        <Button
                          variant={visibilityDateRange === '30d' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            console.log('🔄 Date range changed to: 30d');
                            setVisibilityDateRange('30d');
                          }}
                        >
                          {t('aiSearch.timeRanges.30d')}
                        </Button>
                        <Button
                          variant={visibilityDateRange === '90d' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            console.log('🔄 Date range changed to: 90d');
                            setVisibilityDateRange('90d');
                          }}
                        >
                          {t('aiSearch.timeRanges.90d')}
                        </Button>
                        <Button
                          variant={visibilityDateRange === '12m' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            console.log('🔄 Date range changed to: 12m');
                            setVisibilityDateRange('12m');
                          }}
                        >
                          {t('aiSearch.timeRanges.12m')}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadData()}>
                      <Clock className="h-4 w-4 mr-2" />
                      {t('aiSearch.overview.reload')}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('aiSearch.overview.exportReport')}
                    </Button>
                  </div>
                </div>
                
                
                {/* 總覽指標 */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Card className="bg-gradient-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('aiSearch.metrics.brandMentionRate')}</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {visibilityStats?.data?.brandMentionRate?.value || 0}%
                      </div>
                      <div className={`flex items-center space-x-1 text-xs ${
                        (visibilityStats?.data.brandMentionRate?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(visibilityStats?.data.brandMentionRate?.change || 0) >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {(visibilityStats?.data.brandMentionRate?.change || 0) > 0 ? '↑' : '↓'}
                          {Math.abs(visibilityStats?.data.brandMentionRate?.change || 0)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('aiSearch.metrics.citationPosition')}</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {t('aiSearch.metrics.averagePosition', { position: visibilityStats?.data?.averagePosition?.value || 0 })}
                      </div>
                      <div className={`flex items-center space-x-1 text-xs ${
                        (visibilityStats?.data?.averagePosition?.change || 0) <= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(visibilityStats?.data.averagePosition?.change || 0) <= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {(visibilityStats?.data.averagePosition?.change || 0) <= 0 ? t('aiSearch.metrics.improved') : t('aiSearch.metrics.declined')}
                          {Math.abs(visibilityStats?.data.averagePosition?.change || 0)} 位
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('aiSearch.metrics.sentimentAnalysis')}</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {visibilityStats?.data?.sentimentScore?.value || 0}% {t('aiSearch.metrics.positive')}
                      </div>
                      <div className={`flex items-center space-x-1 text-xs ${
                        (visibilityStats?.data?.sentimentScore?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(visibilityStats?.data.sentimentScore?.change || 0) >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {(visibilityStats?.data.sentimentScore?.change || 0) > 0 ? '↑' : '↓'}
                          {Math.abs(visibilityStats?.data.sentimentScore?.change || 0)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Visibility Trends Chart */}
                {visibilityTrends?.data?.trends && visibilityTrends.data.trends.length > 0 ? (
                  <div className="mb-6">
                    <VisibilityTrendsChart 
                      data={visibilityTrends.data.trends}
                      title={t('aiSearch.charts.visibilityTrends')}
                      description={t('aiSearch.charts.visibilityTrendsDesc')}
                      chartType="line"
                    />
                  </div>
                ) : (
                  <div className="mb-6">
                    <Card className="bg-gradient-card border-border">
                      <CardHeader>
                        <CardTitle>{t('aiSearch.charts.visibilityTrends')}</CardTitle>
                        <CardDescription>{t('aiSearch.charts.visibilityTrendsDesc')}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center py-8">
                        <Clock className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                        <p className="text-muted-foreground mb-2">{t('aiSearch.charts.dataCollecting')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('aiSearch.charts.dataCollectingNote')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Platform Distribution */}
                {platformPerformance?.data.platforms && (
                  <div className="mb-6">
                    <PlatformDistributionChart
                      data={platformPerformance.data.platforms.map(platform => ({
                        platform: platform.platform.toLowerCase(),
                        value: platform.totalMentions,
                        percentage: platform.mentionRate,
                        change: platform.change
                      }))}
                      title={t('aiSearch.charts.platformDistribution')}
                      description={t('aiSearch.charts.platformDistributionDesc')}
                    />
                  </div>
                )}

                {/* Platform Performance Details */}
                {platformPerformance?.data.platforms && (
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>{t('aiSearch.charts.platformPerformance')}</CardTitle>
                      <CardDescription>{t('aiSearch.charts.platformPerformanceDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {platformPerformance.data.platforms.map((platform) => {
                          const platformIcons = {
                            chatgpt: <Brain className="h-5 w-5 text-green-500" />,
                            gemini: <Star className="h-5 w-5 text-blue-500" />,
                            perplexity: <Eye className="h-5 w-5 text-purple-500" />,
                            claude: <MessageSquare className="h-5 w-5 text-orange-500" />
                          };
                          
                          return (
                            <div key={platform.platform} className="p-4 bg-gradient-subtle rounded-lg border border-border">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  {platformIcons[platform.platform.toLowerCase() as keyof typeof platformIcons] || 
                                   <MessageSquare className="h-5 w-5 text-gray-500" />}
                                  <h4 className="font-medium capitalize">{platform.platform}</h4>
                                </div>
                                <Badge variant="secondary">#{platform.position}</Badge>
                              </div>
                              <div className="text-2xl font-bold mb-1">{platform.mentionRate}%</div>
                              <div className="text-xs text-muted-foreground mb-2">{t('aiSearch.charts.mentionRate')}</div>
                              <Progress value={platform.mentionRate} className="h-2" />
                              <div className={`flex items-center space-x-1 text-xs mt-2 ${
                                platform.change >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {platform.change >= 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                <span>{platform.change > 0 ? '↑' : '↓'}{Math.abs(platform.change)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Competitors Overview */}
                {competitorsList?.data.competitors && competitorsList.data.competitors.length > 0 && (
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{t('aiSearch.competitors.overview')}</CardTitle>
                          <CardDescription>{t('aiSearch.competitors.overviewDesc')}</CardDescription>
                        </div>
                        <Badge variant="outline">
                          {t('aiSearch.competitors.count', { count: competitorsList.data.competitors.length })}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {competitorsList.data.competitors.slice(0, 6).map((competitor) => (
                          <div key={competitor.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-gradient-subtle">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {competitor.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">{competitor.name}</div>
                                <div className="text-xs text-muted-foreground">{competitor.domain}</div>
                              </div>
                            </div>
                            <Badge variant={competitor.isActive ? "default" : "secondary"} className="text-xs">
                              {competitor.isActive ? t('aiSearch.competitors.tracking') : t('aiSearch.competitors.paused')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      {competitorsList.data.competitors.length > 6 && (
                        <div className="mt-4 text-center">
                          <Button variant="outline" size="sm" onClick={() => {
                            // Switch to analysis tab to see all competitors
                            const analysisTab = document.querySelector('[value="analysis"]') as HTMLElement;
                            if (analysisTab) analysisTab.click();
                          }}>
                            {t('aiSearch.competitors.viewAll', { count: competitorsList.data.competitors.length })}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {(loading || competitiveLoading) ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">{t('aiSearch.analysis.loadingData')}</span>
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('aiSearch.analysis.loginRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('aiSearch.analysis.loginRequiredDesc')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('aiSearch.actions.login')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Competitor Management Section */}
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{t('aiSearch.competitors.management')}</CardTitle>
                        <CardDescription>{t('aiSearch.competitors.managementDesc')}</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowAddCompetitor(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('aiSearch.competitors.addCompetitor')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showAddCompetitor ? (
                      <div className="space-y-4 p-4 border border-border rounded-lg mb-4">
                        <h4 className="font-medium">{t('aiSearch.competitors.addCompetitor')}</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">{t('aiSearch.competitors.urlLabel')}</label>
                            <Input
                              value={newCompetitorUrl}
                              onChange={(e) => setNewCompetitorUrl(e.target.value)}
                              placeholder="https://competitor.com"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">{t('aiSearch.competitors.nameLabel')}</label>
                            <Input
                              value={newCompetitorName}
                              onChange={(e) => setNewCompetitorName(e.target.value)}
                              placeholder={t('aiSearch.competitors.namePlaceholder')}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={async () => {
                                if (!newCompetitorUrl.trim()) {
                                  toast.error(t('aiSearch.messages.competitorUrlRequired'));
                                  return;
                                }
                                
                                // Use the mutation hook to add competitor
                                addCompetitorMutation.mutate({
                                  websiteUrl: newCompetitorUrl,
                                  name: newCompetitorName || new URL(newCompetitorUrl).hostname
                                }, {
                                  onSuccess: () => {
                                    // Reset form on success
                                    setShowAddCompetitor(false);
                                    setNewCompetitorUrl("");
                                    setNewCompetitorName("");
                                  },
                                  onError: (error: any) => {
                                    console.error("添加競爭對手錯誤:", error);
                                    if (error?.response?.status === 401) {
                                      setShowAuthModal(true);
                                    }
                                  }
                                });
                              }}
                              className="bg-primary text-primary-foreground"
                              disabled={addCompetitorMutation.isPending}
                            >
                              {addCompetitorMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {t('aiSearch.competitors.adding')}
                                </>
                              ) : (
                                t('aiSearch.website.confirmAdd')
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowAddCompetitor(false);
                                setNewCompetitorUrl("");
                                setNewCompetitorName("");
                              }}
                            >
                              {t('aiSearch.website.cancel')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="grid gap-3">
                      {competitorsList?.data.competitors?.map((competitor) => (
                        <div key={competitor.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-subtle rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {competitor.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{competitor.name}</div>
                              <div className="text-sm text-muted-foreground">{competitor.domain}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={competitor.isActive ? "default" : "secondary"}>
                              {competitor.isActive ? t('aiSearch.competitors.tracking') : t('aiSearch.competitors.paused')}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>{t('aiSearch.competitors.noCompetitors')}</p>
                          <p className="text-sm">{t('aiSearch.competitors.noCompetitorsNote')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>


                {/* Competitive Analysis Chart */}
                {competitiveAnalysis?.data.analysis && (
                  <CompetitorComparisonChart
                    data={[
                      {
                        ...competitiveAnalysis.data.analysis.yourBrand,
                        competitorId: 'your-brand',
                        domain: 'your-domain.com',
                        isYourBrand: true,
                        trends: { visibilityTrend: 0, mentionTrend: 0, positionTrend: 0 },
                        platforms: {
                          chatgpt: { mentions: 0, avgPosition: 0, sentiment: 0 },
                          perplexity: { mentions: 0, avgPosition: 0, sentiment: 0 },
                          gemini: { mentions: 0, avgPosition: 0, sentiment: 0 },
                          claude: { mentions: 0, avgPosition: 0, sentiment: 0 },
                        }
                      },
                      ...competitiveAnalysis.data.analysis.competitors
                    ]}
                    title={t('aiSearch.analysis.competitorPerformanceComparison')}
                    description={t('aiSearch.analysis.competitorPerformanceDesc')}
                  />
                )}

                {/* No Analysis Data Available */}
                {!competitiveLoading && !competitiveAnalysis?.data?.analysis && competitorsList?.data?.competitors?.length > 0 && (
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>{t('aiSearch.analysis.dataAnalyzing')}</CardTitle>
                      <CardDescription>{t('aiSearch.analysis.collectingDataDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-8">
                      <div className="flex flex-col items-center space-y-4">
                        <Clock className="h-12 w-12 text-orange-500" />
                        <div>
                          <p className="text-lg font-medium text-muted-foreground mb-2">{t('aiSearch.analysis.analysisInProgress')}</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            {t('aiSearch.analysis.analysisProgressDesc', { count: competitorsList.data.competitors.length })}
                          </p>
                          <Button variant="outline" onClick={() => window.location.reload()}>
                            {t('aiSearch.analysis.recheckAnalysis')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Market Share Analysis */}
                {competitiveAnalysis?.data.analysis && (
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>{t('aiSearch.marketShare.title')}</CardTitle>
                      <CardDescription>{t('aiSearch.marketShare.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {competitiveAnalysis.data.analysis.yourBrand.marketShare}%
                          </div>
                          <div className="text-sm font-medium mb-1">{t('aiSearch.marketShare.yourBrand')}</div>
                          <Progress value={competitiveAnalysis.data.analysis.yourBrand.marketShare} className="h-2" />
                        </div>

                        {competitiveAnalysis.data.analysis.competitors.slice(0, 3).map((competitor) => (
                          <div key={competitor.competitorId} className="text-center p-4 bg-gradient-subtle rounded-lg border border-border">
                            <div className="text-2xl font-bold text-red-500 mb-1">{competitor.marketShare}%</div>
                            <div className="text-sm font-medium mb-1">{competitor.name}</div>
                            <Progress value={competitor.marketShare} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Competitive Insights */}
                {competitiveAnalysis?.data.insights && competitiveAnalysis.data.insights.length > 0 && (
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>{t('aiSearch.insights.title')}</CardTitle>
                      <CardDescription>{t('aiSearch.insights.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {competitiveAnalysis.data.insights.map((insight, index) => {
                          const iconMap = {
                            opportunity: <TrendingUp className="h-4 w-4 text-green-500" />,
                            threat: <TrendingDown className="h-4 w-4 text-red-500" />,
                            strength: <Target className="h-4 w-4 text-blue-500" />,
                            weakness: <X className="h-4 w-4 text-orange-500" />
                          };

                          return (
                            <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-subtle rounded-lg border border-border">
                              {iconMap[insight.type]}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-medium">{insight.title}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {insight.impact === 'high' ? t('aiSearch.insights.highImpact') : insight.impact === 'medium' ? t('aiSearch.insights.mediumImpact') : t('aiSearch.insights.lowImpact')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                                {insight.competitor && (
                                  <p className="text-xs text-muted-foreground">{t('aiSearch.insights.relatedCompetitor', { competitor: insight.competitor })}</p>
                                )}
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-primary">{t('aiSearch.insights.recommendedAction')}</p>
                                  <p className="text-sm">{insight.recommendedAction}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gap Analysis */}
                {competitiveAnalysis?.data.gapAnalysis && competitiveAnalysis.data.gapAnalysis.length > 0 && (
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>{t('aiSearch.gapAnalysis.title')}</CardTitle>
                      <CardDescription>{t('aiSearch.gapAnalysis.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {competitiveAnalysis.data.gapAnalysis.map((gap, index) => (
                          <div key={index} className="p-4 bg-gradient-subtle rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium">{gap.category}</h5>
                              <div className="text-right">
                                <div className="text-sm">
                                  {t('aiSearch.gapAnalysis.yourScore', { score: gap.yourScore })} vs {t('aiSearch.gapAnalysis.averageScore', { average: gap.competitorAverage })}
                                </div>
                                <div className={`text-xs ${gap.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {t('aiSearch.gapAnalysis.gap', { gap: gap.gap > 0 ? '+' + gap.gap : gap.gap })}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <Progress value={gap.yourScore} className="h-2" />
                              <Progress value={gap.competitorAverage} className="h-2" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{t('aiSearch.gapAnalysis.improvementSuggestions')}</p>
                              {gap.recommendations.map((rec, recIndex) => (
                                <p key={recIndex} className="text-sm text-muted-foreground">• {rec}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          loadData(); // Reload data after login
        }}
      />
    </DashboardLayout>
  );
};

export default AISearch;