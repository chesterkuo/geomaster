import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Filter,
  ArrowLeft,
  TrendingUp, 
  Plus,
  Search,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  User,
  Clock,
  Info,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { contentService, Page, PageCreateData } from "@/lib/api/content";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth/AuthModal";
import { useTranslation } from "react-i18next";

const Optimization = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // State management
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filters, setFilters] = useState({
    geoScore: "all",
    traffic: "all", 
    type: "all"
  });
  
  // Add page form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPageData, setNewPageData] = useState<PageCreateData>({
    title: "",
    url: "",
    type: "其他",
    traffic: "中"
  });
  const [isAddingPage, setIsAddingPage] = useState(false);

  // Load pages on component mount
  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setIsLoading(true);
      
      // Try to load pages even if auth status is uncertain
      const response = await contentService.getPages();
      if (response.success) {
        setPages(response.data);
        console.log('Pages loaded successfully:', response.data.length, 'pages');
      } else {
        console.error('API response failed:', response.message);
        toast.error(t("optimization.errors.loadPagesFailed") + ": " + response.message);
        
        // If auth error, show login prompt
        if (response.message?.includes('token') || response.message?.includes('unauthorized')) {
          setShowAuthModal(true);
        }
      }
    } catch (error: any) {
      console.error('Load pages error:', error);
      
      // Handle 401 auth error
      if (error.response?.status === 401) {
        console.log('401 error detected, need to re-login');
        toast.error(t("optimization.errors.loginExpired"));
        setShowAuthModal(true);
        return;
      }
      
      // Handle 403 permission error
      if (error.response?.status === 403) {
        toast.error(t("optimization.errors.insufficientPermissions"));
        return;
      }
      
      // Detailed error handling
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Authentication error, showing login dialog');
        setShowAuthModal(true);
        toast.error(t("optimization.errors.pleaseLoginToViewPages"));
      } else if (error.response?.data?.message) {
        toast.error(t("optimization.errors.loadPagesFailed") + ": " + error.response.data.message);
      } else {
        toast.error(t("optimization.errors.loadPagesFailed") + ": " + (error.message || t("common.networkError")));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPage = async () => {
    if (!newPageData.title.trim() || !newPageData.url.trim()) {
      toast.error(t("optimization.errors.fillTitleAndUrl"));
      return;
    }

    // URL validation
    try {
      new URL(newPageData.url);
    } catch {
      toast.error(t("optimization.errors.invalidUrl"));
      return;
    }

    try {
      setIsAddingPage(true);
      const response = await contentService.addPage(newPageData);
      if (response.success) {
        toast.success(t("optimization.success.pageAdded"));
        setPages(prev => [response.data, ...prev]);
        setShowAddDialog(false);
        setNewPageData({
          title: "",
          url: "",
          type: "其他",
          traffic: "中"
        });
      } else {
        toast.error(t("optimization.errors.addFailed") + ": " + response.message);
      }
    } catch (error: any) {
      console.error('Add page error:', error);
      
      // Handle specific error conditions
      if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
        toast.error(t("optimization.errors.urlAlreadyExists"));
        // Reload page list to show existing pages
        loadPages();
        setShowAddDialog(false);
      } else if (error.response?.data?.message) {
        toast.error(t("optimization.errors.addFailed") + ": " + error.response.data.message);
      } else {
        toast.error(t("optimization.errors.addFailed") + ": " + (error.message || t("common.unknownError")));
      }
    } finally {
      setIsAddingPage(false);
    }
  };

  const handleAnalyzePage = async (page: Page) => {
    try {
      setIsAnalyzing(true);
      
      // Immediately set page to analyzing state
      const analyzingPage: Page = {
        ...page,
        analysisStatus: 'analyzing'
      };
      
      setPages(prev => prev.map(p => p.id === page.id ? analyzingPage : p));
      if (selectedPage?.id === page.id) {
        setSelectedPage(analyzingPage);
      }
      
      toast.info(t("optimization.info.startingAnalysis", { title: page.title }));
      
      const response = await contentService.analyzePage(page.id);
      if (response.success) {
        const { geoScore, estimatedImprovement, issues, message } = response.data;
        
        // Update page state
        const updatedPage: Page = {
          ...page,
          geoScore,
          estimatedImprovement,
          issues,
          analysisStatus: 'completed',
          lastAnalyzedAt: new Date().toISOString()
        };

        // Update page list
        setPages(prev => prev.map(p => p.id === page.id ? updatedPage : p));
        
        // If currently viewing detail page, also update selected page
        if (selectedPage?.id === page.id) {
          setSelectedPage(updatedPage);
        }

        toast.success(t("optimization.success.analysisComplete", { title: page.title, score: geoScore }));
        
        // Show analysis result details
        if (issues && issues.length > 0) {
          setTimeout(() => {
            toast.info(t("optimization.info.issuesFound", { count: issues.length }));
          }, 2000);
        }
      } else {
        // Analysis failed, restore original state
        setPages(prev => prev.map(p => p.id === page.id ? page : p));
        if (selectedPage?.id === page.id) {
          setSelectedPage(page);
        }
        toast.error(t("optimization.errors.analysisFailed") + ": " + response.message);
      }
    } catch (error: any) {
      console.error('Analyze page error:', error);

      // Analysis failed, restore original state
      setPages(prev => prev.map(p => p.id === page.id ? page : p));
      if (selectedPage?.id === page.id) {
        setSelectedPage(page);
      }

      toast.error(t("optimization.errors.analysisFailed") + ": " + (error.message || t("common.unknownError")));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeletePage = async (pageId: string, title: string) => {
    if (!confirm(t("optimization.confirmDelete", { title }))) {
      return;
    }

    try {
      const response = await contentService.deletePage(pageId);
      if (response.success) {
        toast.success(t("optimization.success.pageDeleted"));
        setPages(prev => prev.filter(p => p.id !== pageId));
      } else {
        toast.error(t("optimization.errors.deleteFailed") + ": " + response.message);
      }
    } catch (error: any) {
      console.error('Delete page error:', error);
      toast.error(t("optimization.errors.deleteFailed") + ": " + (error.message || t("common.unknownError")));
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-500";
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score?: number) => {
    if (!score) return "bg-gray-100";
    if (score >= 70) return "bg-green-100";
    if (score >= 50) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getStatusIcon = (status: Page['analysisStatus']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'analyzing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Helper function to get traffic level translation key
  const getTrafficLevelKey = (traffic: string) => {
    const trafficMap: Record<string, string> = {
      '高': 'high',
      '中': 'medium',
      '低': 'low'
    };
    return trafficMap[traffic] || traffic;
  };

  const filteredPages = pages.filter(page => {
    if (filters.geoScore === "low" && (page.geoScore ?? 0) >= 60) return false;
    if (filters.traffic !== "all" && page.traffic !== filters.traffic) return false;
    if (filters.type !== "all" && page.type !== filters.type) return false;
    return true;
  });

  // Detailed page view
  if (selectedPage) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPage(null)}
                className="border-border"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("optimization.backToList")}
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("optimization.pageDetailAnalysis")}</h1>
                <p className="text-muted-foreground">{selectedPage.url}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedPage.geoScore && (
                <>
                  <Badge variant="secondary" className={getScoreBgColor(selectedPage.geoScore)}>
                    {t("optimization.currentGeo")}: {selectedPage.geoScore}
                  </Badge>
                  {selectedPage.estimatedImprovement && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {t("optimization.estimated")}: {selectedPage.estimatedImprovement}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Page Information Card */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  {t("optimization.pageInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t("optimization.pageTitle")}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedPage.title}</p>
                </div>
                <div>
                  <Label>URL</Label>
                  <p className="text-sm text-muted-foreground mt-1 break-all">{selectedPage.url}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <Label>{t("optimization.type")}</Label>
                    <Badge variant="outline" className="mt-1 block w-fit">
                      {selectedPage.type}
                    </Badge>
                  </div>
                  <div>
                    <Label>{t("optimization.trafficLevel")}</Label>
                    <Badge variant={selectedPage.traffic === "高" ? "default" : "secondary"} className="mt-1 block w-fit">
                      {t("optimization.trafficLevels." + getTrafficLevelKey(selectedPage.traffic))}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("optimization.analysisStatus")}</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(selectedPage.analysisStatus)}
                      <span className="text-sm capitalize">{selectedPage.analysisStatus}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleAnalyzePage(selectedPage)}
                    disabled={isAnalyzing}
                    size="sm"
                    className="bg-primary text-primary-foreground"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {t("optimization.reanalyze")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results Card */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-5 w-5 text-primary" />
                  {t("optimization.analysisResults")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPage.analysisStatus === 'completed' ? (
                  <div className="space-y-4">
                    {selectedPage.geoScore !== undefined ? (
                      <>
                        <div className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
                          <span className="font-medium">{t("optimization.geoScore")}</span>
                          <span className={`font-bold text-xl ${getScoreColor(selectedPage.geoScore)}`}>
                            {selectedPage.geoScore} / 100
                          </span>
                        </div>
                        
                        {selectedPage.estimatedImprovement && (
                          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <div>
                              <span className="text-sm font-medium text-green-800">
                                {t("optimization.optimizationPotential")}
                              </span>
                              <p className="text-sm text-green-600">
                                {t("optimization.canImproveToScore", { score: selectedPage.estimatedImprovement })}
                                <span className="font-medium">
                                  (+{selectedPage.estimatedImprovement - selectedPage.geoScore} {t("optimization.points")})
                                </span>
                              </p>
                            </div>
                          </div>
                        )}

                        {/* GEO Score Explanation */}
                        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <Info className="h-5 w-5 text-blue-600 mr-2" />
                            <Label className="text-sm font-medium text-blue-800">
                              {t("optimization.geoScoreExplanation")}
                            </Label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <h4 className="font-medium text-blue-800">{t("optimization.technicalSEO")} (30%)</h4>
                              <ul className="text-blue-700 space-y-1 pl-3">
                                <li>• {t("optimization.pageLoadSpeed")}</li>
                                <li>• {t("optimization.mobileCompatibility")}</li>
                                <li>• {t("optimization.htmlStructure")}</li>
                                <li>• {t("optimization.sslSecurity")}</li>
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-blue-800">{t("optimization.contentQuality")} (25%)</h4>
                              <ul className="text-blue-700 space-y-1 pl-3">
                                <li>• {t("optimization.titleTagOptimization")}</li>
                                <li>• {t("optimization.contentLengthAndDepth")}</li>
                                <li>• {t("optimization.keywordDistribution")}</li>
                                <li>• {t("optimization.contentOriginality")}</li>
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-blue-800">{t("optimization.userExperience")} (25%)</h4>
                              <ul className="text-blue-700 space-y-1 pl-3">
                                <li>• {t("optimization.navigationStructure")}</li>
                                <li>• {t("optimization.interactiveElements")}</li>
                                <li>• {t("optimization.contentReadability")}</li>
                                <li>• {t("optimization.accessibility")}</li>
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-blue-800">{t("optimization.searchOptimization")} (20%)</h4>
                              <ul className="text-blue-700 space-y-1 pl-3">
                                <li>• {t("optimization.metaDescriptionOptimization")}</li>
                                <li>• {t("optimization.internalLinkStrategy")}</li>
                                <li>• {t("optimization.imageAltTags")}</li>
                                <li>• {t("optimization.schemaMarkup")}</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Specific Optimization Suggestions */}
                        <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <HelpCircle className="h-5 w-5 text-purple-600 mr-2" />
                            <Label className="text-sm font-medium text-purple-800">
                              {t("optimization.optimizationSuggestionsForThisPage")}
                            </Label>
                          </div>
                          <div className="space-y-3">
                            {selectedPage.geoScore < 70 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-purple-800">{t("optimization.priorityItems")}:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {selectedPage.geoScore < 60 && (
                                    <div className="bg-red-100 border border-red-200 rounded p-3">
                                      <h5 className="font-medium text-red-800 mb-2">🚨 {t("optimization.highPriority")}</h5>
                                      <ul className="text-sm text-red-700 space-y-1">
                                        <li>• {t("optimization.checkPageLoadSpeed")}</li>
                                        <li>• {t("optimization.optimizeTitleTags")}</li>
                                        <li>• {t("optimization.ensureMobileCompatibility")}</li>
                                        <li>• {t("optimization.addOrOptimizeMetaDescription")}</li>
                                      </ul>
                                    </div>
                                  )}
                                  {selectedPage.geoScore >= 40 && (
                                    <div className="bg-yellow-100 border border-yellow-200 rounded p-3">
                                      <h5 className="font-medium text-yellow-800 mb-2">⚡ {t("optimization.mediumPriority")}</h5>
                                      <ul className="text-sm text-yellow-700 space-y-1">
                                        <li>• {t("optimization.increaseContentLength")}</li>
                                        <li>• {t("optimization.optimizeKeywordDensity")}</li>
                                        <li>• {t("optimization.addInternalLinks")}</li>
                                        <li>• {t("optimization.improveImageAltTags")}</li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                <div className="bg-green-100 border border-green-200 rounded p-3">
                                  <h5 className="font-medium text-green-800 mb-2">📈 {t("optimization.advancedOptimization")}</h5>
                                  <ul className="text-sm text-green-700 space-y-1">
                                    <li>• {t("optimization.implementSchemaMarkup")}</li>
                                    <li>• {t("optimization.optimizeCoreWebVitals")}</li>
                                    <li>• {t("optimization.buildContentClusters")}</li>
                                    <li>• {t("optimization.enhanceUserInteraction")}</li>
                                  </ul>
                                </div>
                              </div>
                            )}
                            {selectedPage.geoScore >= 70 && (
                              <div className="bg-green-100 border border-green-200 rounded p-3">
                                <h5 className="font-medium text-green-800 mb-2">🎯 {t("optimization.maintainAdvantage")}</h5>
                                <ul className="text-sm text-green-700 space-y-1">
                                  <li>• {t("optimization.regularlyUpdateContent")}</li>
                                  <li>• {t("optimization.monitorLoadSpeedChanges")}</li>
                                  <li>• {t("optimization.expandRelatedContent")}</li>
                                  <li>• {t("optimization.optimizeInternalLinkNetwork")}</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <p className="text-sm text-muted-foreground">{t("optimization.analysisCompleteNoScore")}</p>
                      </div>
                    )}

                    {selectedPage.issues && selectedPage.issues.length > 0 ? (
                      <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                          <Label className="text-sm font-medium text-amber-800">
                            {t("optimization.issuesFoundCount", { count: selectedPage.issues.length })}
                          </Label>
                        </div>
                        <ul className="space-y-2">
                          {selectedPage.issues.map((issue, index) => (
                            <li key={index} className="text-sm text-amber-700 flex items-start">
                              <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : selectedPage.geoScore !== undefined ? (
                      // Show different messages based on score
                      selectedPage.geoScore >= 70 ? (
                        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-green-800">
                              {t("optimization.excellentPerformance")}
                            </span>
                          </div>
                        </div>
                      ) : selectedPage.geoScore >= 50 ? (
                        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                            <span className="text-sm font-medium text-yellow-800">
                              {t("optimization.averagePerformance")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-600 mr-2" />
                            <span className="text-sm font-medium text-red-800">
                              {t("optimization.needsImprovement")}
                            </span>
                          </div>
                        </div>
                      )
                    ) : null}

                    {selectedPage.lastAnalyzedAt && (
                      <div className="border-t pt-3">
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {t("optimization.lastAnalyzedAt")}: {new Date(selectedPage.lastAnalyzedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : selectedPage.analysisStatus === 'analyzing' ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">{t("optimization.analyzing")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-muted-foreground">{t("optimization.notAnalyzedYet")}</p>
                      <Button 
                        onClick={() => handleAnalyzePage(selectedPage)}
                        disabled={isAnalyzing}
                        size="sm"
                        className="mt-2"
                      >
                        {t("optimization.startAnalysis")}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Main list view
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Action Area */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("optimization.title")}</h1>
            <p className="text-muted-foreground">{t("optimization.description")}</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                {t("optimization.addPageAnalysis")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("optimization.addPageAnalysis")}</DialogTitle>
                <DialogDescription>
                  {t("optimization.addPageDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">{t("optimization.pageTitle")}</Label>
                  <Input
                    id="title"
                    placeholder={t("optimization.pageTitlePlaceholder")}
                    value={newPageData.title}
                    onChange={(e) => setNewPageData({ ...newPageData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="url">{t("optimization.pageUrl")}</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/page"
                    value={newPageData.url}
                    onChange={(e) => setNewPageData({ ...newPageData, url: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("optimization.pageType")}</Label>
                    <Select value={newPageData.type} onValueChange={(value: any) => setNewPageData({ ...newPageData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="產品頁">{t("optimization.pageTypes.product")}</SelectItem>
                        <SelectItem value="部落格">{t("optimization.pageTypes.blog")}</SelectItem>
                        <SelectItem value="FAQ">{t("optimization.pageTypes.faq")}</SelectItem>
                        <SelectItem value="服務頁">{t("optimization.pageTypes.service")}</SelectItem>
                        <SelectItem value="其他">{t("optimization.pageTypes.other")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("optimization.trafficLevel")}</Label>
                    <Select value={newPageData.traffic} onValueChange={(value: any) => setNewPageData({ ...newPageData, traffic: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="高">{t("optimization.trafficLevels.high")}</SelectItem>
                        <SelectItem value="中">{t("optimization.trafficLevels.medium")}</SelectItem>
                        <SelectItem value="低">{t("optimization.trafficLevels.low")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleAddPage} disabled={isAddingPage}>
                    {isAddingPage ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {t("optimization.addPage")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              {t("optimization.filterConditions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("optimization.geoScore")}</Label>
                <Select value={filters.geoScore} onValueChange={(value) => setFilters({...filters, geoScore: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("optimization.selectScoreRange")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("optimization.allScores")}</SelectItem>
                    <SelectItem value="low">{t("optimization.below60")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("optimization.trafficLevel")}</Label>
                <Select value={filters.traffic} onValueChange={(value) => setFilters({...filters, traffic: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("optimization.selectTrafficLevel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("optimization.allTraffic")}</SelectItem>
                    <SelectItem value="高">{t("optimization.highTrafficPriority")}</SelectItem>
                    <SelectItem value="中">{t("optimization.trafficLevels.medium")}</SelectItem>
                    <SelectItem value="低">{t("optimization.trafficLevels.low")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("optimization.pageType")}</Label>
                <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("optimization.selectPageType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("optimization.allTypes")}</SelectItem>
                    <SelectItem value="產品頁">{t("optimization.pageTypes.product")}</SelectItem>
                    <SelectItem value="部落格">{t("optimization.pageTypes.blog")}</SelectItem>
                    <SelectItem value="FAQ">{t("optimization.pageTypes.faq")}</SelectItem>
                    <SelectItem value="服務頁">{t("optimization.pageTypes.service")}</SelectItem>
                    <SelectItem value="其他">{t("optimization.pageTypes.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Page List */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("optimization.contentPageList")}</CardTitle>
                <CardDescription>
                  {isLoading ? t("common.loading") : t("optimization.pagesFoundCount", { count: filteredPages.length })}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={loadPages} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t("common.reload")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">{t("optimization.loadingPages")}</p>
                </div>
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  {!isAuthenticated ? (
                    <>
                      <div className="relative mb-6">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <p className="text-lg font-medium text-muted-foreground mb-2">{t("optimization.loginRequiredForOptimizationReport")}</p>
                      <p className="text-sm text-muted-foreground mb-6">{t("optimization.loginToAddPagesAndAnalyze")}</p>
                      <div className="space-y-3">
                        <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                          <User className="mr-2 h-4 w-4" />
                          {t("auth.loginNow")}
                        </Button>
                        <p className="text-xs text-muted-foreground">{t("auth.noAccountSignupPrompt")}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">{t("optimization.noPages")}</p>
                      <p className="text-sm text-muted-foreground mb-4">{t("optimization.startAddingPagesForAnalysis")}</p>
                      <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("optimization.addFirstPage")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPages.map((page) => (
                  <div 
                    key={page.id} 
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-gradient-subtle hover:bg-gradient-subtle/80 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-medium">{page.title}</h3>
                          <Badge variant="outline" className="text-xs">{page.type}</Badge>
                          <Badge variant={page.traffic === "高" ? "default" : "secondary"} className="text-xs">
                            {t("optimization.trafficLevels." + getTrafficLevelKey(page.traffic))}
                          </Badge>
                          {getStatusIcon(page.analysisStatus)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 break-all">{page.url}</p>
                        <div className="flex items-center space-x-4">
                          {page.geoScore ? (
                            <>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">{t("optimization.geo")}:</span>
                                <span className={`font-bold ${getScoreColor(page.geoScore)}`}>{page.geoScore} {t("optimization.points")}</span>
                              </div>
                              {page.estimatedImprovement && (
                                <div className="flex items-center space-x-2">
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                  <span className="text-sm text-green-600">{t("optimization.canImproveToScore", { score: page.estimatedImprovement })}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">{t("optimization.notAnalyzed")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        onClick={() => handleAnalyzePage(page)}
                        disabled={isAnalyzing || page.analysisStatus === 'analyzing'}
                        size="sm"
                        variant="outline"
                        className="border-border"
                      >
                        {page.analysisStatus === 'analyzing' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        {t("optimization.analyze")}
                      </Button>
                      <Button 
                        onClick={() => setSelectedPage(page)}
                        size="sm"
                        className="bg-primary text-primary-foreground shadow-glow"
                      >
                        {t("optimization.viewDetails")}
                      </Button>
                      <Button 
                        onClick={() => handleDeletePage(page.id, page.title)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        {t("common.delete")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          loadPages(); // Reload data after login
        }}
      />
    </DashboardLayout>
  );
};

export default Optimization;