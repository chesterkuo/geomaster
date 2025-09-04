import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Globe, Bell, Shield, Database, Palette } from "lucide-react";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">系統設定</h1>
          <p className="text-muted-foreground">管理您的帳戶和應用程式偏好設定</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">一般設定</TabsTrigger>
            <TabsTrigger value="notifications">通知設定</TabsTrigger>
            <TabsTrigger value="security">安全設定</TabsTrigger>
            <TabsTrigger value="integrations">整合設定</TabsTrigger>
            <TabsTrigger value="appearance">外觀設定</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  基本資訊
                </CardTitle>
                <CardDescription>管理您的基本帳戶資訊</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">公司名稱</Label>
                    <Input id="company" placeholder="輸入公司名稱" defaultValue="GEO Platform" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">網站網址</Label>
                    <Input id="website" placeholder="https://example.com" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">時區</Label>
                    <Select defaultValue="asia-taipei">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia-taipei">台北 (GMT+8)</SelectItem>
                        <SelectItem value="asia-tokyo">東京 (GMT+9)</SelectItem>
                        <SelectItem value="utc">UTC (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">語言</Label>
                    <Select defaultValue="zh-TW">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh-TW">繁體中文</SelectItem>
                        <SelectItem value="zh-CN">简体中文</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">數據偏好設定</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>自動資料同步</Label>
                        <p className="text-sm text-muted-foreground">每小時自動同步網站數據</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>數據保留</Label>
                        <p className="text-sm text-muted-foreground">保留歷史數據 12 個月</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Button>儲存變更</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  通知偏好設定
                </CardTitle>
                <CardDescription>選擇您希望接收的通知類型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">電子郵件通知</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>SEO 警報</Label>
                        <p className="text-sm text-muted-foreground">當網站出現SEO問題時通知</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>排名變化</Label>
                        <p className="text-sm text-muted-foreground">關鍵字排名重大變化通知</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>週報</Label>
                        <p className="text-sm text-muted-foreground">每週SEO表現摘要報告</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>月報</Label>
                        <p className="text-sm text-muted-foreground">每月詳細分析報告</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">推播通知</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>即時警報</Label>
                        <p className="text-sm text-muted-foreground">重要事件的即時推播通知</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>任務提醒</Label>
                        <p className="text-sm text-muted-foreground">優化任務和截止日期提醒</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Button>儲存通知設定</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  安全性設定
                </CardTitle>
                <CardDescription>管理您的帳戶安全性</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">密碼設定</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">目前密碼</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">新密碼</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">確認新密碼</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  <Button>更新密碼</Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">兩步驗證</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>啟用兩步驗證</Label>
                      <p className="text-sm text-muted-foreground">增強帳戶安全性</p>
                    </div>
                    <Switch />
                  </div>
                  <Button variant="outline">設定驗證器應用程式</Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">登入記錄</h3>
                  <p className="text-sm text-muted-foreground">查看最近的登入活動</p>
                  <Button variant="outline">查看登入記錄</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  第三方整合
                </CardTitle>
                <CardDescription>連接外部服務和工具</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { name: "Google Analytics", status: "已連接", description: "網站流量分析" },
                    { name: "Google Search Console", status: "未連接", description: "搜尋引擎數據" },
                    { name: "Facebook Pixel", status: "已連接", description: "社群媒體追蹤" },
                    { name: "Google Ads", status: "未連接", description: "廣告效果追蹤" }
                  ].map((integration, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <h4 className="font-medium">{integration.name}</h4>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${integration.status === "已連接" ? "text-green-600" : "text-muted-foreground"}`}>
                          {integration.status}
                        </span>
                        <Button size="sm" variant={integration.status === "已連接" ? "outline" : "default"}>
                          {integration.status === "已連接" ? "管理" : "連接"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  外觀設定
                </CardTitle>
                <CardDescription>自訂應用程式的外觀和主題</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">主題設定</h3>
                  <div className="space-y-2">
                    <Label>主題模式</Label>
                    <Select defaultValue="dark">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">淺色模式</SelectItem>
                        <SelectItem value="dark">深色模式</SelectItem>
                        <SelectItem value="system">跟隨系統</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">顯示設定</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>緊湊模式</Label>
                        <p className="text-sm text-muted-foreground">減少介面元素間距</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>動畫效果</Label>
                        <p className="text-sm text-muted-foreground">啟用介面動畫和轉場效果</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Button>儲存外觀設定</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;