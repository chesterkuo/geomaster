import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, Target, Globe, BarChart3, Lock, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth/AuthModal";

const Research = () => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const keywordSuggestions = [
    { keyword: "SEO優化", volume: "12,100", difficulty: "中等", trend: "+15%" },
    { keyword: "關鍵字研究", volume: "8,900", difficulty: "低", trend: "+8%" },
    { keyword: "內容行銷", volume: "15,600", difficulty: "高", trend: "+22%" },
    { keyword: "數位行銷", volume: "9,800", difficulty: "中等", trend: "+12%" },
  ];

  const competitors = [
    { domain: "competitor1.com", keywords: 1250, traffic: "125K", ranking: "#3" },
    { domain: "competitor2.com", keywords: 980, traffic: "98K", ranking: "#5" },
    { domain: "competitor3.com", keywords: 1580, traffic: "158K", ranking: "#2" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">關鍵字研究</h1>
          <p className="text-muted-foreground">發現高價值關鍵字，提升SEO排名</p>
        </div>

        <Tabs defaultValue="research" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="research">關鍵字搜尋</TabsTrigger>
            <TabsTrigger value="analysis">競爭分析</TabsTrigger>
            <TabsTrigger value="tracking">排名追蹤</TabsTrigger>
            <TabsTrigger value="opportunities">機會發現</TabsTrigger>
          </TabsList>

          <TabsContent value="research" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能使用關鍵字搜尋</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可搜尋高價值關鍵字，提升SEO排名</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    關鍵字搜尋工具
                  </CardTitle>
                  <CardDescription>輸入種子關鍵字，獲取相關建議</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="輸入關鍵字..." className="flex-1" />
                    <Button>
                      <Search className="h-4 w-4 mr-2" />
                      搜尋
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">關鍵字建議</h4>
                    {keywordSuggestions.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{item.keyword}</div>
                          <div className="text-sm text-muted-foreground">月搜尋量: {item.volume}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.difficulty === "低" ? "default" : item.difficulty === "中等" ? "secondary" : "destructive"}>
                            {item.difficulty}
                          </Badge>
                          <div className="text-sm text-green-500">{item.trend}</div>
                          <Button size="sm" variant="outline">加入</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能使用競爭分析</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可分析競爭對手的關鍵字策略</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    競爭對手分析
                  </CardTitle>
                  <CardDescription>分析競爭對手的關鍵字策略</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competitors.map((competitor, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Globe className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{competitor.domain}</div>
                            <div className="text-sm text-muted-foreground">關鍵字數量: {competitor.keywords}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="font-medium">{competitor.traffic}</div>
                            <div className="text-xs text-muted-foreground">月流量</div>
                          </div>
                          <Badge variant="outline">{competitor.ranking}</Badge>
                          <Button size="sm">分析</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能使用排名追蹤</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可監控關鍵字在搜尋引擎中的排名變化</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    排名追蹤
                  </CardTitle>
                  <CardDescription>監控關鍵字排名變化</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">開始追蹤關鍵字排名</h3>
                    <p className="text-muted-foreground mb-4">添加關鍵字以監控其在搜尋引擎中的排名變化</p>
                    <Button>新增追蹤</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能使用機會發現</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可基於數據分析發現潛在的SEO優化機會</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    機會發現
                  </CardTitle>
                  <CardDescription>發現SEO優化機會</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">探索新機會</h3>
                    <p className="text-muted-foreground mb-4">基於數據分析發現潛在的SEO優化機會</p>
                    <Button>開始分析</Button>
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
      />
    </DashboardLayout>
  );
};

export default Research;