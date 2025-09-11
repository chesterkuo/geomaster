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
  User
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
      
      if (!isAuthenticated) {
        // Show empty data when not authenticated
        setPages([]);
        setIsLoading(false);
        return;
      }

      const response = await contentService.getPages();
      if (response.success) {
        setPages(response.data);
      } else {
        toast.error("載入頁面失敗: " + response.message);
      }
    } catch (error: any) {
      console.error('載入頁面錯誤:', error);
      toast.error("載入頁面失敗: " + (error.message || '未知錯誤'));
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
      if (error.response?.status === 409) {
        toast.error("此 URL 已存在，請檢查是否已經添加過相同的頁面");
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
      toast.info(`開始分析 ${page.title}...`);
      
      const response = await contentService.analyzePage(page.id);
      if (response.success) {
        toast.success(`${page.title} 分析完成！GEO 分數: ${response.data.geoScore}`);
        // Refresh pages to get updated analysis data
        loadPages();
      } else {
        toast.error("分析失敗: " + response.message);
      }
    } catch (error: any) {
      console.error('分析頁面錯誤:', error);
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
                    {selectedPage.geoScore && (
                      <div className="flex items-center justify-between">
                        <span>GEO 分數</span>
                        <span className={`font-bold text-lg ${getScoreColor(selectedPage.geoScore)}`}>
                          {selectedPage.geoScore} / 100
                        </span>
                      </div>
                    )}
                    
                    {selectedPage.estimatedImprovement && (
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">
                          預估可提升至 {selectedPage.estimatedImprovement} 分
                        </span>
                      </div>
                    )}

                    {selectedPage.issues && selectedPage.issues.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">發現的問題</Label>
                        <ul className="mt-2 space-y-1">
                          {selectedPage.issues.map((issue, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-2 text-yellow-500 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedPage.lastAnalyzedAt && (
                      <p className="text-xs text-muted-foreground">
                        最後分析時間: {new Date(selectedPage.lastAnalyzedAt).toLocaleString('zh-TW')}
                      </p>
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