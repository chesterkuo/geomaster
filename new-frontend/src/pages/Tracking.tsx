import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Scan, CheckCircle, AlertTriangle, X, TrendingUp, Users, Target, Search, AlertCircle, Loader2, Lock, Star, ArrowRight, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { scanService, type Scan as ScanType, type ScanResults, type BasicScanResults, type DetailedScanResults } from "@/lib/api/scans";
import { contentService, type OptimizationRequest } from "@/lib/api/content";
import { authService } from "@/lib/api/auth";
import { useToast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/use-auth";
import OptimizationResults from "@/components/OptimizationResults";
import { useTranslation } from "react-i18next";

// Web 性能指標完整說明映射 - 使用 i18n 翻譯
const getPerformanceMetrics = (t: any) => ({
  LCP: t('diagnosis.performanceMetrics.LCP'),
  FCP: t('diagnosis.performanceMetrics.FCP'),
  CLS: t('diagnosis.performanceMetrics.CLS'),
  FID: t('diagnosis.performanceMetrics.FID'),
  TTI: t('diagnosis.performanceMetrics.TTI'),
  TTFB: t('diagnosis.performanceMetrics.TTFB')
});

// 擴展性能指標顯示文本的工具函數
const expandPerformanceMetrics = (text: string, t: any): string => {
  let expandedText = text;
  const PERFORMANCE_METRICS = getPerformanceMetrics(t);

  // 替換常見的性能指標縮寫
  Object.entries(PERFORMANCE_METRICS).forEach(([abbr, fullName]) => {
    // 匹配模式：縮寫後跟冒號和數值 (如: "LCP: 3.5s")
    const regex = new RegExp(`\\b${abbr}:\\s*([0-9.]+[a-z]*|[0-9.]+)`, 'gi');
    expandedText = expandedText.replace(regex, `${fullName} (${abbr}): $1`);

    // 也處理只有縮寫的情況 (如: "LCP 3.5s")
    const regexSpace = new RegExp(`\\b${abbr}\\s+([0-9.]+[a-z]*|[0-9.]+)`, 'gi');
    expandedText = expandedText.replace(regexSpace, `${fullName} (${abbr}) $1`);
  });

  return expandedText;
};

// 類型守衛
function isBasicScanResults(results: ScanResults): results is BasicScanResults {
  // 基礎結果只有 summary 但沒有 technicalHealth
  return 'summary' in results && !('technicalHealth' in results);
}

function isDetailedScanResults(results: ScanResults): results is DetailedScanResults {
  // 詳細結果有 technicalHealth
  return 'technicalHealth' in results;
}


const Tracking = () => {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScan, setCurrentScan] = useState<ScanType | null>(null);
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanType, setScanType] = useState<'basic' | 'detailed'>('basic');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showScanHistory, setShowScanHistory] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanType[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [showOptimizationResults, setShowOptimizationResults] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user, isLoading, checkAuthStatus } = useAuth();

  // 載入掃描歷史記錄
  const loadScanHistory = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await scanService.getList({ 
        page: 1, 
        limit: 10 
      });
      
      if (response.success && response.data) {
        setScanHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 當用戶認證狀態改變時載入掃描歷史
  useEffect(() => {
    if (isAuthenticated) {
      loadScanHistory();
    } else {
      setScanHistory([]);
    }
  }, [isAuthenticated]);

  // 處理優化建議
  const handleOptimization = async (websiteUrl?: string) => {
    // 檢查認證狀態 - 如果正在載入或未認證則阻止請求
    if (isLoading || !isAuthenticated) {
      toast({
        title: t("tracking.needLogin"),
        description: t("tracking.pleaseLoginToUseOptimization"),
        variant: "destructive",
      });
      setShowAuthModal(true);
      return;
    }

    // 優先使用參數傳入的URL，否則使用當前掃描的URL，最後使用頁面輸入的URL
    const optimizationUrl = websiteUrl || (currentScan?.website?.url) || url;
    
    // Debug logging to understand URL selection
    console.log('🎯 Optimization URL Selection:', {
      websiteUrl,
      currentScanUrl: currentScan?.website?.url,
      currentScanId: currentScan?.id,
      inputUrl: url,
      finalUrl: optimizationUrl
    });
    
    if (!optimizationUrl) {
      toast({
        title: t("tracking.needWebsiteUrl"),
        description: currentScan ?
          t("tracking.scanLacksUrlInfo") :
          t("tracking.performScanFirst"),
        variant: "destructive",
      });
      return;
    }

    // 驗證 URL 格式
    try {
      new URL(optimizationUrl);
    } catch (error) {
      toast({
        title: t("tracking.urlFormatError"),
        description: `${t("tracking.enterValidUrl")}\n${t("tracking.currentInput", { url: optimizationUrl })}`,
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: t("tracking.startOptimizationAnalysis"),
        description: t("tracking.analyzingWebsite"),
      });

      // 準備優化請求數據（符合後端API格式）
      const optimizationRequest = {
        url: optimizationUrl,
        content: '' // 可選的內容字段
      };
      
      // Debug: log the exact request being sent
      console.log('📤 Sending optimization request:', {
        requestData: optimizationRequest,
        urlLength: optimizationRequest.url.length,
        isValidUrl: (() => {
          try { new URL(optimizationRequest.url); return true; }
          catch { return false; }
        })()
      });

      const response = await contentService.getOptimizationSuggestions(optimizationRequest);

      if (response.success && response.data) {
        // 設置優化結果並顯示結果組件
        setOptimizationResults(response.data);
        setShowOptimizationResults(true);
        
        toast({
          title: t("tracking.optimizationAnalysisComplete"),
          description: t("tracking.foundOptimizationSuggestions", { count: response.data.suggestions.length, score: response.data.geoScore }),
        });

        console.log('Optimization analysis completed:', response.data);
      } else {
        throw new Error(response.message || 'Optimization analysis failed');
      }
    } catch (error: any) {
      console.error('Optimization analysis error:', error);
      toast({
        title: t("tracking.optimizationAnalysisFailed"),
        description: error.response?.data?.message || error.message || t("common.retry"),
        variant: "destructive",
      });
    }
  };

  // 處理掃描
  const handleScan = async (requestedScanType: 'basic' | 'detailed' = 'basic', targetUrl?: string) => {
    const scanUrl = targetUrl || url;
    if (!scanUrl) {
      toast({
        title: t("common.error"),
        description: t("tracking.enterWebsiteUrlPrompt"),
        variant: "destructive",
      });
      return;
    }

    // 驗證 URL 格式
    try {
      new URL(scanUrl);
    } catch {
      toast({
        title: t("common.error"),
        description: t("tracking.enterValidWebsiteUrl"),
        variant: "destructive",
      });
      return;
    }

    // 檢查權限
    if (requestedScanType === 'detailed' && !isAuthenticated) {
      toast({
        title: t("tracking.needRegistration"),
        description: t("tracking.deepAnalysisRequiresRegistration"),
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setError(null);
    setShowResults(false);
    setScanResults(null);
    setScanType(requestedScanType);

    try {
      let response;

      // 根據用戶認證狀態選擇API端點
      if (isAuthenticated) {
        // 已登入用戶 - 使用認證掃描端點，獲得完整詳細結果
        response = await scanService.startWebsiteScan(scanUrl, 'standard');
      } else {
        // 未登入用戶 - 使用匿名掃描，僅獲得基本結果
        response = await scanService.startAnonymousScan(scanUrl);
      }

      if (!response.success) {
        throw new Error(response.message || 'Failed to start scan');
      }

      const scan = response.data;
      setCurrentScan(scan);

      // 模擬掃描進度（真實情況下會從後端獲取）
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 90) {
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 1000);

      // 輪詢掃描狀態
      const pollInterval = setInterval(async () => {
        try {
          // 根據掃描類型選擇對應的狀態查詢方法
          const statusResponse = isAuthenticated
            ? await scanService.getStatus(scan.id)
            : await scanService.getAnonymousStatus(scan.id);
          const updatedScan = statusResponse.data;
          
          setCurrentScan(updatedScan);
          
          // 更新進度
          if (updatedScan.progress) {
            setScanProgress(updatedScan.progress);
          }

          // 掃描完成
          if (updatedScan.status === 'completed') {
            clearInterval(pollInterval);
            clearInterval(progressInterval);
            setIsScanning(false);
            setScanProgress(100);
            
            if (updatedScan.results) {
              setScanResults(updatedScan.results);
              setShowResults(true);
              
              // 刷新掃描歷史（如果用戶已認證）
              if (isAuthenticated) {
                loadScanHistory();
              }
              
              setTimeout(() => {
                toast({
                  title: t("tracking.scanComplete"),
                  description: isAuthenticated
                    ? "Complete AI visibility analysis report generated!"
                    : "Free AI visibility diagnosis completed! Register to get full analysis report.",
                });
              }, 0);
            } else {
              // 獲取詳細報告
              try {
                const reportResponse = await scanService.getReport(scan.id);
                if (reportResponse.data.detailedResults) {
                  setScanResults(reportResponse.data.detailedResults);
                  setShowResults(true);
                }
              } catch (reportError) {
                console.error('Failed to get report:', reportError);
              }
            }
          }

          // 掃描失敗
          if (updatedScan.status === 'failed') {
            clearInterval(pollInterval);
            clearInterval(progressInterval);
            setIsScanning(false);
            setError(updatedScan.error || 'Error occurred during scanning');
            
            setTimeout(() => {
              toast({
                title: t("tracking.scanFailed"),
                description: updatedScan.error || 'Error occurred during scanning',
                variant: "destructive",
              });
            }, 0);
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
        }
      }, 3000);

      // 60 秒後停止輪詢
      setTimeout(() => {
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        if (isScanning) {
          setIsScanning(false);
          setError('Scan timeout, please try again later');
        }
      }, 60000);

    } catch (err: any) {
      console.error('Scan error:', err);
      setIsScanning(false);

      // Handle different types of errors
      let errorMessage = 'Scan failed, please try again later';
      let errorTitle = t("common.error");

      if (err.response) {
        // API returned an error response
        const status = err.response.status;
        const data = err.response.data;

        if (status === 401) {
          errorTitle = t("tracking.authenticationRequired");
          errorMessage = t("tracking.pleaseLoginToStartScan");
        } else if (status === 403) {
          errorTitle = t("tracking.accessDenied");
          errorMessage = t("tracking.noPermissionForScanType");
        } else if (status === 429) {
          errorTitle = t("tracking.rateLimitExceeded");
          errorMessage = t("tracking.tooManyRequests");
        } else if (status >= 500) {
          errorTitle = t("tracking.serverError");
          errorMessage = t("tracking.serverTemporarilyUnavailable");
        } else {
          errorMessage = data?.message || err.message || errorMessage;
        }
      } else if (err.request) {
        // Network error - no response received
        errorTitle = t("tracking.connectionError");
        errorMessage = t("tracking.unableToConnectToServer");
      } else {
        // Other error
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);

      setTimeout(() => {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      }, 0);
    }
  };

  // 渲染基礎掃描結果
  const renderBasicResults = (results: BasicScanResults) => (
    <div className="space-y-6">
      {/* AI 可見度分數 */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{t("dashboard.aiVisibilityScore")}</CardTitle>
              <CardDescription>{t("tracking.freeDiagnosis")} {t("common.success")}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{results.score}</div>
              <div className="text-sm text-muted-foreground">/ 100</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 診斷摘要 */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            {results.summary.status === "good" && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
            {results.summary.status === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />}
            {results.summary.status === "critical" && <X className="h-5 w-5 text-red-500 mr-2" />}
            {t("optimization.results.tabs.suggestions")} {t("common.summary", "Summary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{results.summary.message}</p>
          <div className="space-y-2">
            <h4 className="font-medium">{t("analytics.keyFindings", "Key Findings:")} </h4>
            <ul className="space-y-1">
              {results.summary.keyIssues.map((issue, index) => (
                <li key={index} className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{expandPerformanceMetrics(issue, t)}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 分數預覽 */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>{t("analytics.analysisPreview", "Analysis Preview")}</CardTitle>
          <CardDescription>{t("auth.registerToViewDetails", "Register to view detailed analysis")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
              <div className="flex items-center">
                <Globe className="h-4 w-4 text-blue-500 mr-3" />
                <span className="font-medium">{t("tracking.technicalHealth")}</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-blue-600">{results.preview.technicalHealth}/100</span>
                <Lock className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
              <div className="flex items-center">
                <Target className="h-4 w-4 text-green-500 mr-3" />
                <span className="font-medium">{t("tracking.contentQuality")}</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-green-600">{results.preview.contentQuality}/100</span>
                <Lock className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
              <div className="flex items-center">
                <Search className="h-4 w-4 text-purple-500 mr-3" />
                <span className="font-medium">{t("tracking.aiVisibility")}</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-purple-600">{results.preview.aiVisibility}/100</span>
                <Lock className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 註冊呼籲 */}
      <Card className="bg-gradient-to-br from-primary/20 to-blue-600/20 border-primary/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">{t("tracking.unlockFullAnalysis")}</h3>
            <p className="text-muted-foreground">
              {t("tracking.registerToGetDeepAnalysis")}
            </p>
            <div className="space-y-2">
              {results.upgradeReasons.map((reason, index) => (
                <div key={index} className="flex items-center justify-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  {reason}
                </div>
              ))}
            </div>
            <div className="flex gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground"
                onClick={() => setShowAuthModal(true)}
              >
                <Zap className="mr-2 h-4 w-4" />
                {t("tracking.freeRegisterUnlock")}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-border"
                onClick={() => {
                  setShowResults(false);
                  setScanResults(null);
                  setCurrentScan(null);
                  setUrl("");
                  setScanProgress(0);
                }}
              >
                {t("tracking.rescanWebsite")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能預覽 */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>{t("tracking.deepAnalysisFeatures")}</CardTitle>
          <CardDescription>{t("tracking.completeGeoOptimization")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border border-border rounded-lg bg-gradient-subtle opacity-60 relative">
              <Globe className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium mb-1">{t("tracking.technicalArchitectureAnalysis")}</h4>
              <p className="text-sm text-muted-foreground">{t("tracking.websiteTechnicalStructureDetection")}</p>
              <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-4 border border-border rounded-lg bg-gradient-subtle opacity-60 relative">
              <Target className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium mb-1">{t("tracking.contentQualityAssessment")}</h4>
              <p className="text-sm text-muted-foreground">{t("tracking.aiFriendlyContentAnalysis")}</p>
              <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-4 border border-border rounded-lg bg-gradient-subtle opacity-60 relative">
              <Search className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium mb-1">{t("tracking.aiPlatformVisibilityDetection")}</h4>
              <p className="text-sm text-muted-foreground">{t("tracking.multiPlatformAiSearchPerformance")}</p>
              <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-4 border border-border rounded-lg bg-gradient-subtle opacity-60 relative">
              <Users className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium mb-1">{t("tracking.competitorBenchmarkAnalysis")}</h4>
              <p className="text-sm text-muted-foreground">{t("tracking.detailedCompetitiveAnalysis")}</p>
              <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-4 border border-border rounded-lg bg-gradient-subtle opacity-60 relative">
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium mb-1">{t("tracking.optimizationOpportunityIdentification")}</h4>
              <p className="text-sm text-muted-foreground">{t("tracking.specificImprovementSuggestions")}</p>
              <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 渲染詳細掃描結果
  const renderDetailedResults = (results: DetailedScanResults) => (
    <div className="space-y-6">
      {/* AI 可見度分數 */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{t("dashboard.aiVisibilityScore")}</CardTitle>
              <CardDescription>{t("tracking.basedOnGeoIndicators")}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{results.score}</div>
              <div className="text-sm text-muted-foreground">/ 100</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {/* 詳細分析報告 - 全寬度佈局 */}
        <div className="space-y-6">
          {/* 技術健康度 */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t("tracking.technicalHealth")}
                <Badge variant="secondary">{results.technicalHealth.weight}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.technicalHealth.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
                    <div className="flex items-center min-w-0 flex-1">
                      {item.status === "good" && <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />}
                      {item.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500 mr-3 flex-shrink-0" />}
                      {item.status === "critical" && <X className="h-4 w-4 text-red-500 mr-3 flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{expandPerformanceMetrics(item.detail, t)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 內容品質 */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t("tracking.contentQuality")}
                <Badge variant="secondary">{results.contentQuality.weight}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.contentQuality.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
                    <div className="flex items-center min-w-0 flex-1">
                      {item.status === "good" && <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />}
                      {item.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500 mr-3 flex-shrink-0" />}
                      {item.status === "critical" && <X className="h-4 w-4 text-red-500 mr-3 flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{expandPerformanceMetrics(item.detail, t)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI 可見度 */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t("tracking.aiVisibility")}
                <Badge variant="secondary">{results.aiVisibility.weight}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.aiVisibility.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
                    <div className="flex items-center min-w-0 flex-1">
                      {item.status === "good" && <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />}
                      {item.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500 mr-3 flex-shrink-0" />}
                      {item.status === "critical" && <X className="h-4 w-4 text-red-500 mr-3 flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{expandPerformanceMetrics(item.detail, t)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 競爭對手比較 & 優化潛力 - 移到主要內容區域 */}
          {(results.competitors || results.optimization) && (
            <div className="space-y-6">
            {/* 競爭對手比較 - 只在有數據時顯示 */}
            {results.competitors && (
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle>{t("tracking.competitorBenchmarkAnalysis")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("tracking.yourWebsite")}</span>
                      <span className="font-bold text-primary">{results.score}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("tracking.industryAverage")}</span>
                      <span className="text-muted-foreground">{results.competitors.averageScore}</span>
                    </div>
                    <div className="pt-2">
                      <Badge variant="secondary" className="text-xs">
                        {t("tracking.ranking")}: #{results.competitors.ranking} / {results.competitors.totalCompetitors} {t("tracking.topCompetitors")}
                      </Badge>
                    </div>
                    
                    {/* 競爭對手詳情 */}
                    {results.competitors.details && results.competitors.details.length > 0 && (
                      <div className="pt-4">
                        <h4 className="font-medium mb-3">{t("tracking.mainCompetitors")}</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {results.competitors.details.map((competitor, index) => (
                          <div key={index} className="p-3 bg-gradient-subtle rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{competitor.name}</span>
                              <span className="text-sm text-primary">{competitor.score}/100</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("tracking.strengths")}: {competitor.strengths.join(', ')}
                            </div>
                          </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 優化潛力 - 只在有數據時顯示 */}
            {results.optimization && (
              <>
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle>{t("tracking.optimizationPotential")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm">{t("tracking.estimatedTrafficIncrease")}</span>
                        </div>
                        <span className="font-bold text-green-600">+{results.optimization.potentialTrafficGain}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Target className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm">{t("tracking.estimatedConversionIncrease")}</span>
                        </div>
                        <span className="font-bold text-blue-600">+{results.optimization.potentialConversionGain}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 優化路線圖 */}
                {results.optimization.roadmap && results.optimization.roadmap.length > 0 && (
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>{t("tracking.optimizationRoadmap")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {results.optimization.roadmap.map((phase, index) => (
                          <div key={index} className="p-4 border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{phase.phase}</h4>
                              <Badge variant="outline">{phase.duration}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{phase.expectedResults}</p>
                            <div className="text-xs">
                              <span className="font-medium">{t("tracking.actionItems")} </span>
                              {phase.actions.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            </div>
          )}
        </div>
      </div>

      {/* 行動呼籲 */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">
              {currentScan?.website?.url ? 
                t("tracking.generateOptimizationFor", { domain: (() => {
                  try { return new URL(currentScan.website.url).hostname; }
                  catch { return currentScan.website.url; }
                })() }) :
                t("tracking.readyToOptimize")
              }
            </h3>
            <p className="text-muted-foreground">
              {currentScan?.website?.url ? 
                t("tracking.basedOnScanResults") :
                t("tracking.useAiOptimizationTool")
              }
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                className="bg-primary text-primary-foreground"
                disabled={(!currentScan?.website?.url && !url) || isLoading}
                onClick={() => handleOptimization()}
                title={(!currentScan?.website?.url && !url) ? t("tracking.scanFirstOrEnterUrl") :
                  currentScan?.website?.url ? (() => {
                    try { return t("tracking.generateOptimizationFor", { domain: new URL(currentScan.website.url).hostname }); }
                    catch { return t("tracking.startOptimization"); }
                  })() : ""}
              >
                {t("tracking.startOptimization")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="border-border"
                onClick={() => handleScan('detailed', currentScan?.website?.url || url)}
              >
                {t("tracking.rerunDeepScan")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("tracking.freeAIDiagnosis")}</h1>
            <p className="text-muted-foreground">{t("tracking.freeDiagnosisSteps")}</p>
          </div>
          <Button 
            variant="outline" 
            className="border-border"
            disabled={!isAuthenticated}
            title={!isAuthenticated ? t("tracking.pleaseLoginFirst") : ""}
            onClick={() => setShowScanHistory(!showScanHistory)}
          >
            <Search className="mr-2 h-4 w-4" />
            {t("tracking.scanRecord")} {scanHistory.length > 0 && `(${scanHistory.length})`}
          </Button>
        </div>

        {/* 掃描歷史記錄 */}
        {showScanHistory && isAuthenticated && (
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("tracking.scanHistoryTitle")}</CardTitle>
                  <CardDescription>
                    {t("tracking.scanHistoryDesc")}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowScanHistory(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>{t("tracking.loadingScanHistory")}</span>
                </div>
              ) : scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("tracking.noScanRecords")}</p>
                  <p className="text-sm">{t("tracking.startFirstScan")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scanHistory.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-4 bg-gradient-subtle rounded-lg border border-border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          scan.status === 'completed' ? 'bg-green-500' :
                          scan.status === 'failed' ? 'bg-red-500' :
                          scan.status === 'running' ? 'bg-blue-500 animate-pulse' :
                          'bg-yellow-500'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {/* Display website name/domain if available, otherwise scan ID */}
                            {scan.website ? scan.website.name || scan.website.domain || scan.website.url : `${t("tracking.scanning")} ${scan.id.substring(0, 8)}`}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{t("tracking.scanType")}: {
                              scan.scanType === 'quick' ? t('tracking.quickScan') :
                              scan.scanType === 'standard' ? t('tracking.standardScan') :
                              scan.scanType === 'comprehensive' ? t('tracking.comprehensiveScan') : scan.scanType
                            }</span>
                            <span>{t("tracking.status")}: {
                              scan.status === 'completed' ? t('tracking.completed') :
                              scan.status === 'failed' ? t('tracking.failed') :
                              scan.status === 'running' ? t('tracking.running') :
                              t('tracking.waiting')
                            }</span>
                            {scan.completedAt && (
                              <span>{t('tracking.completedAt')}: {new Date(scan.completedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {scan.status === 'completed' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={async () => {
                              try {
                                // 顯示載入狀態
                                toast({
                                  title: t("tracking.loadingResults"),
                                  description: t("tracking.gettingScanResults"),
                                });

                                // 調用 API 獲取掃描結果（使用現有的 getScan 端點）
                                const scanResponse = await scanService.getStatus(scan.id);
                                
                                if (scanResponse.success && scanResponse.data) {
                                  const updatedScan = scanResponse.data;
                                  
                                  // 更新當前掃描資訊
                                  setCurrentScan(updatedScan);
                                  
                                  // 設置掃描結果
                                  if (updatedScan.results) {
                                    setScanResults(updatedScan.results);
                                    
                                    // 顯示結果並隱藏掃描歷史
                                    setShowResults(true);
                                    setShowScanHistory(false);
                                    
                                    toast({
                                      title: t("tracking.loadSuccess"),
                                      description: t("tracking.scanResultsDisplayed"),
                                    });
                                  } else {
                                    toast({
                                      title: t("tracking.noResults"),
                                      description: t("tracking.scanNoResultsYet"),
                                      variant: "destructive",
                                    });
                                  }
                                } else {
                                  throw new Error('Unable to get scan results');
                                }
                              } catch (error: any) {
                                console.error('Failed to load scan results:', error);
                                toast({
                                  title: t("tracking.loadFailed"),
                                  description: error.response?.data?.message || error.message || t("tracking.unableToLoadResults"),
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            {t('tracking.viewResult')}
                          </Button>
                        )}
                        {(scan.status === 'failed' || scan.status === 'completed') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                // 重新使用相同的 websiteId 和掃描類型，並提供 URL 作為備用
                                const response = await scanService.start({
                                  websiteId: scan.websiteId,
                                  scanType: scan.scanType,
                                  url: scan.website?.url || scan.url
                                });
                                
                                if (response.success) {
                                  setCurrentScan(response.data);
                                  setIsScanning(true);
                                  setScanProgress(0);
                                  setShowScanHistory(false);
                                  setShowResults(false);
                                  setScanResults(null);
                                  
                                  toast({
                                    title: t("tracking.startRescan"),
                                    description: `${t('tracking.rescanInProgress', { scanType: scan.scanType === 'comprehensive' ? t('tracking.comprehensiveScan') : scan.scanType === 'standard' ? t('tracking.standardScan') : t('tracking.quickScan') })}`,
                                  });
                                  
                                  // 開始輪詢狀態
                                  const pollInterval = setInterval(async () => {
                                    try {
                                      const statusResponse = await scanService.getStatus(response.data.id);
                                      const updatedScan = statusResponse.data;
                                      setCurrentScan(updatedScan);
                                      
                                      if (updatedScan.progress) {
                                        setScanProgress(updatedScan.progress);
                                      }

                                      if (updatedScan.status === 'completed') {
                                        clearInterval(pollInterval);
                                        setIsScanning(false);
                                        setScanProgress(100);
                                        
                                        if (updatedScan.results) {
                                          setScanResults(updatedScan.results);
                                          setShowResults(true);
                                          loadScanHistory(); // 重新載入掃描歷史
                                          
                                          toast({
                                            title: t("tracking.rescanComplete"),
                                            description: t("tracking.scanResultsUpdated"),
                                          });
                                        }
                                      }

                                      if (updatedScan.status === 'failed') {
                                        clearInterval(pollInterval);
                                        setIsScanning(false);
                                        toast({
                                          title: t("tracking.scanFailed"),
                                          description: updatedScan.error || 'Error occurred during scanning',
                                          variant: "destructive",
                                        });
                                      }
                                    } catch (pollError) {
                                      console.error('Polling error:', pollError);
                                    }
                                  }, 3000);
                                  
                                  // 60 秒後停止輪詢
                                  setTimeout(() => {
                                    clearInterval(pollInterval);
                                    if (isScanning) {
                                      setIsScanning(false);
                                      toast({
                                        title: t("tracking.scanTimeout"),
                                        description: t("tracking.pleaseRetryLater"),
                                        variant: "destructive",
                                      });
                                    }
                                  }, 60000);
                                }
                              } catch (error: any) {
                                console.error('Rescan error:', error);
                                toast({
                                  title: t("tracking.rescanFailed"),
                                  description: error.response?.data?.message || error.message || t("tracking.pleaseRetryLater"),
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            {t('tracking.rescan')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-border">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => loadScanHistory()}
                      disabled={isLoadingHistory}
                    >
                      {isLoadingHistory ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("common.loading")}
                        </>
                      ) : (
                        t("tracking.reloadHistory")
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!showResults ? (
          <Card className="bg-gradient-card border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Scan className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t("tracking.freeAIDiagnosis")}</CardTitle>
              <CardDescription>
                {t("tracking.enterWebsiteUrl")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder={t("tracking.urlPlaceholder")}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                    disabled={isScanning}
                  />
                  <Button 
                    onClick={() => handleScan('basic')} 
                    disabled={isScanning || !url}
                    className="bg-primary text-primary-foreground"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("tracking.scanning")}
                      </>
                    ) : (
                      t("tracking.freeDiagnosis")
                    )}
                  </Button>
                </div>

                {/* 深度分析選項 */}
                {isAuthenticated && (
                  <div className="text-center">
                    <Button 
                      variant="outline"
                      onClick={() => handleScan('detailed')} 
                      disabled={isScanning || !url}
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      {t("tracking.deepAnalysisTime")}
                    </Button>
                  </div>
                )}
                
                {isScanning && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("tracking.scanProgress")}</span>
                      <span>{Math.round(scanProgress)}%</span>
                    </div>
                    <Progress value={scanProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">
                      {scanType === 'basic' 
                        ? t("tracking.performingFreeDiagnosis")
                        : t("tracking.performingDeepAnalysis")}
                    </p>
                  </div>
                )}
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* 功能說明 */}
              <div className="max-w-2xl mx-auto">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {t("tracking.freeDiagnosisBasics")}
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>{t("tracking.basicAiVisibilityScore")}</li>
                      <li>{t("tracking.mainIssueIdentification")}</li>
                      <li>{t("tracking.simpleImprovementSuggestions")}</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-primary/50 rounded-lg bg-primary/5">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Star className="h-4 w-4 text-primary mr-2" />
                      {t("tracking.deepAnalysisAdvanced")} {!isAuthenticated && t("tracking.requiresRegistration")}
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>{t("tracking.completeTechnicalArchitectureAnalysis")}</li>
                      <li>{t("tracking.detailedCompetitorComparison")}</li>
                      <li>{t("tracking.specificOptimizationRoadmap")}</li>
                      <li>{t("tracking.personalizedImprovementSuggestions")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : scanResults ? (
          <>
            {isBasicScanResults(scanResults) 
              ? renderBasicResults(scanResults)
              : renderDetailedResults(scanResults)
            }
          </>
        ) : null}
      </div>

      {/* 認證 Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="register"
        onSuccess={() => {
          // Check authentication status again after successful registration/login
          checkAuthStatus();
          setShowAuthModal(false);
          toast({
            title: t("tracking.welcome"),
            description: t("tracking.canUseFullScanFeatures"),
          });
        }}
      />

      {/* 優化結果 Modal */}
      {showOptimizationResults && optimizationResults && (
        <OptimizationResults
          data={{
            ...optimizationResults,
            websiteUrl: currentScan?.website?.url || url || optimizationResults.websiteInfo?.url
          }}
          onClose={() => {
            setShowOptimizationResults(false);
            setOptimizationResults(null);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default Tracking;