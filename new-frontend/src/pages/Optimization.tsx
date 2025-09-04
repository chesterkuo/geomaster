import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Search, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Filter,
  ArrowLeft,
  Wand2,
  Edit,
  Database,
  BarChart3,
  Globe
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Optimization = () => {
  const [selectedPage, setSelectedPage] = useState(null);
  const [filters, setFilters] = useState({
    geoScore: "",
    traffic: "",
    type: ""
  });

  const handleAddPageAnalysis = () => {
    toast("新增頁面分析功能開發中...");
  };

  const handleAutoGenerate = (type: string) => {
    toast(`正在生成${type}...`);
  };

  const handleApplyAllSuggestions = () => {
    toast("正在套用所有優化建議...");
  };

  const handleManualEdit = () => {
    toast("切換至手動編輯模式");
  };

  const handleGenerateSchema = () => {
    toast("正在生成 Schema 標記...");
  };

  const contentPages = [
    {
      id: 1,
      title: "主要產品頁面",
      url: "/products/main",
      geoScore: 45,
      traffic: "高",
      type: "產品頁",
      issues: ["缺少問答段落", "需要權威引用", "標題結構待優化"],
      estimatedImprovement: 78
    },
    {
      id: 2,
      title: "AI 開發指南",
      url: "/blog/ai-guide", 
      geoScore: 62,
      traffic: "中",
      type: "部落格",
      issues: ["統計數據不足", "內容長度偏短", "Schema 標記缺失"],
      estimatedImprovement: 82
    },
    {
      id: 3,
      title: "常見問題解答",
      url: "/faq",
      geoScore: 38,
      traffic: "高",
      type: "FAQ",
      issues: ["結構化資料不完整", "問答覆蓋率低", "搜尋意圖不明確"],
      estimatedImprovement: 75
    },
    {
      id: 4,
      title: "服務介紹頁面",
      url: "/services/intro",
      geoScore: 52,
      traffic: "中",
      type: "產品頁",
      issues: ["專家引述缺失", "競爭優勢不突出", "呼籲行動不明確"],
      estimatedImprovement: 74
    },
    {
      id: 5,
      title: "技術文檔",
      url: "/docs/technical",
      geoScore: 58,
      traffic: "低",
      type: "部落格",
      issues: ["實用性不足", "範例代碼缺失", "更新頻率低"],
      estimatedImprovement: 73
    }
  ];

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 70) return "bg-green-100";
    if (score >= 50) return "bg-yellow-100";
    return "bg-red-100";
  };

  const filteredPages = contentPages.filter(page => {
    if (filters.geoScore === "low" && page.geoScore >= 60) return false;
    if (filters.traffic && filters.traffic !== "all" && page.traffic !== filters.traffic) return false;
    if (filters.type && filters.type !== "all" && page.type !== filters.type) return false;
    return true;
  });

  if (selectedPage) {
    const page = contentPages.find(p => p.id === selectedPage);
    
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
                <h1 className="text-3xl font-bold tracking-tight">內容優化編輯器</h1>
                <p className="text-muted-foreground">{page?.url}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className={getScoreBgColor(page?.geoScore)}>
                當前 GEO: {page?.geoScore}
              </Badge>
              <Badge variant="default" className="bg-green-100 text-green-800">
                預估: {page?.estimatedImprovement}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* 原始內容 */}
            <Card className="bg-gradient-card border-border flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  原始內容
                </CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription>{page?.title}</CardDescription>
                  <Badge variant="outline" className={`${getScoreColor(page?.geoScore)} border-current`}>
                    GEO 分數: {page?.geoScore}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Textarea 
                  placeholder="在此編輯您的內容..."
                  className="flex-1 min-h-[400px] resize-none"
                  defaultValue={`# ${page?.title}

這是您當前的頁面內容。您可以在此處編輯內容，或參考右側的 AI 優化建議來改善您的內容。

## 當前內容架構
- 基本介紹段落
- 主要特點說明
- 簡單的產品描述

## 識別的問題
${page?.issues.map(issue => `- ${issue}`).join('\n')}

這些問題影響了您的 GEO 分數，建議參考右側的優化建議進行改善。`}
                />
              </CardContent>
            </Card>

            {/* 優化建議 */}
            <Card className="bg-gradient-card border-border flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5 text-primary" />
                  優化建議
                </CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription>AI 智能分析建議</CardDescription>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    預估優化後: {page?.estimatedImprovement}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-subtle rounded-lg border border-border">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Target className="mr-2 h-4 w-4 text-blue-500" />
                      1. 添加問答段落
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      在內容中加入 3-5 個常見問題與詳細解答，提升 AI 對內容的理解度
                    </p>
                    <div className="text-xs text-muted-foreground mb-2">預估影響: +12 分</div>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleAutoGenerate("問答段落")}>
                      <Wand2 className="mr-1 h-3 w-3" />
                      自動生成問答段落
                    </Button>
                  </div>

                  <div className="p-4 bg-gradient-subtle rounded-lg border border-border">
                    <h4 className="font-medium mb-2 flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4 text-green-500" />
                      2. 增加統計數據
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      加入相關的市場數據、使用統計或效果證明來增強內容可信度
                    </p>
                    <div className="text-xs text-muted-foreground mb-2">預估影響: +8 分</div>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleAutoGenerate("統計數據")}>
                      <BarChart3 className="mr-1 h-3 w-3" />
                      建議相關統計數據
                    </Button>
                  </div>

                  <div className="p-4 bg-gradient-subtle rounded-lg border border-border">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-purple-500" />
                      3. 加入專家引述
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      引用行業專家觀點或權威機構聲明，提升內容權威性
                    </p>
                    <div className="text-xs text-muted-foreground mb-2">預估影響: +10 分</div>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleAutoGenerate("專家引述")}>
                      <Globe className="mr-1 h-3 w-3" />
                      尋找專家引述
                    </Button>
                  </div>

                  <div className="p-4 bg-gradient-subtle rounded-lg border border-border">
                    <h4 className="font-medium mb-2 flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-orange-500" />
                      4. 優化標題結構
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      重新組織 H1-H6 標題層級，確保邏輯清晰且包含關鍵字
                    </p>
                    <div className="text-xs text-muted-foreground mb-2">預估影響: +5 分</div>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleAutoGenerate("標題結構")}>
                      <FileText className="mr-1 h-3 w-3" />
                      重構標題結構
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <Button className="w-full bg-primary text-primary-foreground" onClick={handleApplyAllSuggestions}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    一鍵套用所有建議
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full" onClick={handleManualEdit}>
                      <Edit className="mr-1 h-3 w-3" />
                      手動編輯
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleGenerateSchema}>
                      <Database className="mr-1 h-3 w-3" />
                      生成 Schema
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">內容優化</h1>
            <p className="text-muted-foreground">選擇需要優化的頁面開始 GEO 內容優化</p>
          </div>
          <Button className="bg-primary text-primary-foreground" onClick={handleAddPageAnalysis}>
            <FileText className="mr-2 h-4 w-4" />
            新增頁面分析
          </Button>
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
                <label className="text-sm font-medium mb-2 block">GEO 分數</label>
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
                <label className="text-sm font-medium mb-2 block">流量等級</label>
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
                <label className="text-sm font-medium mb-2 block">頁面類型</label>
                <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇頁面類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部類型</SelectItem>
                    <SelectItem value="產品頁">產品頁</SelectItem>
                    <SelectItem value="部落格">部落格</SelectItem>
                    <SelectItem value="FAQ">FAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 頁面列表 */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>內容頁面列表</CardTitle>
            <CardDescription>共找到 {filteredPages.length} 個頁面需要優化</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPages.map((page) => (
                <div key={page.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-gradient-subtle hover:bg-gradient-subtle/80 transition-colors">
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
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{page.url}</p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">GEO:</span>
                          <span className={`font-bold ${getScoreColor(page.geoScore)}`}>{page.geoScore} 分</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-sm text-green-600">可提升至 {page.estimatedImprovement} 分</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setSelectedPage(page.id)}
                    className="bg-primary text-primary-foreground shadow-glow"
                  >
                    立即優化
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Optimization;