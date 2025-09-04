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

// 類型守衛
function isBasicScanResults(results: ScanResults): results is BasicScanResults {
  // 基礎結果只有 summary 但沒有 technicalHealth
  return 'summary' in results && !('technicalHealth' in results);
}

function isDetailedScanResults(results: ScanResults): results is DetailedScanResults {
  // 詳細結果有 technicalHealth
  return 'technicalHealth' in results;
}

// 生成模擬基礎掃描結果
const generateMockBasicResults = (url: string): BasicScanResults => {
  const domain = new URL(url).hostname;
  const score = Math.floor(Math.random() * 40) + 45; // 45-85 分
  
  return {
    score,
    summary: {
      status: score > 70 ? 'good' : score > 50 ? 'warning' : 'critical',
      message: score > 70 
        ? `${domain} 在 AI 搜索中表現良好，但仍有優化空間。`
        : score > 50 
        ? `${domain} 存在一些影響 AI 可見度的問題需要改善。`
        : `${domain} 在 AI 搜索中可見度較低，建議進行全面優化。`,
      keyIssues: [
        "Schema 標記覆蓋率不足 (僅 40%)",
        "內容更新頻率偏低",
        "缺乏結構化FAQ內容",
        "頁面載入速度需要改善"
      ]
    },
    preview: {
      technicalHealth: Math.floor(Math.random() * 30) + 60,
      contentQuality: Math.floor(Math.random() * 35) + 50,
      aiVisibility: Math.floor(Math.random() * 25) + 40
    },
    upgradeReasons: [
      "獲得 30+ 項技術指標詳細分析",
      "查看具體競爭對手表現比較",
      "獲得個人化優化執行計劃",
      "追蹤改善進度和成效監控"
    ]
  };
};

// 生成模擬詳細掃描結果
const generateMockDetailedResults = (url: string): DetailedScanResults => {
  const domain = new URL(url).hostname;
  const score = Math.floor(Math.random() * 35) + 55; // 55-90 分
  
  return {
    score,
    technicalHealth: {
      weight: 40,
      score: Math.floor(Math.random() * 25) + 65,
      items: [
        { name: "robots.txt 配置", status: "good", detail: "已允許 AI 爬蟲存取" },
        { name: "Schema 標記", status: "warning", detail: "覆蓋率 60%（建議 85%+）" },
        { name: "網站速度", status: "good", detail: "LCP 2.1秒（良好）" },
        { name: "JavaScript 渲染", status: "critical", detail: "SSR 支援不足" },
        { name: "SSL 憑證", status: "good", detail: "有效 HTTPS 配置" }
      ]
    },
    contentQuality: {
      weight: 30,
      score: Math.floor(Math.random() * 30) + 55,
      items: [
        { name: "平均內容長度", status: "warning", detail: "1,245 字（建議 1,500+）" },
        { name: "FAQ 覆蓋率", status: "warning", detail: "35%（建議 70%+）" },
        { name: "更新頻率", status: "critical", detail: "每月 1 次（建議每週）" },
        { name: "引用資料", status: "warning", detail: "部分頁面缺乏權威引用" },
        { name: "內容結構", status: "good", detail: "標題層級結構清晰" }
      ]
    },
    aiVisibility: {
      weight: 30,
      score: Math.floor(Math.random() * 20) + 50,
      items: [
        { name: "ChatGPT 提及", status: "warning", detail: "12 次/100 查詢" },
        { name: "Gemini 引用", status: "critical", detail: "8 次/100 查詢" },
        { name: "Perplexity 出現", status: "good", detail: "15 次/100 查詢" },
        { name: "Claude 可見度", status: "warning", detail: "10 次/100 查詢" },
        { name: "品牌識別度", status: "warning", detail: "中等水準" }
      ]
    },
    competitors: {
      averageScore: 72,
      ranking: Math.floor(Math.random() * 3) + 3, // 3-5 名
      totalCompetitors: 10,
      details: [
        { name: "競爭對手 A", score: 85, strengths: ["內容深度", "技術 SEO", "更新頻率"] },
        { name: "競爭對手 B", score: 78, strengths: ["品牌權威", "社群互動", "多媒體內容"] },
        { name: "競爭對手 C", score: 73, strengths: ["頁面速度", "行動體驗", "本地化內容"] }
      ]
    },
    optimization: {
      potentialTrafficGain: Math.floor(Math.random() * 30) + 35, // 35-65%
      potentialConversionGain: Math.floor(Math.random() * 20) + 15, // 15-35%
      priorityActions: [
        { action: "完善 Schema 標記", impact: "high", difficulty: "medium", timeframe: "2-3週" },
        { action: "增加FAQ內容", impact: "high", difficulty: "easy", timeframe: "1週" },
        { action: "提高更新頻率", impact: "medium", difficulty: "medium", timeframe: "持續" },
        { action: "改善頁面速度", impact: "medium", difficulty: "hard", timeframe: "4-6週" }
      ],
      roadmap: [
        {
          phase: "第一階段：快速優化",
          duration: "2-3週",
          actions: ["新增FAQ內容", "完善Meta描述", "優化圖片Alt文字"],
          expectedResults: "AI可見度提升15-20%"
        },
        {
          phase: "第二階段：技術改善",
          duration: "4-6週",
          actions: ["實施完整Schema標記", "改善頁面載入速度", "增強行動裝置體驗"],
          expectedResults: "技術分數提升至80+"
        },
        {
          phase: "第三階段：內容深化",
          duration: "2-3個月",
          actions: ["建立內容更新計劃", "加強權威引用", "擴充主題覆蓋範圍"],
          expectedResults: "整體分數提升至85+"
        }
      ]
    }
  };
};

const Tracking = () => {
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
  const { toast } = useToast();
  const { isAuthenticated, user, checkAuthStatus } = useAuth();

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
      console.error('載入掃描歷史記錄失敗:', error);
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
    if (!isAuthenticated) {
      toast({
        title: "需要登入",
        description: "請先登入以使用優化功能",
        variant: "destructive",
      });
      setShowAuthModal(true);
      return;
    }

    const optimizationUrl = websiteUrl || url;
    if (!optimizationUrl) {
      toast({
        title: "錯誤",
        description: "需要網站 URL 才能進行優化分析",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "開始優化分析",
        description: "正在分析您的網站並生成優化建議...",
      });

      // 準備優化請求數據
      const optimizationRequest: OptimizationRequest = {
        websiteId: currentScan?.websiteId || '', // Use current scan's website ID if available
        url: optimizationUrl,
        focusAreas: ['technical', 'content', 'seo', 'performance'],
        businessGoals: ['increase_visibility', 'improve_rankings', 'enhance_performance']
      };

      const response = await contentService.getOptimizationSuggestions(optimizationRequest);

      if (response.success && response.data) {
        toast({
          title: "優化分析完成",
          description: `發現 ${response.data.suggestions.length} 項優化建議，預計可提升 ${response.data.potentialImprovement}% 表現`,
        });

        // 可以在這裡處理優化建議的顯示
        // 例如，打開一個新的頁面或模態框來顯示建議
        console.log('Optimization suggestions:', response.data);
      } else {
        throw new Error(response.message || '優化分析失敗');
      }
    } catch (error: any) {
      console.error('優化分析錯誤:', error);
      toast({
        title: "優化分析失敗",
        description: error.response?.data?.message || error.message || '請稍後重試',
        variant: "destructive",
      });
    }
  };

  // 處理掃描
  const handleScan = async (requestedScanType: 'basic' | 'detailed' = 'basic') => {
    if (!url) {
      toast({
        title: "錯誤",
        description: "請輸入網站 URL",
        variant: "destructive",
      });
      return;
    }

    // 驗證 URL 格式
    try {
      new URL(url);
    } catch {
      toast({
        title: "錯誤",
        description: "請輸入有效的網站 URL (例如: https://example.com)",
        variant: "destructive",
      });
      return;
    }

    // 檢查權限
    if (requestedScanType === 'detailed' && !isAuthenticated) {
      toast({
        title: "需要註冊",
        description: "深度分析功能需要註冊帳號",
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
      let useFallback = false;
      
      try {
        // 根據用戶認證狀態選擇API端點
        if (isAuthenticated) {
          // 已登入用戶 - 使用認證掃描端點，獲得完整詳細結果
          response = await scanService.startWebsiteScan(url, 'standard');
        } else {
          // 未登入用戶 - 使用匿名掃描，僅獲得基本結果
          response = await scanService.startAnonymousScan(url);
        }
        
        if (!response.success) {
          throw new Error(response.message || '掃描啟動失敗');
        }
      } catch (apiError) {
        console.warn('API 不可用，使用模擬數據:', apiError);
        useFallback = true;
      }

      if (useFallback) {
        // 使用模擬數據的 fallback 流程
        const progressInterval = setInterval(() => {
          setScanProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              setIsScanning(false);
              
              // 根據掃描類型生成對應的模擬結果
              const mockResults = requestedScanType === 'basic' ? 
                generateMockBasicResults(url) : generateMockDetailedResults(url);
              
              setScanResults(mockResults);
              setTimeout(() => {
                setShowResults(true);
                toast({
                  title: "掃描完成",
                  description: requestedScanType === 'basic' 
                    ? "免費 AI 可見度診斷完成！這是演示結果。" 
                    : "深度分析完成！這是演示結果。",
                });
              }, 500);
              
              return 100;
            }
            return prev + Math.random() * 12 + 3;
          });
        }, 400);
        return;
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
                  title: "掃描完成",
                  description: isAuthenticated
                    ? "完整 AI 可見度分析報告已生成！" 
                    : "免費 AI 可見度診斷完成！註冊獲得完整分析報告。",
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
                console.error('獲取報告失敗:', reportError);
              }
            }
          }

          // 掃描失敗
          if (updatedScan.status === 'failed') {
            clearInterval(pollInterval);
            clearInterval(progressInterval);
            setIsScanning(false);
            setError(updatedScan.error || '掃描過程中發生錯誤');
            
            setTimeout(() => {
              toast({
                title: "掃描失敗",
                description: updatedScan.error || '掃描過程中發生錯誤',
                variant: "destructive",
              });
            }, 0);
          }
        } catch (pollError) {
          console.error('輪詢錯誤:', pollError);
        }
      }, 3000);

      // 60 秒後停止輪詢
      setTimeout(() => {
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        if (isScanning) {
          setIsScanning(false);
          setError('掃描超時，請稍後重試');
        }
      }, 60000);

    } catch (err: any) {
      console.error('掃描錯誤:', err);
      setIsScanning(false);
      setError(err.response?.data?.message || err.message || '掃描失敗，請稍後重試');
      
      setTimeout(() => {
        toast({
          title: "錯誤",
          description: err.response?.data?.message || err.message || '掃描失敗，請稍後重試',
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
              <CardTitle className="text-xl">AI 可見度分數</CardTitle>
              <CardDescription>基礎診斷結果</CardDescription>
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
            診斷摘要
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{results.summary.message}</p>
          <div className="space-y-2">
            <h4 className="font-medium">主要發現：</h4>
            <ul className="space-y-1">
              {results.summary.keyIssues.map((issue, index) => (
                <li key={index} className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 分數預覽 */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>分析預覽</CardTitle>
          <CardDescription>註冊後可查看詳細分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
              <div className="flex items-center">
                <Globe className="h-4 w-4 text-blue-500 mr-3" />
                <span className="font-medium">技術健康度</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-blue-600">{results.preview.technicalHealth}/100</span>
                <Lock className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
              <div className="flex items-center">
                <Target className="h-4 w-4 text-green-500 mr-3" />
                <span className="font-medium">內容品質</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-green-600">{results.preview.contentQuality}/100</span>
                <Lock className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
              <div className="flex items-center">
                <Search className="h-4 w-4 text-purple-500 mr-3" />
                <span className="font-medium">AI 可見度</span>
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
            <h3 className="text-xl font-semibold">解鎖完整分析報告</h3>
            <p className="text-muted-foreground">
              註冊即可獲得深度分析，包含具體優化建議和競爭對手比較
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
                免費註冊解鎖
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
                重新掃描
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能預覽 */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>深度分析功能 (註冊後可用)</CardTitle>
          <CardDescription>完整的 GEO 優化分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border border-border rounded-lg bg-gradient-subtle opacity-60 relative">
              <Globe className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium mb-1">技術架構分析</h4>
              <p className="text-sm text-muted-foreground">網站技術結構深度檢測</p>
              <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-4 border border-border rounded-lg bg-gradient-subtle opacity-60 relative">
              <Target className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium mb-1">內容品質評估</h4>
              <p className="text-sm text-muted-foreground">AI 友善內容分析</p>
              <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-4 border border-border rounded-lg bg-gradient-subtle opacity-60 relative">
              <Search className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium mb-1">AI 平台可見度檢測</h4>
              <p className="text-sm text-muted-foreground">多平台 AI 搜尋表現</p>
              <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-4 border border-border rounded-lg bg-gradient-subtle opacity-60 relative">
              <Users className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium mb-1">競爭對手對比分析</h4>
              <p className="text-sm text-muted-foreground">詳細競爭力分析</p>
              <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-4 border border-border rounded-lg bg-gradient-subtle opacity-60 relative">
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium mb-1">優化機會識別</h4>
              <p className="text-sm text-muted-foreground">具體改善建議</p>
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
              <CardTitle className="text-xl">AI 可見度分數</CardTitle>
              <CardDescription>基於多項 GEO 指標的綜合評估</CardDescription>
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
                技術健康度
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
                        <div className="text-xs text-muted-foreground mt-1">{item.detail}</div>
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
                內容品質
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
                        <div className="text-xs text-muted-foreground mt-1">{item.detail}</div>
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
                AI 可見度
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
                        <div className="text-xs text-muted-foreground mt-1">{item.detail}</div>
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
                  <CardTitle>競爭對手比較</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">您的網站</span>
                      <span className="font-bold text-primary">{results.score}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">產業平均</span>
                      <span className="text-muted-foreground">{results.competitors.averageScore}</span>
                    </div>
                    <div className="pt-2">
                      <Badge variant="secondary" className="text-xs">
                        排名: 第 {results.competitors.ranking} 位 / {results.competitors.totalCompetitors} 家競爭對手
                      </Badge>
                    </div>
                    
                    {/* 競爭對手詳情 */}
                    {results.competitors.details && results.competitors.details.length > 0 && (
                      <div className="pt-4">
                        <h4 className="font-medium mb-3">主要競爭對手：</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {results.competitors.details.map((competitor, index) => (
                          <div key={index} className="p-3 bg-gradient-subtle rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{competitor.name}</span>
                              <span className="text-sm text-primary">{competitor.score}/100</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              優勢: {competitor.strengths.join(', ')}
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
                    <CardTitle>優化潛力</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm">預估可提升流量</span>
                        </div>
                        <span className="font-bold text-green-600">+{results.optimization.potentialTrafficGain}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Target className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm">預估轉換率提升</span>
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
                      <CardTitle>優化路線圖</CardTitle>
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
                              <span className="font-medium">行動項目: </span>
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
            <h3 className="text-lg font-semibold">準備開始優化？</h3>
            <p className="text-muted-foreground">
              使用我們的 AI 優化工具，快速提升您的網站在 AI 搜索中的可見度
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                className="bg-primary text-primary-foreground"
                onClick={() => handleOptimization()}
              >
                開始優化
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="border-border"
                onClick={() => handleScan('detailed')}
              >
                重新深度掃描
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
            <h1 className="text-3xl font-bold tracking-tight">AI 可見度診斷</h1>
            <p className="text-muted-foreground">免費診斷 → 註冊試用 → 深度分析</p>
          </div>
          <Button 
            variant="outline" 
            className="border-border"
            disabled={!isAuthenticated}
            title={!isAuthenticated ? "請先登入" : ""}
            onClick={() => setShowScanHistory(!showScanHistory)}
          >
            <Search className="mr-2 h-4 w-4" />
            掃描紀錄 {scanHistory.length > 0 && `(${scanHistory.length})`}
          </Button>
        </div>

        {/* 掃描歷史記錄 */}
        {showScanHistory && isAuthenticated && (
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>掃描歷史記錄</CardTitle>
                  <CardDescription>
                    查看您之前的掃描結果
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
                  <span>載入掃描歷史記錄中...</span>
                </div>
              ) : scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>尚無掃描記錄</p>
                  <p className="text-sm">開始您的第一次網站掃描</p>
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
                            {/* Extract domain from scan or use scan ID */}
                            {scan.id}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>類型: {
                              scan.scanType === 'quick' ? '快速' :
                              scan.scanType === 'standard' ? '標準' :
                              scan.scanType === 'comprehensive' ? '深度' : scan.scanType
                            }</span>
                            <span>狀態: {
                              scan.status === 'completed' ? '已完成' :
                              scan.status === 'failed' ? '失敗' :
                              scan.status === 'running' ? '進行中' :
                              '等待中'
                            }</span>
                            {scan.completedAt && (
                              <span>完成: {new Date(scan.completedAt).toLocaleDateString('zh-TW')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {scan.status === 'completed' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // 載入掃描結果
                              if (scan.results) {
                                setScanResults(scan.results);
                                setShowResults(true);
                                setShowScanHistory(false);
                              }
                            }}
                          >
                            查看結果
                          </Button>
                        )}
                        {(scan.status === 'failed' || scan.status === 'completed') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                // 重新使用相同的 websiteId 和掃描類型
                                const response = await scanService.start({
                                  websiteId: scan.websiteId,
                                  scanType: scan.scanType
                                });
                                
                                if (response.success) {
                                  setCurrentScan(response.data);
                                  setIsScanning(true);
                                  setScanProgress(0);
                                  setShowScanHistory(false);
                                  setShowResults(false);
                                  setScanResults(null);
                                  
                                  toast({
                                    title: "開始重新掃描",
                                    description: `正在進行${scan.scanType === 'comprehensive' ? '深度' : scan.scanType === 'standard' ? '標準' : '快速'}掃描...`,
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
                                            title: "重新掃描完成",
                                            description: "掃描結果已更新！",
                                          });
                                        }
                                      }

                                      if (updatedScan.status === 'failed') {
                                        clearInterval(pollInterval);
                                        setIsScanning(false);
                                        toast({
                                          title: "掃描失敗",
                                          description: updatedScan.error || '掃描過程中發生錯誤',
                                          variant: "destructive",
                                        });
                                      }
                                    } catch (pollError) {
                                      console.error('輪詢錯誤:', pollError);
                                    }
                                  }, 3000);
                                  
                                  // 60 秒後停止輪詢
                                  setTimeout(() => {
                                    clearInterval(pollInterval);
                                    if (isScanning) {
                                      setIsScanning(false);
                                      toast({
                                        title: "掃描超時",
                                        description: "請稍後重試",
                                        variant: "destructive",
                                      });
                                    }
                                  }, 60000);
                                }
                              } catch (error: any) {
                                console.error('重新掃描錯誤:', error);
                                toast({
                                  title: "重新掃描失敗",
                                  description: error.response?.data?.message || error.message || '請稍後重試',
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            重新掃描
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
                          載入中...
                        </>
                      ) : (
                        '重新載入'
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
              <CardTitle className="text-2xl">免費 AI 可見度診斷</CardTitle>
              <CardDescription>
                輸入您的網站網址，獲得免費 AI 可見度診斷
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="https://your-website.com"
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
                        掃描中
                      </>
                    ) : (
                      "免費診斷"
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
                      深度分析 (3-5分鐘)
                    </Button>
                  </div>
                )}
                
                {isScanning && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>掃描進度</span>
                      <span>{Math.round(scanProgress)}%</span>
                    </div>
                    <Progress value={scanProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">
                      {scanType === 'basic' 
                        ? '正在進行免費診斷...' 
                        : '正在進行深度分析，請稍候...'}
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
                      免費診斷
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 基礎 AI 可見度分數</li>
                      <li>• 主要問題識別</li>
                      <li>• 簡易改善建議</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-primary/50 rounded-lg bg-primary/5">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Star className="h-4 w-4 text-primary mr-2" />
                      深度分析 {!isAuthenticated && "(需註冊)"}
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 完整技術架構分析</li>
                      <li>• 競爭對手詳細比較</li>
                      <li>• 具體優化路線圖</li>
                      <li>• 個人化改善建議</li>
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
          // 註冊/登入成功後重新檢查認證狀態
          checkAuthStatus();
          setShowAuthModal(false);
          toast({
            title: "歡迎！",
            description: "現在您可以使用完整的掃描功能了！",
          });
        }}
      />
    </DashboardLayout>
  );
};

export default Tracking;