import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Upload
} from "lucide-react";

const Reporting = () => {
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

        <Tabs defaultValue="regular" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="regular">定期報告</TabsTrigger>
            <TabsTrigger value="custom">自訂報告</TabsTrigger>
            <TabsTrigger value="white-label">白標報告</TabsTrigger>
          </TabsList>

          <TabsContent value="regular" className="space-y-6">
            <div className="grid gap-6">
              {regularReports.map((report, index) => (
                <Card key={index} className="bg-gradient-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <Calendar className="mr-2 h-5 w-5 text-primary" />
                          {report.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {report.description}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={report.status === "active" ? "default" : "secondary"}
                        className={report.status === "active" ? "bg-green-100 text-green-800" : ""}
                      >
                        {report.status === "active" ? "啟用中" : "已排程"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">發送頻率</div>
                        <div className="font-medium">{report.frequency}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">上次發送</div>
                        <div className="font-medium">{report.lastSent}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">收件人</div>
                        <div className="font-medium flex items-center">
                          <Users className="mr-1 h-3 w-3" />
                          {report.recipients}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="mr-1 h-3 w-3" />
                          設定
                        </Button>
                        <Button variant="outline" size="sm">
                          <Send className="mr-1 h-3 w-3" />
                          立即發送
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>建立自訂報告</CardTitle>
                <CardDescription>選擇日期範圍、指標和格式來生成客製化報告</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 日期範圍 */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">日期範圍</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-date">開始日期</Label>
                        <Input type="date" id="start-date" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="end-date">結束日期</Label>
                        <Input type="date" id="end-date" className="mt-1" />
                      </div>
                    </div>
                  </div>

                  {/* 報告格式 */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">報告格式</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇格式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF 報告</SelectItem>
                        <SelectItem value="excel">Excel 試算表</SelectItem>
                        <SelectItem value="powerpoint">PowerPoint 簡報</SelectItem>
                        <SelectItem value="dashboard">線上儀表板</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 選擇指標 */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">選擇指標</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customReportMetrics.map((metric) => (
                      <div key={metric.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={metric.id}
                          className="rounded border-border"
                          defaultChecked={["ai-visibility", "content-quality", "technical-health"].includes(metric.id)}
                        />
                        <Label htmlFor={metric.id} className="text-sm">
                          <div>{metric.label}</div>
                          <div className="text-xs text-muted-foreground">{metric.category}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button className="bg-primary text-primary-foreground">
                    <FileText className="mr-2 h-4 w-4" />
                    生成報告
                  </Button>
                  <Button variant="outline">
                    預覽設定
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="white-label" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reporting;