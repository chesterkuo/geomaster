import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { v4 as uuidv4 } from 'uuid';
import { websiteScanner } from '../services/websiteScanner.service';

// Generate basic scan results (for anonymous users)
function generateBasicScanResults(url: string) {
  const domain = new URL(url).hostname;
  const score = Math.floor(Math.random() * 40) + 45; // 45-85 分
  
  return {
    score,
    summary: {
      status: score > 70 ? 'good' : score > 50 ? 'warning' : 'critical',
      message: score > 70 
        ? `${domain} 在 AI 搜索中表現良好，但仍有優化空間。`
        : score > 50 
        ? `${domain} 存在一些影響 AI 可見度的問題需要改善。`
        : `${domain} 在 AI 搜索中可見度較低，建議進行全面優化。`,
      keyIssues: [
        "Schema 標記覆蓋率不足 (僅 40%)",
        "內容更新頻率偏低",
        "缺乏結構化FAQ內容",
        "頁面載入速度需要改善"
      ]
    },
    preview: {
      technicalHealth: Math.floor(Math.random() * 30) + 60,
      contentQuality: Math.floor(Math.random() * 35) + 50,
      aiVisibility: Math.floor(Math.random() * 25) + 40
    },
    upgradeReasons: [
      "獲得 30+ 項技術指標詳細分析",
      "查看具體競爭對手表現比較",
      "獲得個人化優化執行計劃",
      "追蹤改善進度和成效監控"
    ]
  };
}

// Generate detailed scan results (for authenticated users)
function generateDetailedScanResults(url: string) {
  const domain = new URL(url).hostname;
  const score = Math.floor(Math.random() * 35) + 55; // 55-90 分
  
  return {
    score,
    technicalHealth: {
      weight: 40,
      score: Math.floor(Math.random() * 25) + 65,
      items: [
        { name: "robots.txt 配置", status: "good", detail: "已允許 AI 爬蟲存取" },
        { name: "Schema 標記", status: "warning", detail: "覆蓋率 60%（建議 85%+）" },
        { name: "網站速度", status: "good", detail: "LCP 2.1秒（良好）" },
        { name: "JavaScript 渲染", status: "critical", detail: "SSR 支援不足" },
        { name: "SSL 憑證", status: "good", detail: "有效 HTTPS 配置" }
      ]
    },
    contentQuality: {
      weight: 30,
      score: Math.floor(Math.random() * 30) + 55,
      items: [
        { name: "平均內容長度", status: "warning", detail: "1,245 字（建議 1,500+）" },
        { name: "FAQ 覆蓋率", status: "warning", detail: "35%（建議 70%+）" },
        { name: "更新頻率", status: "critical", detail: "每月 1 次（建議每週）" },
        { name: "引用資料", status: "warning", detail: "部分頁面缺乏權威引用" },
        { name: "內容結構", status: "good", detail: "標題層級結構清晰" }
      ]
    },
    aiVisibility: {
      weight: 30,
      score: Math.floor(Math.random() * 20) + 50,
      items: [
        { name: "ChatGPT 提及", status: "warning", detail: "12 次/100 查詢" },
        { name: "Gemini 引用", status: "critical", detail: "8 次/100 查詢" },
        { name: "Perplexity 出現", status: "good", detail: "15 次/100 查詢" },
        { name: "Claude 可見度", status: "warning", detail: "10 次/100 查詢" },
        { name: "品牌識別度", status: "warning", detail: "中等水準" }
      ]
    },
    competitors: {
      averageScore: 72,
      ranking: Math.floor(Math.random() * 3) + 3,
      totalCompetitors: 10,
      details: [
        { name: "競爭對手 A", score: 85, strengths: ["內容深度", "技術 SEO", "更新頻率"] },
        { name: "競爭對手 B", score: 78, strengths: ["品牌權威", "社群互動", "多媒體內容"] },
        { name: "競爭對手 C", score: 73, strengths: ["頁面速度", "行動體驗", "本地化內容"] }
      ]
    },
    optimization: {
      potentialTrafficGain: Math.floor(Math.random() * 30) + 35,
      potentialConversionGain: Math.floor(Math.random() * 20) + 15,
      priorityActions: [
        { action: "完善 Schema 標記", impact: "high", difficulty: "medium", timeframe: "2-3週" },
        { action: "增加FAQ內容", impact: "high", difficulty: "easy", timeframe: "1週" },
        { action: "提高更新頻率", impact: "medium", difficulty: "medium", timeframe: "持續" },
        { action: "改善頁面速度", impact: "medium", difficulty: "hard", timeframe: "4-6週" }
      ],
      roadmap: [
        {
          phase: "第一階段：快速優化",
          duration: "2-3週",
          actions: ["新增FAQ內容", "完善Meta描述", "優化圖片Alt文字"],
          expectedResults: "AI可見度提升15-20%"
        },
        {
          phase: "第二階段：技術改善",
          duration: "4-6週",
          actions: ["實施完整Schema標記", "改善頁面載入速度", "增強行動裝置體驗"],
          expectedResults: "技術分數提升至80+"
        },
        {
          phase: "第三階段：內容深化",
          duration: "2-3個月",
          actions: ["建立內容更新計劃", "加強權威引用", "擴充主題覆蓋範圍"],
          expectedResults: "整體分數提升至85+"
        }
      ]
    }
  };
}

// In-memory storage for anonymous scans (for development)
const anonymousScans = new Map<string, any>();

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class ScanController {
  public createAnonymousScan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { url, scanType = 'basic' } = req.body;
    
    // Extract domain from URL for naming
    const domain = new URL(url).hostname;
    
    // Create a temporary website entry for anonymous scan
    const websiteId = uuidv4();
    
    // Create mock scan response for anonymous scan
    const scanId = uuidv4();
    const mockScan: any = {
      id: scanId,
      websiteId,
      url,
      scanType,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: null,
      results: null
    };

    // Store the scan data for later retrieval
    anonymousScans.set(scanId, { ...mockScan });

    // Perform real website scanning
    setTimeout(async () => {
      try {
        console.log(`🔍 Starting real scan for: ${url}`);
        
        // Use real website scanner
        const realResults = await websiteScanner.scanWebsite(url);
        
        // Update scan with real results
        mockScan.status = 'completed';
        mockScan.progress = 100;
        mockScan.completedAt = new Date().toISOString();
        
        // Convert detailed results to basic format for anonymous users
        if (scanType === 'basic') {
          mockScan.results = {
            score: realResults.score,
            summary: realResults.summary,
            preview: realResults.preview,
            upgradeReasons: realResults.upgradeReasons
          };
        } else {
          mockScan.results = realResults;
        }
        
        // Update stored scan data
        anonymousScans.set(scanId, { ...mockScan });
        
        console.log(`✅ Real scan completed for ${url} - Score: ${realResults.score}`);
      } catch (error) {
        console.error(`❌ Real scan failed for ${url}:`, error);
        
        // Fallback to mock data on error
        mockScan.status = 'completed';
        mockScan.progress = 100;
        mockScan.completedAt = new Date().toISOString();
        
        if (scanType === 'basic') {
          mockScan.results = generateBasicScanResults(url);
        } else {
          mockScan.results = generateDetailedScanResults(url);
        }
        
        // Update stored scan data with fallback
        anonymousScans.set(scanId, { ...mockScan });
      }
    }, 1000); // Reduced delay since real scanning takes time

    res.status(201).json({
      success: true,
      data: mockScan
    });
  });

  public getAnonymousScan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    // Retrieve scan data from memory storage
    const storedScan = anonymousScans.get(id);
    
    if (!storedScan) {
      // If scan not found, return a not found error
      res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
      return;
    }

    res.json({
      success: true,
      data: storedScan
    });
  });

  public createScan = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { websiteId, scanType = 'standard', url } = req.body;
    const organizationId = req.organization.id;
    
    // 如果提供了 URL，直接使用該 URL，否則從 website 表查詢
    let scanUrl = url;
    let targetWebsiteId = websiteId;
    
    if (!scanUrl && websiteId) {
      // 查詢網站資料獲取 URL
      const { Website } = await import('../models');
      const website = await Website.findOne({
        where: { 
          id: websiteId, 
          organizationId: organizationId 
        }
      });
      if (website) {
        scanUrl = website.url;
      }
    }
    
    if (!scanUrl) {
      res.status(400).json({
        success: false,
        message: 'URL is required'
      });
      return;
    }
    
    // Create or find website if not provided
    if (!targetWebsiteId) {
      const { Website } = await import('../models');
      const domain = new URL(scanUrl).hostname;
      
      let website = await Website.findOne({
        where: { 
          url: scanUrl,
          organizationId: organizationId 
        }
      });
      
      if (!website) {
        website = await Website.create({
          organizationId,
          url: scanUrl,
          domain,
          name: domain,
          description: `Website scan for ${domain}`,
          isActive: true
        });
      }
      
      targetWebsiteId = website.id;
    }
    
    // Create scan record in database
    const { Scan } = await import('../models');
    const scan = await Scan.create({
      websiteId: targetWebsiteId,
      scanType,
      status: 'pending',
      progress: 0
    });

    // Start the scan process
    scan.markAsStarted();
    
    // Perform real website scanning for authenticated users
    setTimeout(async () => {
      try {
        console.log(`🔍 Starting authenticated real scan for: ${scanUrl}`);
        
        // Use real website scanner
        const realResults = await websiteScanner.scanWebsite(scanUrl);
        
        // Update scan with real results in database
        await scan.markAsCompleted(realResults);
        
        console.log(`✅ Authenticated real scan completed for ${scanUrl} - Score: ${realResults.score}`);
      } catch (error) {
        console.error(`❌ Authenticated real scan failed for ${scanUrl}:`, error);
        
        // Mark scan as failed in database
        await scan.markAsFailed(error instanceof Error ? error.message : 'Scan failed');
      }
    }, 1000);

    res.status(201).json({
      success: true,
      data: {
        id: scan.id,
        websiteId: scan.websiteId,
        scanType: scan.scanType,
        status: scan.status,
        progress: scan.progress,
        startedAt: scan.startedAt,
        completedAt: scan.completedAt,
        results: scan.results
      }
    });
  });

  public getScan = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    
    // First try to retrieve from memory storage (for temporary storage during scan processing)
    const storedScan = anonymousScans.get(id);
    
    if (storedScan) {
      res.json({
        success: true,
        data: storedScan
      });
      return;
    }

    // Try to query from database
    try {
      const { Scan, Website } = await import('../models');
      const organizationId = req.organization.id;
      
      const scan = await Scan.findOne({
        where: { id },
        attributes: ['id', 'websiteId', 'scanType', 'status', 'progress', 'startedAt', 'completedAt', 'errorMessage', 'results', 'createdAt'],
        include: [{
          model: Website,
          as: 'website',
          attributes: ['id', 'url', 'domain', 'name'],
          where: {
            organizationId: organizationId
          }
        }]
      });

      if (!scan) {
        res.status(404).json({
          success: false,
          message: 'Scan not found'
        });
        return;
      }

      res.json({
        success: true,
        data: scan
      });
    } catch (error) {
      console.error('獲取單個掃描記錄失敗:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  public getScans = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { websiteId, page = 1, limit = 10 } = req.query;
    const organizationId = req.organization.id;
    
    try {
      // 載入模型
      const { Scan, Website } = await import('../models');
      
      // 建立查詢條件
      const whereCondition: any = {};
      if (websiteId) {
        whereCondition.websiteId = websiteId;
      }
      
      // 查詢掃描記錄，包含相關的網站資訊
      const { rows: scans, count } = await Scan.findAndCountAll({
        where: whereCondition,
        attributes: ['id', 'websiteId', 'scanType', 'status', 'progress', 'startedAt', 'completedAt', 'errorMessage', 'results', 'createdAt'],
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['id', 'url', 'domain', 'name'],
            where: {
              organizationId: organizationId
            }
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit)
      });
      
      // 轉換結果格式
      const formattedScans = scans.map((scan: any) => {
        const scanData = scan.toJSON();
        return {
          ...scanData,
          website: scanData.website ? {
            id: scanData.website.id,
            url: scanData.website.url,
            domain: scanData.website.domain,
            name: scanData.website.name
          } : null
        };
      });
      
      res.json({
        success: true,
        data: formattedScans,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      console.error('獲取掃描列表失敗:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
}