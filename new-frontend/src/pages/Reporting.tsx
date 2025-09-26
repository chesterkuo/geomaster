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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const regularReports = [
    {
      title: t('reporting.regularReports.weeklySummary.title'),
      description: t('reporting.regularReports.weeklySummary.description'),
      frequency: t('reporting.regularReports.weeklySummary.frequency'),
      status: "active",
      lastSent: "2024-03-18",
      recipients: 3
    },
    {
      title: t('reporting.regularReports.monthlyAnalysis.title'),
      description: t('reporting.regularReports.monthlyAnalysis.description'),
      frequency: t('reporting.regularReports.monthlyAnalysis.frequency'),
      status: "active",
      lastSent: "2024-03-01",
      recipients: 5
    },
    {
      title: t('reporting.regularReports.quarterlyCompetitive.title'),
      description: t('reporting.regularReports.quarterlyCompetitive.description'),
      frequency: t('reporting.regularReports.quarterlyCompetitive.frequency'),
      status: "scheduled",
      lastSent: "2024-01-01",
      recipients: 2
    }
  ];

  const customReportMetrics = [
    { id: "ai-visibility", label: t('reporting.metrics.aiVisibility'), category: t('reporting.categories.core') },
    { id: "content-quality", label: t('reporting.metrics.contentQuality'), category: t('reporting.categories.content') },
    { id: "technical-health", label: t('reporting.metrics.technicalHealth'), category: t('reporting.categories.technical') },
    { id: "competitor-ranking", label: t('reporting.metrics.competitorRanking'), category: t('reporting.categories.competitive') },
    { id: "traffic-potential", label: t('reporting.metrics.trafficPotential'), category: t('reporting.categories.prediction') },
    { id: "conversion-rate", label: t('reporting.metrics.conversionRate'), category: t('reporting.categories.conversion') }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('reporting.title')}</h1>
            <p className="text-muted-foreground">{t('reporting.description')}</p>
          </div>
          <Button className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            {t('reporting.createNewReport')}
          </Button>
        </div>

        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="library">{t('reporting.tabs.library')}</TabsTrigger>
            <TabsTrigger value="templates">{t('reporting.tabs.templateManagement')}</TabsTrigger>
            <TabsTrigger value="scheduled">{t('reporting.tabs.scheduledReports')}</TabsTrigger>
            <TabsTrigger value="builder">{t('reporting.tabs.templateBuilder')}</TabsTrigger>
            <TabsTrigger value="white-label">{t('reporting.tabs.whiteLabel')}</TabsTrigger>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('reporting.auth.libraryRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('reporting.auth.libraryDescription')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('reporting.auth.loginNow')}
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('reporting.auth.templatesRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('reporting.auth.templatesDescription')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('reporting.auth.loginNow')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-4">{t('reporting.templateManagement.title')}</h3>
                <p className="text-muted-foreground">{t('reporting.templateManagement.comingSoon')}</p>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('reporting.auth.scheduledRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('reporting.auth.scheduledDescription')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('reporting.auth.loginNow')}
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('reporting.auth.builderRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('reporting.auth.builderDescription')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('reporting.auth.loginNow')}
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('reporting.auth.whiteLabelRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('reporting.auth.whiteLabelDescription')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('reporting.auth.loginNow')}
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
                      <CardTitle>{t('reporting.whiteLabel.title')}</CardTitle>
                      <CardDescription>{t('reporting.whiteLabel.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="company-logo">{t('reporting.whiteLabel.companyLogo')}</Label>
                          <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div className="mt-2">
                              <Button variant="outline" size="sm">{t('reporting.whiteLabel.uploadLogo')}</Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {t('reporting.whiteLabel.logoSizeHint')}
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="brand-colors">{t('reporting.whiteLabel.brandColors')}</Label>
                          <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-muted-foreground">{t('reporting.whiteLabel.primaryColor')}</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <Input type="color" className="w-12 h-8 p-0 border-0" defaultValue="#3b82f6" />
                                <Input type="text" placeholder="#3b82f6" className="flex-1" />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">{t('reporting.whiteLabel.secondaryColor')}</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <Input type="color" className="w-12 h-8 p-0 border-0" defaultValue="#64748b" />
                                <Input type="text" placeholder="#64748b" className="flex-1" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="custom-domain">{t('reporting.whiteLabel.customDomain')}</Label>
                          <Input 
                            id="custom-domain" 
                            placeholder="reports.youragency.com" 
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('reporting.whiteLabel.customDomainHint')}
                          </p>
                        </div>
                      </div>

                      <Button className="w-full bg-primary text-primary-foreground">
                        <Palette className="mr-2 h-4 w-4" />
                        {t('reporting.whiteLabel.applySettings')}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 預覽 */}
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>{t('reporting.whiteLabel.preview.title')}</CardTitle>
                      <CardDescription>{t('reporting.whiteLabel.preview.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border border-border rounded-lg p-4 bg-background">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded"></div>
                            <span className="font-semibold">Your Agency</span>
                          </div>
                          <Badge variant="outline">{t('reporting.whiteLabel.preview.geoReport')}</Badge>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium">{t('reporting.whiteLabel.preview.aiVisibilityAnalysis')}</h4>
                            <div className="mt-2 bg-gradient-subtle rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">{t('reporting.whiteLabel.preview.overallScore')}</span>
                                <span className="font-bold text-primary">74</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center p-2 bg-gradient-subtle rounded">
                              <TrendingUp className="mx-auto h-4 w-4 text-green-500 mb-1" />
                              <div className="font-medium">+23%</div>
                              <div className="text-xs text-muted-foreground">{t('reporting.whiteLabel.preview.trafficIncrease')}</div>
                            </div>
                            <div className="text-center p-2 bg-gradient-subtle rounded">
                              <Target className="mx-auto h-4 w-4 text-blue-500 mb-1" />
                              <div className="font-medium">85%</div>
                              <div className="text-xs text-muted-foreground">{t('reporting.whiteLabel.preview.technicalScore')}</div>
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