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

const Optimization = () => {
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
      
      // 嘗試加載頁面，即使身份驗證狀態未確定
      const response = await contentService.getPages();
      if (response.success) {
        setPages(response.data);
        console.log('載入頁面成功:', response.data.length, '個頁面');
      } else {
        console.error('API 響應失敗:', response.message);
        toast.error("載入頁面失敗: " + response.message);
        
        // 如果是身份驗證錯誤，顯示登入提示
        if (response.message?.includes('token') || response.message?.includes('unauthorized')) {
          setShowAuthModal(true);
        }
      }
    } catch (error: any) {
      console.error('載入頁面錯誤:', error);
      
      // 處理401認證錯誤
      if (error.response?.status === 401) {
        console.log('檢測到401錯誤，需要重新登入');
        toast.error("登入已過期，請重新登入");
        setShowAuthModal(true);
        return;
      }
      
      // 處理403權限錯誤
      if (error.response?.status === 403) {
        toast.error("權限不足，請聯絡管理員");
        return;
      }
      
      // 更詳細的錯誤處理
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('身份驗證錯誤，顯示登入對話框');
        setShowAuthModal(true);
        toast.error("請先登入以查看頁面列表");
      } else if (error.response?.data?.message) {
        toast.error("載入頁面失敗: " + error.response.data.message);
      } else {
        toast.error("載入頁面失敗: " + (error.message || '網路連接錯誤'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPage = async () => {
    if (!newPageData.title.trim() || !newPageData.url.trim()) {
      toast.error("請填寫完整的標題和URL");
      return;
    }

    // URL validation
    try {
      new URL(newPageData.url);
    } catch {
      toast.error("請輸入有效的URL (例如: https://example.com)");
      return;
    }

    try {
      setIsAddingPage(true);
      const response = await contentService.addPage(newPageData);
      if (response.success) {
        toast.success("頁面新增成功！");
        setPages(prev => [response.data, ...prev]);
        setShowAddDialog(false);
        setNewPageData({
          title: "",
          url: "",
          type: "其他",
          traffic: "中"
        });
      } else {
        toast.error("新增失敗: " + response.message);
      }
    } catch (error: any) {
      console.error('新增頁面錯誤:', error);
      
      // 處理特定的錯誤狀態
      if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
        toast.error("此 URL 已存在，重新載入頁面列表");
        // 重新載入頁面列表以顯示現有頁面
        loadPages();
        setShowAddDialog(false);
      } else if (error.response?.data?.message) {
        toast.error("新增失敗: " + error.response.data.message);
      } else {
        toast.error("新增失敗: " + (error.message || '未知錯誤'));
      }
    } finally {
      setIsAddingPage(false);
    }
  };

  const handleAnalyzePage = async (page: Page) => {
    try {
      setIsAnalyzing(true);
      
      // 立即設置頁面為分析中狀態
      const analyzingPage: Page = {
        ...page,
        analysisStatus: 'analyzing'
      };
      
      setPages(prev => prev.map(p => p.id === page.id ? analyzingPage : p));
      if (selectedPage?.id === page.id) {
        setSelectedPage(analyzingPage);
      }
      
      toast.info(`開始分析 ${page.title}...`);
      
      const response = await contentService.analyzePage(page.id);
      if (response.success) {
        const { geoScore, estimatedImprovement, issues, message } = response.data;
        
        // 更新頁面狀態
        const updatedPage: Page = {
          ...page,
          geoScore,
          estimatedImprovement,
          issues,
          analysisStatus: 'completed',
          lastAnalyzedAt: new Date().toISOString()
        };

        // 更新頁面列表
        setPages(prev => prev.map(p => p.id === page.id ? updatedPage : p));
        
        // 如果當前正在查看詳細頁面，也更新選中的頁面
        if (selectedPage?.id === page.id) {
          setSelectedPage(updatedPage);
        }

        toast.success(`${page.title} 分析完成！GEO 分數: ${geoScore}`);
        
        // 顯示分析結果詳情
        if (issues && issues.length > 0) {
          setTimeout(() => {
            toast.info(`發現 ${issues.length} 個可優化項目，點擊查看詳情了解更多`);
          }, 2000);
        }
      } else {
        // 分析失敗，恢復原狀態
        setPages(prev => prev.map(p => p.id === page.id ? page : p));
        if (selectedPage?.id === page.id) {
          setSelectedPage(page);
        }
        toast.error("分析失敗: " + response.message);
      }
    } catch (error: any) {
      console.error('分析頁面錯誤:', error);
      
      // 分析失敗，恢復原狀態
      setPages(prev => prev.map(p => p.id === page.id ? page : p));
      if (selectedPage?.id === page.id) {
        setSelectedPage(page);
      }
      
      toast.error("分析失敗: " + (error.message || '未知錯誤'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeletePage = async (pageId: string, title: string) => {
    if (!confirm(`確定要刪除「${title}」嗎？`)) {
      return;
    }

    try {
      const response = await contentService.deletePage(pageId);
      if (response.success) {
        toast.success("頁面已刪除");
        setPages(prev => prev.filter(p => p.id !== pageId));
      } else {
        toast.error("刪除失敗: " + response.message);
      }
    } catch (error: any) {
      console.error('刪除頁面錯誤:', error);
      toast.error("刪除失敗: " + (error.message || '未知錯誤'));
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

  const filteredPages = pages.filter(page => {
    if (filters.geoScore === "low" && (page.geoScore ?? 0) >= 60) return false;
    if (filters.traffic !== "all" && page.traffic !== filters.traffic) return false;
    if (filters.type !== "all" && page.type !== filters.type) return false;
    return true;
  });

  // 詳細頁面視圖
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
                返回列表
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">頁面詳細分析</h1>
                <p className="text-muted-foreground">{selectedPage.url}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedPage.geoScore && (
                <>
                  <Badge variant="secondary" className={getScoreBgColor(selectedPage.geoScore)}>
                    當前 GEO: {selectedPage.geoScore}
                  </Badge>
                  {selectedPage.estimatedImprovement && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      預估: {selectedPage.estimatedImprovement}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 頁面資訊卡片 */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  頁面資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>頁面標題</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedPage.title}</p>
                </div>
                <div>
                  <Label>URL</Label>
                  <p className="text-sm text-muted-foreground mt-1 break-all">{selectedPage.url}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <Label>類型</Label>
                    <Badge variant="outline" className="mt-1 block w-fit">
                      {selectedPage.type}
                    </Badge>
                  </div>
                  <div>
                    <Label>流量等級</Label>
                    <Badge variant={selectedPage.traffic === "高" ? "default" : "secondary"} className="mt-1 block w-fit">
                      {selectedPage.traffic}流量
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>分析狀態</Label>
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
                    重新分析
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 分析結果卡片 */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-5 w-5 text-primary" />
                  分析結果
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPage.analysisStatus === 'completed' ? (
                  <div className="space-y-4">
                    {selectedPage.geoScore !== undefined ? (
                      <>
                        <div className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
                          <span className="font-medium">GEO 分數</span>
                          <span className={`font-bold text-xl ${getScoreColor(selectedPage.geoScore)}`}>
                            {selectedPage.geoScore} / 100
                          </span>
                        </div>
                        
                        {selectedPage.estimatedImprovement && (
                          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <div>
                              <span className="text-sm font-medium text-green-800">
                                預估優化潛力
                              </span>
                              <p className="text-sm text-green-600">
                                可提升至 {selectedPage.estimatedImprovement} 分 
                                <span className="font-medium">
                                  (+{selectedPage.estimatedImprovement - selectedPage.geoScore} 分)
                                </span>
                              </p>
                            </div>
                          </div>
                        )}

                        {/* GEO分數計算說明 */}
                        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <Info className="h-5 w-5 text-blue-600 mr-2" />
                            <Label className="text-sm font-medium text-blue-800">
                              GEO 分數計算說明
                            </Label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <h4 className="font-medium text-blue-800">技術SEO (30%)</h4>
                              <ul className="text-blue-700 space-y-1 pl-3">
                                <li>• 網頁載入速度</li>
                                <li>• 行動裝置適配性</li>
                                <li>• HTML標籤結構</li>
                                <li>• SSL安全性</li>
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-blue-800">內容品質 (25%)</h4>
                              <ul className="text-blue-700 space-y-1 pl-3">
                                <li>• 標題標籤優化</li>
                                <li>• 內容長度與深度</li>
                                <li>• 關鍵字分佈</li>
                                <li>• 內容原創性</li>
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-blue-800">用戶體驗 (25%)</h4>
                              <ul className="text-blue-700 space-y-1 pl-3">
                                <li>• 網站導航結構</li>
                                <li>• 互動元素設計</li>
                                <li>• 內容可讀性</li>
                                <li>• 網頁無障礙性</li>
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-blue-800">搜尋優化 (20%)</h4>
                              <ul className="text-blue-700 space-y-1 pl-3">
                                <li>• Meta描述優化</li>
                                <li>• 內部連結策略</li>
                                <li>• 圖片Alt標籤</li>
                                <li>• Schema標記</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* 具體優化建議 */}
                        <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <HelpCircle className="h-5 w-5 text-purple-600 mr-2" />
                            <Label className="text-sm font-medium text-purple-800">
                              針對此頁面的優化建議
                            </Label>
                          </div>
                          <div className="space-y-3">
                            {selectedPage.geoScore < 70 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-purple-800">優先處理項目：</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {selectedPage.geoScore < 60 && (
                                    <div className="bg-red-100 border border-red-200 rounded p-3">
                                      <h5 className="font-medium text-red-800 mb-2">🚨 高優先級</h5>
                                      <ul className="text-sm text-red-700 space-y-1">
                                        <li>• 檢查網頁載入速度（目標 &lt; 3秒）</li>
                                        <li>• 優化標題標籤（H1, H2 結構）</li>
                                        <li>• 確保行動裝置相容性</li>
                                        <li>• 新增或優化 Meta 描述</li>
                                      </ul>
                                    </div>
                                  )}
                                  {selectedPage.geoScore >= 40 && (
                                    <div className="bg-yellow-100 border border-yellow-200 rounded p-3">
                                      <h5 className="font-medium text-yellow-800 mb-2">⚡ 中優先級</h5>
                                      <ul className="text-sm text-yellow-700 space-y-1">
                                        <li>• 增加內容長度（建議 &gt; 300字）</li>
                                        <li>• 優化關鍵字密度（2-4%）</li>
                                        <li>• 新增內部連結</li>
                                        <li>• 改善圖片 Alt 標籤</li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                <div className="bg-green-100 border border-green-200 rounded p-3">
                                  <h5 className="font-medium text-green-800 mb-2">📈 進階優化</h5>
                                  <ul className="text-sm text-green-700 space-y-1">
                                    <li>• 實施 Schema.org 結構化標記</li>
                                    <li>• 優化 Core Web Vitals 指標</li>
                                    <li>• 建立相關頁面內容集群</li>
                                    <li>• 增強用戶互動體驗元素</li>
                                  </ul>
                                </div>
                              </div>
                            )}
                            {selectedPage.geoScore >= 70 && (
                              <div className="bg-green-100 border border-green-200 rounded p-3">
                                <h5 className="font-medium text-green-800 mb-2">🎯 維持優勢</h5>
                                <ul className="text-sm text-green-700 space-y-1">
                                  <li>• 定期更新內容保持新鮮度</li>
                                  <li>• 監控載入速度變化</li>
                                  <li>• 擴展相關主題內容</li>
                                  <li>• 優化內部連結網絡</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <p className="text-sm text-muted-foreground">分析完成，但未獲得評分數據</p>
                      </div>
                    )}

                    {selectedPage.issues && selectedPage.issues.length > 0 ? (
                      <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                          <Label className="text-sm font-medium text-amber-800">
                            發現 {selectedPage.issues.length} 個可優化項目
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
                      // 根據分數顯示不同的訊息
                      selectedPage.geoScore >= 70 ? (
                        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-green-800">
                              恭喜！此頁面表現優秀，已達到良好水準
                            </span>
                          </div>
                        </div>
                      ) : selectedPage.geoScore >= 50 ? (
                        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                            <span className="text-sm font-medium text-yellow-800">
                              此頁面表現一般，仍有優化空間，建議檢查技術SEO和內容品質
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-600 mr-2" />
                            <span className="text-sm font-medium text-red-800">
                              此頁面需要重點改善，建議優先處理基礎SEO、載入速度和內容結構
                            </span>
                          </div>
                        </div>
                      )
                    ) : null}

                    {selectedPage.lastAnalyzedAt && (
                      <div className="border-t pt-3">
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          最後分析時間: {new Date(selectedPage.lastAnalyzedAt).toLocaleString('zh-TW')}
                        </p>
                      </div>
                    )}
                  </div>
                ) : selectedPage.analysisStatus === 'analyzing' ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">正在分析中...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-muted-foreground">尚未進行分析</p>
                      <Button 
                        onClick={() => handleAnalyzePage(selectedPage)}
                        disabled={isAnalyzing}
                        size="sm"
                        className="mt-2"
                      >
                        開始分析
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

  // 主列表視圖
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 頂部操作區 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">內容優化</h1>
            <p className="text-muted-foreground">管理和優化您的網站頁面以提升 GEO 分數</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增頁面分析
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增頁面分析</DialogTitle>
                <DialogDescription>
                  輸入要分析的頁面資訊，系統會對該頁面進行 GEO 分析
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">頁面標題</Label>
                  <Input
                    id="title"
                    placeholder="例如：產品介紹頁面"
                    value={newPageData.title}
                    onChange={(e) => setNewPageData({ ...newPageData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="url">頁面URL</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/page"
                    value={newPageData.url}
                    onChange={(e) => setNewPageData({ ...newPageData, url: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>頁面類型</Label>
                    <Select value={newPageData.type} onValueChange={(value: any) => setNewPageData({ ...newPageData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="產品頁">產品頁</SelectItem>
                        <SelectItem value="部落格">部落格</SelectItem>
                        <SelectItem value="FAQ">FAQ</SelectItem>
                        <SelectItem value="服務頁">服務頁</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>流量等級</Label>
                    <Select value={newPageData.traffic} onValueChange={(value: any) => setNewPageData({ ...newPageData, traffic: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="高">高流量</SelectItem>
                        <SelectItem value="中">中等流量</SelectItem>
                        <SelectItem value="低">低流量</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddPage} disabled={isAddingPage}>
                    {isAddingPage ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    新增頁面
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 篩選器 */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              篩選條件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">GEO 分數</Label>
                <Select value={filters.geoScore} onValueChange={(value) => setFilters({...filters, geoScore: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇分數範圍" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分數</SelectItem>
                    <SelectItem value="low">低於 60 分</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">流量等級</Label>
                <Select value={filters.traffic} onValueChange={(value) => setFilters({...filters, traffic: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇流量等級" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部流量</SelectItem>
                    <SelectItem value="高">高流量優先</SelectItem>
                    <SelectItem value="中">中等流量</SelectItem>
                    <SelectItem value="低">低流量</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">頁面類型</Label>
                <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇頁面類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部類型</SelectItem>
                    <SelectItem value="產品頁">產品頁</SelectItem>
                    <SelectItem value="部落格">部落格</SelectItem>
                    <SelectItem value="FAQ">FAQ</SelectItem>
                    <SelectItem value="服務頁">服務頁</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 頁面列表 */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>內容頁面列表</CardTitle>
                <CardDescription>
                  {isLoading ? "載入中..." : `共找到 ${filteredPages.length} 個頁面`}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={loadPages} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                重新載入
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">載入頁面中...</p>
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
                      <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能查看頁面優化報告</p>
                      <p className="text-sm text-muted-foreground mb-6">登入後即可新增頁面並進行完整的 GEO 分析</p>
                      <div className="space-y-3">
                        <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                          <User className="mr-2 h-4 w-4" />
                          立即登入
                        </Button>
                        <p className="text-xs text-muted-foreground">還沒有帳號嗎？登入窗口中可以選擇註冊</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">尚無頁面</p>
                      <p className="text-sm text-muted-foreground mb-4">開始新增頁面進行 GEO 分析</p>
                      <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        新增第一個頁面
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
                            {page.traffic}流量
                          </Badge>
                          {getStatusIcon(page.analysisStatus)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 break-all">{page.url}</p>
                        <div className="flex items-center space-x-4">
                          {page.geoScore ? (
                            <>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">GEO:</span>
                                <span className={`font-bold ${getScoreColor(page.geoScore)}`}>{page.geoScore} 分</span>
                              </div>
                              {page.estimatedImprovement && (
                                <div className="flex items-center space-x-2">
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                  <span className="text-sm text-green-600">可提升至 {page.estimatedImprovement} 分</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">尚未分析</span>
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
                        分析
                      </Button>
                      <Button 
                        onClick={() => setSelectedPage(page)}
                        size="sm"
                        className="bg-primary text-primary-foreground shadow-glow"
                      >
                        查看詳情
                      </Button>
                      <Button 
                        onClick={() => handleDeletePage(page.id, page.title)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        刪除
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