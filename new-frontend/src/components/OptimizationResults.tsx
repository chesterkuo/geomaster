import React, { useEffect } from 'react';
import { jsPDF } from 'jspdf';

// Web 性能指標完整說明映射
const PERFORMANCE_METRICS = {
  LCP: "Largest Contentful Paint (最大內容繪製)",
  FCP: "First Contentful Paint (首次內容繪製)", 
  CLS: "Cumulative Layout Shift (累積版面位移)",
  FID: "First Input Delay (首次輸入延遲)",
  TTI: "Time to Interactive (可交互時間)",
  TTFB: "Time to First Byte (首位元組時間)"
};

// 擴展性能指標顯示文本的工具函數
const expandPerformanceMetrics = (text: string): string => {
  let expandedText = text;
  
  // 替換常見的性能指標縮寫
  Object.entries(PERFORMANCE_METRICS).forEach(([abbr, fullName]) => {
    // 匹配模式：縮寫後跟冒號和數值 (如: "LCP: 3.5s")
    const regex = new RegExp(`\\b${abbr}:\\s*([0-9.]+[a-z]*|[0-9.]+)`, 'gi');
    expandedText = expandedText.replace(regex, `${fullName} (${abbr}): $1`);
    
    // 也處理只有縮寫的情況 (如: "LCP 3.5s")
    const regexSpace = new RegExp(`\\b${abbr}\\s+([0-9.]+[a-z]*|[0-9.]+)`, 'gi');
    expandedText = expandedText.replace(regexSpace, `${fullName} (${abbr}) $1`);
  });
  
  return expandedText;
};

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
  X,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  url?: string;
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
    websiteUrl?: string;
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

  const downloadReport = (format: 'json' | 'markdown' | 'pdf') => {
    const reportData = {
      title: "GEO 優化分析報告",
      website: data.websiteInfo.title,
      websiteUrl: data.websiteUrl || data.websiteInfo.url, // 添加完整URL
      generatedAt: new Date().toISOString(),
      geoScore: data.geoScore,
      analysisDetails: data.analysisDetails,
      websiteInfo: data.websiteInfo,
      improvements: data.improvements,
      suggestions: data.suggestions,
      executionPlan: data.executionPlan
    };

    const dateStr = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'json':
        const jsonContent = JSON.stringify(reportData, null, 2);
        downloadFile(jsonContent, `geo-optimization-report-${dateStr}.json`, 'application/json');
        break;
      
      case 'markdown':
        const markdownContent = generateMarkdownReport(reportData);
        downloadFile(markdownContent, `geo-optimization-report-${dateStr}.md`, 'text/markdown');
        break;
      
      case 'pdf':
        generatePdfReport(reportData, `geo-optimization-report-${dateStr}.pdf`);
        break;
    }
  };

  const generateMarkdownReport = (reportData: any) => {
    return `# GEO 優化分析報告

## 網站基本資訊
- **網站**: ${reportData.websiteUrl || reportData.website}
- **生成時間**: ${new Date(reportData.generatedAt).toLocaleString('zh-TW')}

## 評分總覽
- **GEO 評分**: ${reportData.geoScore}/100
- **技術健康**: ${reportData.analysisDetails.technicalHealth}/100
- **內容品質**: ${reportData.analysisDetails.contentQuality}/100
- **AI 可見度**: ${reportData.analysisDetails.aiVisibility}/100

## 改善潛力
- **當前分數**: ${reportData.improvements.current}/100
- **優化後預期**: ${reportData.improvements.potential}/100
- **預期提升**: ${reportData.improvements.potential - reportData.improvements.current} 分

## 網站概況
- **字數**: ${reportData.websiteInfo.wordCount}
- **圖片數量**: ${reportData.websiteInfo.imagesCount}
- **結構化資料**: ${reportData.websiteInfo.structuredDataCount}
- **響應時間**: ${reportData.websiteInfo.responseTime}ms
- **HTTPS**: ${reportData.websiteInfo.isHttps ? '✓' : '✗'}
- **Robots.txt**: ${reportData.websiteInfo.robotsTxtExists ? '✓' : '✗'}

## 優化建議

${reportData.suggestions.map((suggestion: any, index: number) => `
### ${index + 1}. ${suggestion.type.replace('_', ' ')} 優化 (${suggestion.priority.toUpperCase()})

**問題描述**: ${expandPerformanceMetrics(suggestion.reason)}

**目前狀況**:
\`\`\`
${expandPerformanceMetrics(suggestion.current)}
\`\`\`

**建議改善**:
\`\`\`
${expandPerformanceMetrics(suggestion.suggested)}
\`\`\`

**實施步驟**:
${suggestion.implementation.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}
`).join('\n')}

## 執行計劃

${reportData.executionPlan.map((phase: any, index: number) => `
### 階段 ${index + 1}: ${phase.phase}
**預計時間**: ${phase.duration}

**執行項目**:
${phase.actions.map((action: string, i: number) => `- ${action}`).join('\n')}

**預期成果**: ${phase.expectedResults}
`).join('\n')}

---
*報告生成時間: ${new Date().toLocaleString('zh-TW')}*
`;
  };

  const generateHtmlReport = (reportData: any) => {
    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GEO 優化分析報告</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px; 
            color: #1a202c;
        }
        .header { 
            border-bottom: 3px solid #3b82f6; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
            page-break-after: avoid;
        }
        .score-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 20px 0; 
            page-break-inside: avoid;
        }
        .score-card { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            padding: 20px; 
            border-radius: 8px; 
        }
        .score-value { 
            font-size: 2em; 
            font-weight: bold; 
            color: #1e40af; 
        }
        .suggestion { 
            background: #fff; 
            border: 1px solid #e2e8f0; 
            margin: 20px 0; 
            padding: 20px; 
            border-radius: 8px; 
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .priority-high { border-left: 4px solid #ef4444; }
        .priority-medium { border-left: 4px solid #f59e0b; }
        .priority-low { border-left: 4px solid #10b981; }
        .code-block { 
            background: #f1f5f9; 
            padding: 15px; 
            border-radius: 4px; 
            font-family: 'Courier New', monospace; 
            margin: 10px 0; 
            white-space: pre-wrap;
            word-wrap: break-word;
            max-width: 100%;
            overflow-wrap: break-word;
        }
        .improvement-bar { 
            background: #e2e8f0; 
            height: 20px; 
            border-radius: 10px; 
            overflow: hidden; 
            margin: 10px 0; 
        }
        .improvement-fill { background: #3b82f6; height: 100%; }
        h2 { 
            color: #2d3748; 
            border-bottom: 2px solid #e2e8f0; 
            padding-bottom: 10px; 
            page-break-after: avoid;
        }
        h3 { 
            color: #2d3748; 
            page-break-after: avoid;
        }
        h4 { 
            color: #4a5568; 
            margin-top: 15px;
            page-break-after: avoid;
        }
        ol, ul { margin: 10px 0; padding-left: 25px; }
        li { margin: 5px 0; }
        
        @media print {
            body { font-size: 12pt; }
            .suggestion { 
                page-break-inside: avoid; 
                margin-bottom: 15pt;
            }
            .score-grid { page-break-inside: avoid; }
            h2, h3, h4 { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>GEO 優化分析報告</h1>
        <p><strong>網站</strong>: ${reportData.websiteUrl || reportData.website}</p>
        <p><strong>生成時間</strong>: ${new Date(reportData.generatedAt).toLocaleString('zh-TW')}</p>
    </div>

    <div class="score-grid">
        <div class="score-card">
            <h3>GEO 評分</h3>
            <div class="score-value">${reportData.geoScore}/100</div>
        </div>
        <div class="score-card">
            <h3>技術健康</h3>
            <div class="score-value">${reportData.analysisDetails.technicalHealth}/100</div>
        </div>
        <div class="score-card">
            <h3>內容品質</h3>
            <div class="score-value">${reportData.analysisDetails.contentQuality}/100</div>
        </div>
        <div class="score-card">
            <h3>AI 可見度</h3>
            <div class="score-value">${reportData.analysisDetails.aiVisibility}/100</div>
        </div>
    </div>

    <h2>改善潛力</h2>
    <p>當前分數: ${reportData.improvements.current}/100</p>
    <div class="improvement-bar">
        <div class="improvement-fill" style="width: ${reportData.improvements.current}%"></div>
    </div>
    <p>優化後預期: ${reportData.improvements.potential}/100</p>
    <div class="improvement-bar">
        <div class="improvement-fill" style="width: ${reportData.improvements.potential}%"></div>
    </div>

    <h2>優化建議</h2>
    ${reportData.suggestions.map((suggestion: any, index: number) => `
        <div class="suggestion priority-${suggestion.priority}">
            <h3>${index + 1}. ${suggestion.type.replace('_', ' ')} 優化 (${suggestion.priority.toUpperCase()})</h3>
            <p><strong>問題描述</strong>: ${expandPerformanceMetrics(suggestion.reason)}</p>
            <h4>目前狀況:</h4>
            <div class="code-block">${expandPerformanceMetrics(suggestion.current).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <h4>建議改善:</h4>
            <div class="code-block">${expandPerformanceMetrics(suggestion.suggested).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <h4>實施步驟:</h4>
            <ol>
                ${suggestion.implementation.map((step: string) => `<li>${step.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}
            </ol>
        </div>
    `).join('')}

    <h2>執行計劃</h2>
    ${reportData.executionPlan.map((phase: any, index: number) => `
        <div class="suggestion">
            <h3>階段 ${index + 1}: ${phase.phase}</h3>
            <p><strong>預計時間</strong>: ${phase.duration}</p>
            <h4>執行項目:</h4>
            <ul>
                ${phase.actions.map((action: string) => `<li>${action.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}
            </ul>
            <p><strong>預期成果</strong>: ${phase.expectedResults.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
    `).join('')}

    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280;">
        <p>報告生成時間: ${new Date().toLocaleString('zh-TW')}</p>
    </footer>
</body>
</html>`;
  };

  const generatePdfReport = (reportData: any, filename: string) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // 中文字體支持 (使用內建字體)
    pdf.setFont('helvetica');

    // 添加頁首
    const addHeader = () => {
      // 標題背景
      pdf.setFillColor(59, 130, 246); // blue-500
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      // 標題文字
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.text('GEO Optimization Analysis Report', margin, 25);
      
      // 副標題 - 顯示完整URL而不是網站標題
      pdf.setFontSize(12);
      const websiteUrl = reportData.websiteUrl || reportData.website;
      pdf.text(`Website: ${websiteUrl}`, margin, 32);
      pdf.text(`Generated: ${new Date(reportData.generatedAt).toLocaleDateString()}`, margin, 37);
      
      return 50; // 返回內容開始位置
    };

    // 添加分數卡片
    const addScoreCards = (y: number) => {
      const cardWidth = (contentWidth - 15) / 4; // 4個卡片，間隔5mm
      const cardHeight = 30;
      
      const scores = [
        { label: 'GEO Score', value: reportData.geoScore, color: [59, 130, 246] },
        { label: 'Technical', value: reportData.analysisDetails.technicalHealth, color: [34, 197, 94] },
        { label: 'Content', value: reportData.analysisDetails.contentQuality, color: [59, 130, 246] },
        { label: 'AI Visibility', value: reportData.analysisDetails.aiVisibility, color: [147, 51, 234] }
      ];

      scores.forEach((score, index) => {
        const x = margin + index * (cardWidth + 5);
        
        // 卡片背景
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');
        
        // 分數
        pdf.setTextColor(score.color[0], score.color[1], score.color[2]);
        pdf.setFontSize(20);
        pdf.text(`${score.value}`, x + cardWidth/2, y + 15, { align: 'center' });
        
        // 標籤
        pdf.setTextColor(75, 85, 99);
        pdf.setFontSize(10);
        pdf.text(score.label, x + cardWidth/2, y + 25, { align: 'center' });
      });

      return y + cardHeight + 15;
    };

    // 添加改善潛力圖表
    const addImprovementChart = (y: number) => {
      pdf.setTextColor(45, 55, 72);
      pdf.setFontSize(16);
      pdf.text('Improvement Potential', margin, y);
      y += 10;

      // 當前分數條
      pdf.setTextColor(75, 85, 99);
      pdf.setFontSize(10);
      pdf.text(`Current Score: ${reportData.improvements.current}/100`, margin, y);
      
      const barWidth = contentWidth * 0.7;
      const barHeight = 8;
      y += 5;
      
      // 背景條
      pdf.setFillColor(226, 232, 240);
      pdf.rect(margin, y, barWidth, barHeight, 'F');
      
      // 當前分數條
      const currentWidth = (reportData.improvements.current / 100) * barWidth;
      pdf.setFillColor(59, 130, 246);
      pdf.rect(margin, y, currentWidth, barHeight, 'F');
      
      y += 15;
      
      // 預期分數條
      pdf.setTextColor(75, 85, 99);
      pdf.text(`Expected After Optimization: ${reportData.improvements.potential}/100`, margin, y);
      y += 5;
      
      // 背景條
      pdf.setFillColor(226, 232, 240);
      pdf.rect(margin, y, barWidth, barHeight, 'F');
      
      // 預期分數條
      const potentialWidth = (reportData.improvements.potential / 100) * barWidth;
      pdf.setFillColor(34, 197, 94);
      pdf.rect(margin, y, potentialWidth, barHeight, 'F');
      
      return y + 20;
    };

    // 添加優化建議
    const addSuggestions = (y: number) => {
      pdf.setTextColor(45, 55, 72);
      pdf.setFontSize(16);
      pdf.text('Optimization Suggestions', margin, y);
      y += 15;

      reportData.suggestions.forEach((suggestion: any, index: number) => {
        // 計算需要的空間
        const estimatedHeight = 80 + (suggestion.implementation?.length || 0) * 4;
        
        // 檢查是否需要新頁面
        if (y + estimatedHeight > pageHeight - 20) {
          pdf.addPage();
          y = margin;
        }

        // 優先級顏色
        const priorityColors: { [key: string]: [number, number, number] } = {
          high: [239, 68, 68],
          medium: [245, 158, 11],
          low: [16, 185, 129]
        };

        let currentY = y;

        // 建議標題背景
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(margin, currentY, contentWidth, 12, 'FD');

        // 優先級指示條
        const priorityColor = priorityColors[suggestion.priority] || [75, 85, 99];
        pdf.setFillColor(...priorityColor);
        pdf.rect(margin, currentY, 3, 12, 'F');

        // 建議標題
        pdf.setTextColor(45, 55, 72);
        pdf.setFontSize(11);
        const title = `${index + 1}. ${suggestion.type.replace('_', ' ').toUpperCase()} (${suggestion.priority.toUpperCase()})`;
        pdf.text(title, margin + 8, currentY + 8);
        currentY += 15;

        // 問題描述
        pdf.setTextColor(75, 85, 99);
        pdf.setFontSize(9);
        pdf.text('Description:', margin + 3, currentY);
        currentY += 4;
        const descLines = pdf.splitTextToSize(expandPerformanceMetrics(suggestion.reason), contentWidth - 10);
        descLines.forEach((line: string, lineIndex: number) => {
          pdf.text(line, margin + 6, currentY);
          currentY += 4;
        });
        currentY += 2;

        // 當前狀況
        if (suggestion.current) {
          pdf.setTextColor(185, 28, 28);
          pdf.setFontSize(9);
          pdf.text('Current Issue:', margin + 3, currentY);
          currentY += 4;
          pdf.setTextColor(75, 85, 99);
          const currentLines = pdf.splitTextToSize(expandPerformanceMetrics(suggestion.current), contentWidth - 10);
          currentLines.slice(0, 4).forEach((line: string) => {
            pdf.text(line, margin + 6, currentY);
            currentY += 4;
          });
          currentY += 2;
        }

        // 建議改善
        if (suggestion.suggested) {
          pdf.setTextColor(34, 197, 94);
          pdf.setFontSize(9);
          pdf.text('Suggested Improvement:', margin + 3, currentY);
          currentY += 4;
          pdf.setTextColor(75, 85, 99);
          const suggestedLines = pdf.splitTextToSize(expandPerformanceMetrics(suggestion.suggested), contentWidth - 10);
          suggestedLines.slice(0, 4).forEach((line: string) => {
            pdf.text(line, margin + 6, currentY);
            currentY += 4;
          });
          currentY += 2;
        }

        // 實施步驟
        if (suggestion.implementation && suggestion.implementation.length > 0) {
          pdf.setTextColor(59, 130, 246);
          pdf.setFontSize(9);
          pdf.text('Implementation Steps:', margin + 3, currentY);
          currentY += 4;
          pdf.setTextColor(75, 85, 99);
          suggestion.implementation.forEach((step: string, stepIndex: number) => {
            const stepText = `${stepIndex + 1}. ${step}`;
            const stepLines = pdf.splitTextToSize(stepText, contentWidth - 12);
            stepLines.forEach((line: string) => {
              pdf.text(line, margin + 6, currentY);
              currentY += 4;
            });
          });
        }

        y = currentY + 8; // 增加間距
      });

      return y;
    };

    // 添加執行計劃
    const addExecutionPlan = (y: number) => {
      if (y > pageHeight - 60) {
        pdf.addPage();
        y = margin;
      }

      pdf.setTextColor(45, 55, 72);
      pdf.setFontSize(16);
      pdf.text('Execution Plan', margin, y);
      y += 15;

      reportData.executionPlan.forEach((phase: any, index: number) => {
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = margin;
        }

        // 階段標題
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin, y, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text(`Phase ${index + 1}: ${phase.phase} (${phase.duration})`, margin + 3, y + 6);

        y += 12;

        // 執行項目
        pdf.setTextColor(75, 85, 99);
        pdf.setFontSize(9);
        phase.actions.slice(0, 3).forEach((action: string, actionIndex: number) => {
          const actionText = `• ${action}`;
          const lines = pdf.splitTextToSize(actionText, contentWidth - 8);
          pdf.text(lines[0] || '', margin + 4, y);
          y += 4;
        });

        y += 8;
      });

      return y;
    };

    // 添加頁腳
    const addFooter = () => {
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        pdf.text('Generated by GEO Master', margin, pageHeight - 10);
      }
    };

    // 生成 PDF
    yPosition = addHeader();
    yPosition = addScoreCards(yPosition);
    yPosition = addImprovementChart(yPosition);
    yPosition = addSuggestions(yPosition);
    addExecutionPlan(yPosition);
    addFooter();

    // 保存 PDF
    pdf.save(filename);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <p className="text-muted-foreground mt-1">{data.websiteUrl || data.websiteInfo.url || data.websiteInfo.title}</p>
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  下載報告
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadReport('json')}>
                  <FileText className="w-4 h-4 mr-2" />
                  JSON 格式
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadReport('markdown')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Markdown 格式
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadReport('pdf')}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF 格式
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                        <CardDescription>{expandPerformanceMetrics(suggestion.reason)}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">目前狀況:</h4>
                          <div className="bg-destructive/10 border-destructive/20 p-3 rounded border">
                            <p className="text-sm">{expandPerformanceMetrics(suggestion.current)}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">建議改善:</h4>
                          <div className="bg-green-500/10 border-green-500/20 p-3 rounded border relative">
                            <pre className="text-sm whitespace-pre-wrap font-mono">{expandPerformanceMetrics(suggestion.suggested)}</pre>
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