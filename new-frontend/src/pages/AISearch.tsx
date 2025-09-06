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
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { aiSearchService, Keyword, Competitor, TrackingSettings, PlatformSettings } from "@/lib/api/aiSearch";
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
      const [keywordsRes, competitorsRes, trackingRes, platformsRes] = await Promise.all([
        aiSearchService.getKeywords(),
        aiSearchService.getCompetitors(),
        aiSearchService.getTrackingSettings(),
        aiSearchService.getPlatformSettings()
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

  const trackingData = {
    brandMentionRate: { value: 23, change: 5, trend: "up" },
    averagePosition: { value: 3, change: -1, trend: "up" },
    sentimentScore: { value: 85, change: 2, trend: "up" },
    platforms: {
      chatgpt: { mentionRate: 18, change: 3, position: 2.8 },
      gemini: { mentionRate: 28, change: 7, position: 2.5 },
      perplexity: { mentionRate: 25, change: 1, position: 3.2 }
    },
    competition: {
      yourBrand: 23,
      competitorA: 31,
      competitorB: 19,
      others: 27
    }
  };

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
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
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
                {/* 總覽指標 */}
                <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-gradient-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">品牌提及率</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trackingData.brandMentionRate.value}%</div>
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>↑{trackingData.brandMentionRate.change}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">引用位置</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">平均第 {trackingData.averagePosition.value} 位</div>
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>較上期提升 {Math.abs(trackingData.averagePosition.change)} 位</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">情感分析</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trackingData.sentimentScore.value}% 正面</div>
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>↑{trackingData.sentimentScore.change}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 平台細分 */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>平台細分表現</CardTitle>
                <CardDescription>各 AI 平台的品牌提及情況</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-gradient-subtle rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Brain className="h-5 w-5 text-green-500" />
                          <h4 className="font-medium">ChatGPT</h4>
                        </div>
                        <Badge variant="secondary">#{trackingData.platforms.chatgpt.position}</Badge>
                      </div>
                      <div className="text-2xl font-bold mb-1">{trackingData.platforms.chatgpt.mentionRate}%</div>
                      <div className="text-xs text-muted-foreground mb-2">提及率</div>
                      <Progress value={trackingData.platforms.chatgpt.mentionRate} className="h-2" />
                      <div className="flex items-center space-x-1 text-xs text-green-600 mt-2">
                        <TrendingUp className="h-3 w-3" />
                        <span>↑{trackingData.platforms.chatgpt.change}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-subtle rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Star className="h-5 w-5 text-blue-500" />
                          <h4 className="font-medium">Gemini</h4>
                        </div>
                        <Badge variant="secondary">#{trackingData.platforms.gemini.position}</Badge>
                      </div>
                      <div className="text-2xl font-bold mb-1">{trackingData.platforms.gemini.mentionRate}%</div>
                      <div className="text-xs text-muted-foreground mb-2">提及率</div>
                      <Progress value={trackingData.platforms.gemini.mentionRate} className="h-2" />
                      <div className="flex items-center space-x-1 text-xs text-green-600 mt-2">
                        <TrendingUp className="h-3 w-3" />
                        <span>↑{trackingData.platforms.gemini.change}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-subtle rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-5 w-5 text-purple-500" />
                          <h4 className="font-medium">Perplexity</h4>
                        </div>
                        <Badge variant="secondary">#{trackingData.platforms.perplexity.position}</Badge>
                      </div>
                      <div className="text-2xl font-bold mb-1">{trackingData.platforms.perplexity.mentionRate}%</div>
                      <div className="text-xs text-muted-foreground mb-2">提及率</div>
                      <Progress value={trackingData.platforms.perplexity.mentionRate} className="h-2" />
                      <div className="flex items-center space-x-1 text-xs text-green-600 mt-2">
                        <TrendingUp className="h-3 w-3" />
                        <span>↑{trackingData.platforms.perplexity.change}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
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
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle>競爭分析</CardTitle>
                  <CardDescription>您與競爭對手在 AI 平台上的表現比較</CardDescription>
                </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border">
                      <div className="text-2xl font-bold text-primary mb-1">{trackingData.competition.yourBrand}%</div>
                      <div className="text-sm font-medium mb-1">您的品牌</div>
                      <Progress value={trackingData.competition.yourBrand} className="h-2" />
                    </div>

                    <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border">
                      <div className="text-2xl font-bold text-red-500 mb-1">{trackingData.competition.competitorA}%</div>
                      <div className="text-sm font-medium mb-1">Competitor A</div>
                      <Progress value={trackingData.competition.competitorA} className="h-2" />
                    </div>

                    <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border">
                      <div className="text-2xl font-bold text-orange-500 mb-1">{trackingData.competition.competitorB}%</div>
                      <div className="text-sm font-medium mb-1">Competitor B</div>
                      <Progress value={trackingData.competition.competitorB} className="h-2" />
                    </div>

                    <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border">
                      <div className="text-2xl font-bold text-gray-500 mb-1">{trackingData.competition.others}%</div>
                      <div className="text-sm font-medium mb-1">其他</div>
                      <Progress value={trackingData.competition.others} className="h-2" />
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-subtle rounded-lg border border-border">
                    <h4 className="font-medium mb-3">競爭洞察</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>您的品牌在 Gemini 平台表現最佳，提及率領先 Competitor B 9 個百分點</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <TrendingDown className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>在 ChatGPT 平台仍需加強，落後 Competitor A 13 個百分點</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>建議加強「專案管理」關鍵字的內容布局，提升整體市場份額</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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