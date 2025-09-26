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
import { useTranslation } from "react-i18next";

const Research = () => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const keywordSuggestions = [
    { keyword: t("research.keywords.seoOptimization"), volume: "12,100", difficulty: t("research.difficulty.medium"), trend: "+15%" },
    { keyword: t("research.keywords.keywordResearch"), volume: "8,900", difficulty: t("research.difficulty.low"), trend: "+8%" },
    { keyword: t("research.keywords.contentMarketing"), volume: "15,600", difficulty: t("research.difficulty.high"), trend: "+22%" },
    { keyword: t("research.keywords.digitalMarketing"), volume: "9,800", difficulty: t("research.difficulty.medium"), trend: "+12%" },
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
          <h1 className="text-3xl font-bold text-foreground">{t("research.title")}</h1>
          <p className="text-muted-foreground">{t("research.description")}</p>
        </div>

        <Tabs defaultValue="research" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="research">{t("research.tabs.keywordSearch")}</TabsTrigger>
            <TabsTrigger value="analysis">{t("research.tabs.competitorAnalysis")}</TabsTrigger>
            <TabsTrigger value="tracking">{t("research.tabs.rankingTracking")}</TabsTrigger>
            <TabsTrigger value="opportunities">{t("research.tabs.opportunityDiscovery")}</TabsTrigger>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t("research.auth.keywordSearchRequired")}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t("research.auth.keywordSearchDescription")}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t("common.loginNow")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    {t("research.keywordTool.title")}
                  </CardTitle>
                  <CardDescription>{t("research.keywordTool.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder={t("research.keywordTool.placeholder")} className="flex-1" />
                    <Button>
                      <Search className="h-4 w-4 mr-2" />
                      {t("common.search")}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">{t("research.keywordTool.suggestions")}</h4>
                    {keywordSuggestions.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{item.keyword}</div>
                          <div className="text-sm text-muted-foreground">{t("research.keywordTool.monthlyVolume")}: {item.volume}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.difficulty === "低" ? "default" : item.difficulty === "中等" ? "secondary" : "destructive"}>
                            {item.difficulty}
                          </Badge>
                          <div className="text-sm text-green-500">{item.trend}</div>
                          <Button size="sm" variant="outline">{t("common.add")}</Button>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t("research.auth.competitorAnalysisRequired")}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t("research.auth.competitorAnalysisDescription")}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t("common.loginNow")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {t("research.competitorAnalysis.title")}
                  </CardTitle>
                  <CardDescription>{t("research.competitorAnalysis.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competitors.map((competitor, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Globe className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{competitor.domain}</div>
                            <div className="text-sm text-muted-foreground">{t("research.competitorAnalysis.keywordCount")}: {competitor.keywords}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="font-medium">{competitor.traffic}</div>
                            <div className="text-xs text-muted-foreground">{t("research.competitorAnalysis.monthlyTraffic")}</div>
                          </div>
                          <Badge variant="outline">{competitor.ranking}</Badge>
                          <Button size="sm">{t("common.analyze")}</Button>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t("research.auth.rankingTrackingRequired")}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t("research.auth.rankingTrackingDescription")}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t("common.loginNow")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t("research.rankingTracking.title")}
                  </CardTitle>
                  <CardDescription>{t("research.rankingTracking.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t("research.rankingTracking.startTitle")}</h3>
                    <p className="text-muted-foreground mb-4">{t("research.rankingTracking.startDescription")}</p>
                    <Button>{t("research.rankingTracking.addTracking")}</Button>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t("research.auth.opportunityDiscoveryRequired")}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t("research.auth.opportunityDiscoveryDescription")}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t("common.loginNow")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {t("research.opportunityDiscovery.title")}
                  </CardTitle>
                  <CardDescription>{t("research.opportunityDiscovery.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t("research.opportunityDiscovery.exploreTitle")}</h3>
                    <p className="text-muted-foreground mb-4">{t("research.opportunityDiscovery.exploreDescription")}</p>
                    <Button>{t("research.opportunityDiscovery.startAnalysis")}</Button>
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