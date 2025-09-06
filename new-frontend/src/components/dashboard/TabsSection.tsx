import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Lock, User } from "lucide-react";

interface TabsSectionProps {
  isAuthenticated?: boolean;
  onShowAuth?: () => void;
}

export const TabsSection = ({ isAuthenticated = false, onShowAuth }: TabsSectionProps) => {
  return (
    <Card className="p-6 bg-gradient-card border-border">
      <Tabs defaultValue="tracking" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-background/50">
            <TabsTrigger value="tracking" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              精緻網站
            </TabsTrigger>
            <TabsTrigger value="optimization" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              優化內容
            </TabsTrigger>
            <TabsTrigger value="generation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              生成報告
            </TabsTrigger>
          </TabsList>
          
          <Button size="sm" className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            新增專案
          </Button>
        </div>

        <TabsContent value="tracking" className="space-y-4">
          <div className="text-center py-12">
            {!isAuthenticated ? (
              <div className="text-muted-foreground mb-4">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Lock className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">需要登入才能開始追蹤</h4>
                <p className="text-sm mb-4">登入後即可添加網站 URL 開始監控 AI 平台可見度</p>
                <Button onClick={onShowAuth} className="bg-primary text-primary-foreground">
                  <User className="mr-2 h-4 w-4" />
                  立即登入
                </Button>
              </div>
            ) : (
              <div className="text-muted-foreground mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Plus className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">開始追蹤您的網站</h4>
                <p className="text-sm">添加網站 URL 開始監控 AI 平台可見度</p>
                <Button className="bg-primary text-primary-foreground">
                  新增網站
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="text-center py-12">
            {!isAuthenticated ? (
              <div className="text-muted-foreground mb-4">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Lock className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">需要登入才能開始優化</h4>
                <p className="text-sm mb-4">登入後 AI 就能分析您的內容並提供優化建議</p>
                <Button onClick={onShowAuth} className="bg-primary text-primary-foreground">
                  <User className="mr-2 h-4 w-4" />
                  立即登入
                </Button>
              </div>
            ) : (
              <div className="text-muted-foreground mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Plus className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">內容優化建議</h4>
                <p className="text-sm">AI 分析您的內容並提供優化建議</p>
                <Button className="bg-primary text-primary-foreground">
                  開始優化
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="generation" className="space-y-4">
          <div className="text-center py-12">
            {!isAuthenticated ? (
              <div className="text-muted-foreground mb-4">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Lock className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">需要登入才能生成報告</h4>
                <p className="text-sm mb-4">登入後即可生成詳細的 AI 優化報告和行動計劃</p>
                <Button onClick={onShowAuth} className="bg-primary text-primary-foreground">
                  <User className="mr-2 h-4 w-4" />
                  立即登入
                </Button>
              </div>
            ) : (
              <div className="text-muted-foreground mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Plus className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">AI 優化建議</h4>
                <p className="text-sm">生成詳細的優化報告和行動計劃</p>
                <Button className="bg-primary text-primary-foreground">
                  生成報告
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};