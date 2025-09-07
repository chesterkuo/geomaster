import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth/AuthModal";
import { ReportTemplateBuilder } from "@/components/reports/ReportTemplateBuilder";
import { ReportScheduler } from "@/components/reports/ReportScheduler";
import { ReportLibrary } from "@/components/reports/ReportLibrary";
import { 
  Calendar, 
  Download, 
  FileText, 
  BarChart3, 
  Clock, 
  Settings, 
  Palette,
  Globe,
  Send,
  Plus,
  TrendingUp,
  Users,
  Target,
  Upload,
  Lock,
  User,
  Loader2
} from "lucide-react";

const Reporting = () => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const regularReports = [
    {
      title: "每週摘要",
      description: "自動發送的週度 GEO 表現報告",
      frequency: "每週一",
      status: "active",
      lastSent: "2024-03-18",
      recipients: 3
    },
    {
      title: "月度分析報告",
      description: "深度月度分析與趨勢洞察",
      frequency: "每月1日",
      status: "active",
      lastSent: "2024-03-01",
      recipients: 5
    },
    {
      title: "季度競爭分析",
      description: "競爭對手 GEO 表現比較分析",
      frequency: "每季",
      status: "scheduled",
      lastSent: "2024-01-01",
      recipients: 2
    }
  ];

  const customReportMetrics = [
    { id: "ai-visibility", label: "AI 可見度分數", category: "核心指標" },
    { id: "content-quality", label: "內容品質評分", category: "內容" },
    { id: "technical-health", label: "技術健康度", category: "技術" },
    { id: "competitor-ranking", label: "競爭對手排名", category: "競爭分析" },
    { id: "traffic-potential", label: "流量提升潛力", category: "預測" },
    { id: "conversion-rate", label: "轉換率優化", category: "轉換" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">報告中心</h1>
            <p className="text-muted-foreground">自動化報告與白標客製化</p>
          </div>
          <Button className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            建立新報告
          </Button>
        </div>

        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="library">報告庫</TabsTrigger>
            <TabsTrigger value="templates">模板管理</TabsTrigger>
            <TabsTrigger value="scheduled">排程報告</TabsTrigger>
            <TabsTrigger value="builder">模板建構器</TabsTrigger>
            <TabsTrigger value="white-label">白標報告</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            {!isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能使用報告庫</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可瀏覽和管理您的報告</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <ReportLibrary />
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {!isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能管理模板</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可建立和編輯報告模板</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-4">報告模板管理</h3>
                <p className="text-muted-foreground">此功能即將推出，敬請期待！</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            {!isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能使用排程報告</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可設定自動化報告排程</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <ReportScheduler />
            )}
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            {!isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Plus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能使用模板建構器</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可建立自訂報告模板</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <ReportTemplateBuilder />
            )}
          </TabsContent>


          <TabsContent value="white-label" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Palette className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能使用白牌報告</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可建立品牌化報告</p>
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
                <div className="grid gap-6 md:grid-cols-2">
                  {/* 白標設定 */}
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>白標客製化</CardTitle>
                      <CardDescription>為代理商客戶提供品牌化報告</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="company-logo">公司 Logo</Label>
                          <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div className="mt-2">
                              <Button variant="outline" size="sm">上傳 Logo</Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              建議尺寸: 200x80px, PNG/JPG
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="brand-colors">品牌顏色</Label>
                          <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-muted-foreground">主色調</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <Input type="color" className="w-12 h-8 p-0 border-0" defaultValue="#3b82f6" />
                                <Input type="text" placeholder="#3b82f6" className="flex-1" />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">輔助色</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <Input type="color" className="w-12 h-8 p-0 border-0" defaultValue="#64748b" />
                                <Input type="text" placeholder="#64748b" className="flex-1" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="custom-domain">自訂網域</Label>
                          <Input 
                            id="custom-domain" 
                            placeholder="reports.youragency.com" 
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            設定後客戶將在您的網域下查看報告
                          </p>
                        </div>
                      </div>

                      <Button className="w-full bg-primary text-primary-foreground">
                        <Palette className="mr-2 h-4 w-4" />
                        套用白標設定
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 預覽 */}
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>報告預覽</CardTitle>
                      <CardDescription>白標報告樣式預覽</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border border-border rounded-lg p-4 bg-background">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded"></div>
                            <span className="font-semibold">Your Agency</span>
                          </div>
                          <Badge variant="outline">GEO 報告</Badge>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium">AI 可見度分析</h4>
                            <div className="mt-2 bg-gradient-subtle rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">整體分數</span>
                                <span className="font-bold text-primary">74</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center p-2 bg-gradient-subtle rounded">
                              <TrendingUp className="mx-auto h-4 w-4 text-green-500 mb-1" />
                              <div className="font-medium">+23%</div>
                              <div className="text-xs text-muted-foreground">流量提升</div>
                            </div>
                            <div className="text-center p-2 bg-gradient-subtle rounded">
                              <Target className="mx-auto h-4 w-4 text-blue-500 mb-1" />
                              <div className="font-medium">85%</div>
                              <div className="text-xs text-muted-foreground">技術分數</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground text-center">
                          Generated by Your Agency • reports.youragency.com
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
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

export default Reporting;