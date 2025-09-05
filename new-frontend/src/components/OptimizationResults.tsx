import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Download, 
  ExternalLink,
  Clock,
  Target,
  TrendingUp,
  Globe,
  Image,
  FileText,
  Shield,
  Zap,
  X
} from "lucide-react";

interface OptimizationSuggestion {
  type: string;
  current: string;
  suggested: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  implementation: string[];
}

interface AnalysisDetails {
  technicalHealth: number;
  contentQuality: number;
  aiVisibility: number;
  overallScore: number;
}

interface WebsiteInfo {
  title: string;
  description: string;
  wordCount: number;
  imagesCount: number;
  structuredDataCount: number;
  isHttps: boolean;
  robotsTxtExists: boolean;
  responseTime: number;
}

interface ExecutionPhase {
  phase: string;
  duration: string;
  actions: string[];
  expectedResults: string;
}

interface OptimizationResultsProps {
  data: {
    suggestions: OptimizationSuggestion[];
    geoScore: number;
    improvements: {
      current: number;
      potential: number;
    };
    executionPlan: ExecutionPhase[];
    analysisDetails: AnalysisDetails;
    websiteInfo: WebsiteInfo;
  };
  onClose: () => void;
}

const OptimizationResults: React.FC<OptimizationResultsProps> = ({ data, onClose }) => {
  // Add ESC key support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default'; 
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <XCircle className="w-4 h-4" />;
      case 'medium': return <AlertTriangle className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Critical Issues';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'meta_title':
      case 'meta_description':
        return <FileText className="w-5 h-5" />;
      case 'schema':
        return <Target className="w-5 h-5" />;
      case 'faq':
        return <FileText className="w-5 h-5" />;
      case 'heading':
        return <FileText className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-background border rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">GEO 優化分析結果</h2>
            <p className="text-muted-foreground mt-1">{data.websiteInfo.title}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              下載報告
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* 總體評分 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">GEO 評分</p>
                      <p className={`text-2xl font-bold ${getScoreColor(data.geoScore)}`}>
                        {data.geoScore}/100
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">技術健康</p>
                      <p className={`text-xl font-bold ${getScoreColor(data.analysisDetails.technicalHealth)}`}>
                        {data.analysisDetails.technicalHealth}/100
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">內容品質</p>
                      <p className={`text-xl font-bold ${getScoreColor(data.analysisDetails.contentQuality)}`}>
                        {data.analysisDetails.contentQuality}/100
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">AI 可見度</p>
                      <p className={`text-xl font-bold ${getScoreColor(data.analysisDetails.aiVisibility)}`}>
                        {data.analysisDetails.aiVisibility}/100
                      </p>
                    </div>
                    <Zap className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 改善潛力 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  改善潛力
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>當前分數</span>
                      <span className="font-semibold">{data.improvements.current}/100</span>
                    </div>
                    <Progress value={data.improvements.current} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>優化後預期</span>
                      <span className="font-semibold text-green-600">{data.improvements.potential}/100</span>
                    </div>
                    <Progress value={data.improvements.potential} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    透過實施建議的優化，您的 GEO 分數預計可提升 {data.improvements.potential - data.improvements.current} 分
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 網站資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  網站概況
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <FileText className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-semibold">{data.websiteInfo.wordCount}</p>
                    <p className="text-xs text-muted-foreground">字數</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <Image className="w-6 h-6 mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-semibold">{data.websiteInfo.imagesCount}</p>
                    <p className="text-xs text-muted-foreground">圖片</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <Target className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                    <p className="text-lg font-semibold">{data.websiteInfo.structuredDataCount}</p>
                    <p className="text-xs text-muted-foreground">結構化資料</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <Clock className="w-6 h-6 mx-auto mb-1 text-orange-500" />
                    <p className="text-lg font-semibold">{data.websiteInfo.responseTime}ms</p>
                    <p className="text-xs text-muted-foreground">響應時間</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-4">
                  <Badge variant={data.websiteInfo.isHttps ? "default" : "destructive"}>
                    {data.websiteInfo.isHttps ? "HTTPS ✓" : "HTTP ⚠️"}
                  </Badge>
                  <Badge variant={data.websiteInfo.robotsTxtExists ? "default" : "destructive"}>
                    {data.websiteInfo.robotsTxtExists ? "Robots.txt ✓" : "Robots.txt ✗"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 詳細分析 */}
            <Tabs defaultValue="suggestions" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="suggestions">優化建議</TabsTrigger>
                <TabsTrigger value="execution">執行計劃</TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="space-y-4">
                <div className="grid gap-4">
                  {data.suggestions.map((suggestion, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center text-lg">
                            {getSuggestionIcon(suggestion.type)}
                            <span className="ml-2 capitalize">
                              {suggestion.type.replace('_', ' ')} 優化
                            </span>
                          </CardTitle>
                          <Badge variant={getPriorityColor(suggestion.priority)}>
                            {getPriorityIcon(suggestion.priority)}
                            <span className="ml-1">{suggestion.priority.toUpperCase()}</span>
                          </Badge>
                        </div>
                        <CardDescription>{suggestion.reason}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">目前狀況:</h4>
                          <div className="bg-destructive/10 border-destructive/20 p-3 rounded border">
                            <p className="text-sm">{suggestion.current}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">建議改善:</h4>
                          <div className="bg-green-500/10 border-green-500/20 p-3 rounded border relative">
                            <pre className="text-sm whitespace-pre-wrap font-mono">{suggestion.suggested}</pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => copyToClipboard(suggestion.suggested)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">實施步驟:</h4>
                          <ul className="space-y-1">
                            {suggestion.implementation.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-center text-sm">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="execution" className="space-y-4">
                <div className="grid gap-4">
                  {data.executionPlan.map((phase, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Clock className="w-5 h-5 mr-2" />
                          {phase.phase}
                        </CardTitle>
                        <CardDescription>預計時間: {phase.duration}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">執行項目:</h4>
                          <ul className="space-y-1">
                            {phase.actions.map((action, actionIndex) => (
                              <li key={actionIndex} className="flex items-center text-sm">
                                <Target className="w-4 h-4 mr-2 text-blue-500" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">預期成果:</h4>
                          <p className="text-sm text-muted-foreground">{phase.expectedResults}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationResults;