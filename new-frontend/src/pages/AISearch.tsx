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
import { useCompetitiveAnalysis, useCompetitors } from "@/hooks/useCompetitors";
import { VisibilityTrendsChart } from "@/components/charts/VisibilityTrendsChart";
import { PlatformDistributionChart } from "@/components/charts/PlatformDistributionChart";
import { CompetitorComparisonChart } from "@/components/charts/CompetitorComparisonChart";
import { aiSearchService, Keyword, Competitor, TrackingSettings, PlatformSettings } from "@/lib/api/aiSearch";
import { websiteService, Website } from "@/lib/api/websites";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth/AuthModal";

const AISearch = () => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    chatgpt: true,
    gemini: true,
    perplexity: true,
    claude: false
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!isAuthenticated) {
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
        setPlatformSettings(platformsRes.data);
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
      toast.error('Failed to load tracking data');
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
        toast.success('Keyword added successfully');
      }
    } catch (error) {
      console.error('Error adding keyword:', error);
      toast.error('Failed to add keyword');
    }
  };

  const removeKeyword = async (keywordId: string) => {
    try {
      const response = await aiSearchService.deleteKeyword(keywordId);
      if (response.success) {
        setKeywords(keywords.filter(k => k.id !== keywordId));
        toast.success('Keyword removed successfully');
      }
    } catch (error) {
      console.error('Error removing keyword:', error);
      toast.error('Failed to remove keyword');
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
        toast.success('Competitor added successfully');
      }
    } catch (error) {
      console.error('Error adding competitor:', error);
      toast.error('Failed to add competitor');
    }
  };

  const removeCompetitor = async (competitorId: string) => {
    try {
      const response = await aiSearchService.removeCompetitor(competitorId);
      if (response.success) {
        setCompetitors(competitors.filter(c => c.id !== competitorId));
        toast.success('Competitor removed successfully');
      }
    } catch (error) {
      console.error('Error removing competitor:', error);
      toast.error('Failed to remove competitor');
    }
  };

  const updateTrackingSettings = async (frequency: string) => {
    try {
      const enabledPlatforms = Object.entries(selectedPlatforms)
        .filter(([_, enabled]) => enabled)
        .map(([platform]) => platform);
      
      const response = await aiSearchService.updateTrackingSettings({
        trackingEnabled: true,
        trackingFrequency: frequency as any,
        platforms: enabledPlatforms
      });
      
      if (response.success) {
        setTrackingSettings(response.data);
        toast.success('Tracking settings updated');
      }
    } catch (error) {
      console.error('Error updating tracking settings:', error);
      toast.error('Failed to update tracking settings');
    }
  };

  // Get keywords by intent
  const getBrandKeywords = () => keywords.filter(k => k.intent === 'commercial' || k.intent === 'navigational');
  const getIndustryKeywords = () => keywords.filter(k => k.intent === 'informational' || k.intent === 'transactional');

  // Date range for visibility data
  const [visibilityDateRange, setVisibilityDateRange] = useState('30d');
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | undefined>();
  
  // Fetch visibility data with React Query
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
  const { data: competitiveAnalysis, isLoading: competitiveLoading } = useCompetitiveAnalysis(
    selectedWebsiteId || '',
    visibilityDateRange,
    { enabled: isAuthenticated && !!selectedWebsiteId }
  );
  
  const { data: competitorsList } = useCompetitors(
    { websiteId: selectedWebsiteId },
    { enabled: isAuthenticated }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI 可見度追蹤</h1>
            <p className="text-muted-foreground">
              監控您的品牌在 AI 平台上的可見度表現
              {!isAuthenticated && <span className="ml-2 text-amber-600">• 需要登入查看完整報告</span>}
            </p>
          </div>
          <Button 
            className="bg-primary text-primary-foreground" 
            disabled={!isAuthenticated}
            onClick={isAuthenticated ? undefined : () => setShowAuthModal(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            追蹤設定
          </Button>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">追蹤設定</TabsTrigger>
            <TabsTrigger value="overview">可見度報告</TabsTrigger>
            <TabsTrigger value="analysis">競爭分析</TabsTrigger>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能設定AI追蹤</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可設定品牌關鍵字、競爭對手和追蹤頻率</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle>關鍵字追蹤設定</CardTitle>
                  <CardDescription>設定您要追蹤的品牌、產業關鍵字和競爭對手</CardDescription>
                </CardHeader>
              <CardContent className="space-y-6">
                {/* 品牌關鍵字 */}
                <div className="space-y-3">
                  <h4 className="font-medium">品牌關鍵字：</h4>
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
                      placeholder="新增品牌關鍵字"
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
                  <h4 className="font-medium">產業關鍵字：</h4>
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
                      placeholder="新增產業關鍵字"
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
                  <h4 className="font-medium">競爭對手：</h4>
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
                      placeholder="新增競爭對手 (URL)"
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
                    <h4 className="font-medium">追蹤頻率：</h4>
                    <Select 
                      defaultValue={trackingSettings?.trackingFrequency || "daily"}
                      onValueChange={(value) => updateTrackingSettings(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">每日</SelectItem>
                        <SelectItem value="weekly">每週</SelectItem>
                        <SelectItem value="hourly">每小時</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* AI 平台 */}
                  <div className="space-y-3">
                    <h4 className="font-medium">AI 平台：</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="chatgpt" 
                          checked={selectedPlatforms.chatgpt}
                          onCheckedChange={(checked) => 
                            setSelectedPlatforms({...selectedPlatforms, chatgpt: checked as boolean})
                          }
                        />
                        <label htmlFor="chatgpt" className="text-sm">ChatGPT</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="gemini" 
                          checked={selectedPlatforms.gemini}
                          onCheckedChange={(checked) => 
                            setSelectedPlatforms({...selectedPlatforms, gemini: checked as boolean})
                          }
                        />
                        <label htmlFor="gemini" className="text-sm">Gemini</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="perplexity" 
                          checked={selectedPlatforms.perplexity}
                          onCheckedChange={(checked) => 
                            setSelectedPlatforms({...selectedPlatforms, perplexity: checked as boolean})
                          }
                        />
                        <label htmlFor="perplexity" className="text-sm">Perplexity</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="claude" 
                          checked={selectedPlatforms.claude}
                          onCheckedChange={(checked) => 
                            setSelectedPlatforms({...selectedPlatforms, claude: checked as boolean})
                          }
                        />
                        <label htmlFor="claude" className="text-sm">Claude</label>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-primary text-primary-foreground">
                  <Eye className="mr-2 h-4 w-4" />
                  開始追蹤
                </Button>
              </CardContent>
            </Card>
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            {(loading || trendsLoading || statsLoading || platformLoading) ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">載入可見度數據中...</span>
              </div>
            ) : trendsError ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-lg font-medium text-red-500 mb-2">載入可見度數據失敗</div>
                  <p className="text-sm text-muted-foreground mb-4">請檢查網路連線或聯絡技術支援</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    重新載入
                  </Button>
                </div>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能查看可見度報告</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可查看品牌提及率、引用位置和情感分析報告</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Date Range Selector */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">時間範圍:</label>
                      <Select value={visibilityDateRange} onValueChange={setVisibilityDateRange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">過去 7 天</SelectItem>
                          <SelectItem value="30d">過去 30 天</SelectItem>
                          <SelectItem value="90d">過去 90 天</SelectItem>
                          <SelectItem value="12m">過去 12 月</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    匯出報告
                  </Button>
                </div>
                
                {/* 總覽指標 */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Card className="bg-gradient-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">品牌提及率</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {visibilityStats?.data.brandMentionRate?.value || 0}%
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
                      <CardTitle className="text-sm font-medium">引用位置</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        平均第 {visibilityStats?.data.averagePosition?.value || 0} 位
                      </div>
                      <div className={`flex items-center space-x-1 text-xs ${
                        (visibilityStats?.data.averagePosition?.change || 0) <= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(visibilityStats?.data.averagePosition?.change || 0) <= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {(visibilityStats?.data.averagePosition?.change || 0) <= 0 ? '提升' : '下降'} 
                          {Math.abs(visibilityStats?.data.averagePosition?.change || 0)} 位
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">情感分析</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {visibilityStats?.data.sentimentScore?.value || 0}% 正面
                      </div>
                      <div className={`flex items-center space-x-1 text-xs ${
                        (visibilityStats?.data.sentimentScore?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
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
                {visibilityTrends?.data.trends && (
                  <div className="mb-6">
                    <VisibilityTrendsChart 
                      data={visibilityTrends.data.trends}
                      title="可見度趨勢分析"
                      description="各 AI 平台的可見度變化趨勢"
                      chartType="line"
                    />
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
                      title="平台分佈分析"
                      description="各 AI 平台的提及率和表現分佈"
                    />
                  </div>
                )}

                {/* Platform Performance Details */}
                {platformPerformance?.data.platforms && (
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>平台細分表現</CardTitle>
                      <CardDescription>各 AI 平台的詳細表現數據</CardDescription>
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
                              <div className="text-xs text-muted-foreground mb-2">提及率</div>
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
              </>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {(loading || competitiveLoading) ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">載入競爭分析數據中...</span>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能查看競爭分析</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可分析您與競爭對手的表現比較和市場洞察</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
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
                        <CardTitle>競爭對手管理</CardTitle>
                        <CardDescription>新增、移除和管理您的競爭對手</CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        新增競爭對手
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                              {competitor.isActive ? "活躍" : "暫停"}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>尚未新增任何競爭對手</p>
                          <p className="text-sm">新增競爭對手以開始分析</p>
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
                    title="競爭對手表現比較"
                    description="您與競爭對手的 GEO 分數和各項指標對比"
                  />
                )}

                {/* Market Share Analysis */}
                {competitiveAnalysis?.data.analysis && (
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>市場份額分析</CardTitle>
                      <CardDescription>各品牌在 AI 平台上的市場佔有率</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {competitiveAnalysis.data.analysis.yourBrand.marketShare}%
                          </div>
                          <div className="text-sm font-medium mb-1">您的品牌</div>
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
                      <CardTitle>競爭洞察</CardTitle>
                      <CardDescription>基於數據分析的競爭情報和建議</CardDescription>
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
                                    {insight.impact === 'high' ? '高影響' : insight.impact === 'medium' ? '中影響' : '低影響'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                                {insight.competitor && (
                                  <p className="text-xs text-muted-foreground">相關競爭對手: {insight.competitor}</p>
                                )}
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-primary">建議行動:</p>
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
                      <CardTitle>差距分析</CardTitle>
                      <CardDescription>識別與競爭對手的差距和改善機會</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {competitiveAnalysis.data.gapAnalysis.map((gap, index) => (
                          <div key={index} className="p-4 bg-gradient-subtle rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium">{gap.category}</h5>
                              <div className="text-right">
                                <div className="text-sm">
                                  您: {gap.yourScore} vs 平均: {gap.competitorAverage}
                                </div>
                                <div className={`text-xs ${gap.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  差距: {gap.gap > 0 ? '+' : ''}{gap.gap}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <Progress value={gap.yourScore} className="h-2" />
                              <Progress value={gap.competitorAverage} className="h-2" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">改善建議:</p>
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