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
  X
} from "lucide-react";
import { useState } from "react";

const AISearch = () => {
  const [brandKeywords, setBrandKeywords] = useState(["公司名稱", "產品名稱"]);
  const [industryKeywords, setIndustryKeywords] = useState(["CRM 軟體", "專案管理"]);
  const [competitors, setCompetitors] = useState(["Competitor A", "Competitor B"]);
  const [newKeyword, setNewKeyword] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    chatgpt: true,
    gemini: true,
    perplexity: true
  });

  const addKeyword = (type, value) => {
    if (!value.trim()) return;
    
    if (type === "brand") {
      setBrandKeywords([...brandKeywords, value]);
    } else if (type === "industry") {
      setIndustryKeywords([...industryKeywords, value]);
    } else if (type === "competitor") {
      setCompetitors([...competitors, value]);
    }
    setNewKeyword("");
  };

  const removeKeyword = (type, index) => {
    if (type === "brand") {
      setBrandKeywords(brandKeywords.filter((_, i) => i !== index));
    } else if (type === "industry") {
      setIndustryKeywords(industryKeywords.filter((_, i) => i !== index));
    } else if (type === "competitor") {
      setCompetitors(competitors.filter((_, i) => i !== index));
    }
  };

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
            <p className="text-muted-foreground">監控您的品牌在 AI 平台上的可見度表現</p>
          </div>
          <Button className="bg-primary text-primary-foreground">
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
                    {brandKeywords.map((keyword, index) => (
                      <Badge key={index} variant="default" className="flex items-center gap-2">
                        {keyword}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive"
                          onClick={() => removeKeyword("brand", index)}
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
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword("brand", newKeyword)}
                    />
                    <Button onClick={() => addKeyword("brand", newKeyword)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 產業關鍵字 */}
                <div className="space-y-3">
                  <h4 className="font-medium">產業關鍵字：</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {industryKeywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-2">
                        {keyword}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive"
                          onClick={() => removeKeyword("industry", index)}
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
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword("industry", newKeyword)}
                    />
                    <Button onClick={() => addKeyword("industry", newKeyword)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 競爭對手 */}
                <div className="space-y-3">
                  <h4 className="font-medium">競爭對手：</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {competitors.map((competitor, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-2">
                        {competitor}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive"
                          onClick={() => removeKeyword("competitor", index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="新增競爭對手"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword("competitor", newKeyword)}
                    />
                    <Button onClick={() => addKeyword("competitor", newKeyword)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                  {/* 追蹤頻率 */}
                  <div className="space-y-3">
                    <h4 className="font-medium">追蹤頻率：</h4>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">每日</SelectItem>
                        <SelectItem value="weekly">每週</SelectItem>
                        <SelectItem value="monthly">每月</SelectItem>
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
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-primary text-primary-foreground">
                  <Eye className="mr-2 h-4 w-4" />
                  開始追蹤
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AISearch;