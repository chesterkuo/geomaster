import { Request, Response } from 'express';
import { 
  Website, 
  Organization, 
  Content, 
  Scan, 
  AnalyticsSnapshot,
  KeywordRanking,
  AITrackingResult,
  MetricsSnapshot,
  CompetitorBenchmark,
  KeywordResearch
} from '../models';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import { Op } from 'sequelize';
import analyticsService from '../services/analyticsService';
import type { PlatformType } from '../models/KeywordRanking';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

interface WebsiteAnalyticsResponse {
  website: any;
  analytics: {
    overview: {
      aiVisibilityScore: number;
      totalMentions: number;
      averageRanking: number;
      contentMetrics: {
        totalContent: number;
        avgGeoScore: number;
        optimizedContent: number;
        avgWordCount: number;
      };
      scanMetrics: {
        totalScans: number;
        completedScans: number;
        failedScans: number;
        lastScanDate: Date | null;
      };
    };
    platformPerformance: Record<PlatformType, {
      avgVisibility: number;
      avgRanking: number;
      totalMentions: number;
      totalKeywords: number;
    }>;
    trends: {
      visibilityTrend: 'up' | 'down' | 'stable';
      changePercentage: number;
      chartData: Array<{
        date: Date;
        aiVisibilityScore: number;
        totalMentions: number;
        averageRanking: number;
      }>;
    };
    topKeywords: Array<{
      keyword: string;
      ranking: number;
      visibilityScore: number;
      platform: PlatformType;
    }>;
    competitorComparison: {
      betterThan: number;
      totalCompetitors: number;
      marketPosition: string;
      topCompetitors: Array<{
        name: string;
        domain: string;
        visibilityScore: number;
      }>;
    };
    recentActivity: Array<{
      type: 'mention' | 'ranking_change' | 'content_scan';
      platform?: PlatformType;
      description: string;
      date: Date;
      impact: 'positive' | 'negative' | 'neutral';
    }>;
    insights: {
      summary: string[];
      recommendations: string[];
      alerts: Array<{
        type: 'warning' | 'info' | 'success';
        message: string;
      }>;
    };
  };
}

interface PlatformAnalyticsData {
  [key: string]: {
    avgVisibility: number;
    avgRanking: number;
    totalMentions: number;
    totalKeywords: number;
  };
}

type AnalyticsServicePlatformData = Record<string, {
  avgVisibility: number;
  avgRanking: number;
  totalMentions: number;
  totalKeywords: number;
}>;

export class WebsiteController {
  public getWebsites = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const organizationId = req.organization.id;

    const whereCondition: any = {
      organizationId
    };

    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { url: { [Op.like]: `%${search}%` } },
        { domain: { [Op.like]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      whereCondition.isActive = isActive === 'true';
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: websites } = await Website.findAndCountAll({
      where: whereCondition,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Content,
          as: 'contents',
          attributes: ['id'],
          required: false
        },
        {
          model: Scan,
          as: 'scans',
          attributes: ['id', 'status', 'completedAt'],
          limit: 1,
          order: [['createdAt', 'DESC']],
          required: false
        }
      ]
    });

    const websitesWithStats = websites.map(website => {
      const websiteData = website.toJSON();
      return {
        ...websiteData,
        contentCount: 0, // TODO: Add contents association after defining Sequelize associations
        lastScanStatus: null, // TODO: Add scans association after defining Sequelize associations
        lastScanDate: null // TODO: Add scans association after defining Sequelize associations
      };
    });

    res.json({
      success: true,
      data: {
        websites: websitesWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit))
        }
      }
    });
  });

  public getWebsite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const organizationId = req.organization.id;

    const website = await Website.findOne({
      where: { id, organizationId },
      include: [
        {
          model: Content,
          as: 'contents',
          attributes: ['id', 'url', 'title', 'geoScore', 'optimizationStatus'],
          limit: 10,
          order: [['geoScore', 'DESC']]
        },
        {
          model: Scan,
          as: 'scans',
          attributes: ['id', 'status', 'progress', 'completedAt', 'scanType'],
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    // Calculate metrics
    const contents = website.get('contents') as any[];
    const scans = website.get('scans') as any[];

    const metrics = {
      totalContent: contents.length,
      averageGeoScore: contents.length > 0 
        ? contents.reduce((sum, content) => sum + (content.geoScore || 0), 0) / contents.length
        : 0,
      optimizedContent: contents.filter(c => c.optimizationStatus === 'optimized').length,
      lastScanDate: scans[0]?.completedAt || null,
      totalScans: scans.length
    };

    res.json({
      success: true,
      data: {
        website: website.toJSON(),
        metrics
      }
    });
  });

  public createWebsite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { url, name, description, scanFrequency } = req.body;
    const organizationId = req.organization.id;

    // Check if organization can add more websites
    const websiteCount = await Website.count({
      where: { organizationId, isActive: true }
    });

    if (req.organization.maxWebsites !== -1 && websiteCount >= req.organization.maxWebsites) {
      throw new AppError('Maximum websites limit reached for your plan', 403);
    }

    // Check if website already exists for this organization
    const existingWebsite = await Website.findOne({
      where: { url, organizationId }
    });

    if (existingWebsite) {
      throw new AppError('Website already exists in this organization', 409);
    }

    // Extract domain from URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    const website = await Website.create({
      organizationId,
      url,
      domain,
      name,
      description,
      scanFrequency: scanFrequency || 'weekly'
    });

    res.status(201).json({
      success: true,
      data: {
        website: website.toJSON()
      }
    });
  });

  public updateWebsite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description, scanFrequency, isActive } = req.body;
    const organizationId = req.organization.id;

    const website = await Website.findOne({
      where: { id, organizationId }
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    if (name !== undefined) website.name = name;
    if (description !== undefined) website.description = description;
    if (scanFrequency !== undefined) website.scanFrequency = scanFrequency;
    if (isActive !== undefined) website.isActive = isActive;

    await website.save();

    res.json({
      success: true,
      data: {
        website: website.toJSON()
      }
    });
  });

  public deleteWebsite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const organizationId = req.organization.id;

    const website = await Website.findOne({
      where: { id, organizationId }
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    await website.destroy();

    res.json({
      success: true,
      message: 'Website deleted successfully'
    });
  });

  public getWebsiteContent = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { page = 1, limit = 10, search, optimizationStatus } = req.query;
    const organizationId = req.organization.id;

    // Verify website belongs to organization
    const website = await Website.findOne({
      where: { id, organizationId }
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    const whereCondition: any = {
      websiteId: id
    };

    if (search) {
      whereCondition[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { url: { [Op.like]: `%${search}%` } }
      ];
    }

    if (optimizationStatus) {
      whereCondition.optimizationStatus = optimizationStatus;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: contents } = await Content.findAndCountAll({
      where: whereCondition,
      limit: Number(limit),
      offset,
      order: [['geoScore', 'DESC']],
      attributes: [
        'id', 'url', 'title', 'metaDescription', 'contentType',
        'geoScore', 'wordCount', 'readingTime', 'hasSchema',
        'optimizationStatus', 'lastUpdated', 'createdAt'
      ]
    });

    res.json({
      success: true,
      data: {
        contents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit))
        }
      }
    });
  });

  public getWebsiteAnalytics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { period = '30' } = req.query;
    const organizationId = req.organization.id;
    const days = parseInt(period as string) || 30;

    // Verify website belongs to organization
    const website = await Website.findOne({
      where: { id, organizationId }
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    try {
      // Execute analytics queries in parallel for performance
      const [
        latestSnapshot,
        trendData,
        platformPerformance,
        contentStats,
        scanStats,
        topKeywords,
        competitorSummary,
        recentActivity,
        insights
      ] = await Promise.all([
        // Get or generate latest analytics snapshot
        analyticsService.getDashboardData(organizationId, id),
        
        // Get trend data for charts
        analyticsService.getTrendData(organizationId, id, days),
        
        // Get platform performance breakdown
        KeywordRanking.getPlatformPerformance(id),
        
        // Get content metrics
        this.getContentMetrics(id),
        
        // Get scan metrics
        this.getScanMetrics(id),
        
        // Get top performing keywords
        this.getTopKeywords(organizationId, id),
        
        // Get competitor summary
        analyticsService.getCompetitorSummary(organizationId),
        
        // Get recent activity
        this.getRecentActivity(organizationId, id, 7),
        
        // Get performance insights
        analyticsService.getPerformanceInsights(organizationId, id)
      ]);

      // Build comprehensive analytics response
      const analyticsResponse: WebsiteAnalyticsResponse = {
        website: website.toJSON(),
        analytics: {
          overview: {
            aiVisibilityScore: latestSnapshot.metrics.aiVisibilityScore || 0,
            totalMentions: latestSnapshot.metrics.totalMentions || 0,
            averageRanking: latestSnapshot.metrics.averageRanking || 0,
            contentMetrics: contentStats,
            scanMetrics: scanStats
          },
          platformPerformance: this.formatPlatformPerformanceArray(platformPerformance),
          trends: {
            visibilityTrend: latestSnapshot.metrics.trendData?.visibilityTrend || 'stable',
            changePercentage: latestSnapshot.metrics.trendData?.changePercentage || 0,
            chartData: trendData
          },
          topKeywords,
          competitorComparison: {
            betterThan: latestSnapshot.metrics.competitorComparison?.betterThan || 0,
            totalCompetitors: latestSnapshot.metrics.competitorComparison?.totalCompetitors || 0,
            marketPosition: latestSnapshot.metrics.competitorComparison?.marketPosition || 'unknown',
            topCompetitors: competitorSummary.slice(0, 5).map(c => ({
              name: c.name,
              domain: c.domain,
              visibilityScore: c.visibilityScore
            }))
          },
          recentActivity,
          insights: {
            summary: insights.insights || [],
            recommendations: insights.recommendations || [],
            alerts: this.generateAlerts(latestSnapshot.metrics, insights.summary)
          }
        }
      };

      res.json({
        success: true,
        data: analyticsResponse
      });
    } catch (error) {
      console.error('Error fetching website analytics:', error);
      throw new AppError('Failed to fetch analytics data', 500);
    }
  });

  public scanInit = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { url, name } = req.body;
    const organizationId = req.organization.id;

    // Check if website already exists for this organization
    let website = await Website.findOne({
      where: { url, organizationId }
    });

    if (!website) {
      // Check if organization can add more websites
      const websiteCount = await Website.count({
        where: { organizationId, isActive: true }
      });

      if (req.organization.maxWebsites !== -1 && websiteCount >= req.organization.maxWebsites) {
        throw new AppError('Maximum websites limit reached for your plan', 403);
      }

      // Extract domain from URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Create new website
      website = await Website.create({
        organizationId,
        url,
        domain,
        name: name || domain,
        scanFrequency: 'weekly'
      });
    }

    res.json({
      success: true,
      data: {
        website: website.toJSON()
      }
    });
  });

  // Helper methods for analytics data collection
  private async getContentMetrics(websiteId: string) {
    const contentStats = await Content.findAll({
      where: { websiteId },
      attributes: [
        [Website.sequelize!.fn('COUNT', '*'), 'totalContent'],
        [Website.sequelize!.fn('AVG', Website.sequelize!.col('geo_score')), 'avgGeoScore'],
        [Website.sequelize!.fn('SUM', Website.sequelize!.literal("CASE WHEN optimization_status = 'optimized' THEN 1 ELSE 0 END")), 'optimizedContent'],
        [Website.sequelize!.fn('AVG', Website.sequelize!.col('word_count')), 'avgWordCount']
      ],
      raw: true
    });

    const stats = contentStats[0] as any;
    return {
      totalContent: parseInt(stats.totalContent) || 0,
      avgGeoScore: parseFloat(stats.avgGeoScore) || 0,
      optimizedContent: parseInt(stats.optimizedContent) || 0,
      avgWordCount: parseFloat(stats.avgWordCount) || 0
    };
  }

  private async getScanMetrics(websiteId: string) {
    const scanStats = await Scan.findAll({
      where: { websiteId },
      attributes: [
        [Website.sequelize!.fn('COUNT', '*'), 'totalScans'],
        [Website.sequelize!.fn('COUNT', Website.sequelize!.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completedScans'],
        [Website.sequelize!.fn('COUNT', Website.sequelize!.literal("CASE WHEN status = 'failed' THEN 1 END")), 'failedScans'],
        [Website.sequelize!.fn('MAX', Website.sequelize!.col('completed_at')), 'lastScanDate']
      ],
      raw: true
    });

    const stats = scanStats[0] as any;
    return {
      totalScans: parseInt(stats.totalScans) || 0,
      completedScans: parseInt(stats.completedScans) || 0,
      failedScans: parseInt(stats.failedScans) || 0,
      lastScanDate: stats.lastScanDate ? new Date(stats.lastScanDate) : null
    };
  }

  private async getTopKeywords(organizationId: string, websiteId: string, limit: number = 10) {
    const rankings = await KeywordRanking.findAll({
      where: { organizationId, websiteId },
      include: [{
        model: KeywordResearch,
        as: 'keyword',
        attributes: ['keyword']
      }],
      order: [
        ['visibilityScore', 'DESC'],
        ['rankingPosition', 'ASC']
      ],
      limit
    });

    return rankings.map(ranking => ({
      keyword: (ranking as any).keyword?.keyword || 'Unknown',
      ranking: ranking.rankingPosition,
      visibilityScore: ranking.visibilityScore,
      platform: ranking.platform
    }));
  }

  private async getRecentActivity(organizationId: string, websiteId: string, days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get recent AI tracking results
    const recentMentions = await AITrackingResult.findAll({
      where: { 
        websiteId,
        trackedAt: { [Op.gte]: since }
      },
      order: [['trackedAt', 'DESC']],
      limit: 20
    });

    // Get recent ranking changes
    const recentRankings = await KeywordRanking.findAll({
      where: { 
        organizationId,
        websiteId,
        trackedAt: { [Op.gte]: since }
      },
      include: [{
        model: KeywordResearch,
        as: 'keyword',
        attributes: ['keyword']
      }],
      order: [['trackedAt', 'DESC']],
      limit: 15
    });

    // Get recent scans
    const recentScans = await Scan.findAll({
      where: { 
        websiteId,
        createdAt: { [Op.gte]: since }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const activities: Array<{
      type: 'mention' | 'ranking_change' | 'content_scan';
      platform?: PlatformType;
      description: string;
      date: Date;
      impact: 'positive' | 'negative' | 'neutral';
    }> = [];

    // Process mentions
    recentMentions.forEach(mention => {
      activities.push({
        type: 'mention',
        platform: mention.platform as PlatformType,
        description: mention.isCited 
          ? `Cited in ${mention.platform} response (position ${mention.citationPosition || 'unknown'})`
          : `Mentioned in ${mention.platform} response`,
        date: mention.trackedAt,
        impact: mention.isCited ? 'positive' : (mention.isMentioned ? 'neutral' : 'negative')
      });
    });

    // Process ranking changes
    recentRankings.forEach(ranking => {
      activities.push({
        type: 'ranking_change',
        platform: ranking.platform,
        description: `Keyword "${(ranking as any).keyword?.keyword}" ranked #${ranking.rankingPosition} on ${ranking.platform}`,
        date: ranking.trackedAt,
        impact: ranking.visibilityScore > 60 ? 'positive' : (ranking.visibilityScore > 30 ? 'neutral' : 'negative')
      });
    });

    // Process scans
    recentScans.forEach(scan => {
      activities.push({
        type: 'content_scan',
        description: `${scan.scanType} scan ${scan.status}`,
        date: scan.createdAt || new Date(),
        impact: scan.status === 'completed' ? 'positive' : (scan.status === 'failed' ? 'negative' : 'neutral')
      });
    });

    // Sort by date and return most recent
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20);
  }

  private formatPlatformPerformance(platformData: AnalyticsServicePlatformData): Record<PlatformType, any> {
    const formatted: Record<string, any> = {};
    
    Object.entries(platformData).forEach(([platform, data]) => {
      formatted[platform] = {
        avgVisibility: Math.round(data.avgVisibility * 100) / 100,
        avgRanking: Math.round(data.avgRanking * 100) / 100,
        totalMentions: data.totalMentions,
        totalKeywords: data.totalKeywords
      };
    });

    return formatted as Record<PlatformType, any>;
  }

  private formatPlatformPerformanceArray(platformArray: Array<{
    platform: PlatformType;
    avgVisibility: number;
    avgRanking: number;
    totalMentions: number;
    totalKeywords: number;
  }>): Record<PlatformType, any> {
    const formatted: Record<string, any> = {};
    
    platformArray.forEach(data => {
      formatted[data.platform] = {
        avgVisibility: Math.round(data.avgVisibility * 100) / 100,
        avgRanking: Math.round(data.avgRanking * 100) / 100,
        totalMentions: data.totalMentions,
        totalKeywords: data.totalKeywords
      };
    });

    return formatted as Record<PlatformType, any>;
  }

  private generateAlerts(metrics: any, insights: any) {
    const alerts: Array<{
      type: 'warning' | 'info' | 'success';
      message: string;
    }> = [];

    // Visibility score alerts
    if (metrics.aiVisibilityScore < 30) {
      alerts.push({
        type: 'warning',
        message: 'Your AI visibility score is critically low. Consider optimizing your content for AI platforms.'
      });
    } else if (metrics.aiVisibilityScore > 80) {
      alerts.push({
        type: 'success',
        message: 'Excellent AI visibility score! Your content is performing well across platforms.'
      });
    }

    // Trend alerts
    if (metrics.trendData?.visibilityTrend === 'down' && metrics.trendData?.changePercentage < -10) {
      alerts.push({
        type: 'warning',
        message: `Visibility has declined by ${Math.abs(metrics.trendData.changePercentage)}% recently.`
      });
    } else if (metrics.trendData?.visibilityTrend === 'up' && metrics.trendData?.changePercentage > 15) {
      alerts.push({
        type: 'success',
        message: `Great progress! Visibility has improved by ${metrics.trendData.changePercentage}%.`
      });
    }

    // Mentions alerts
    if (metrics.totalMentions === 0) {
      alerts.push({
        type: 'info',
        message: 'No AI mentions detected yet. Start tracking keywords to improve visibility.'
      });
    }

    return alerts;
  }

  // New analytics endpoints
  public getWebsiteTrends = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { days = '30' } = req.query;
    const organizationId = req.organization.id;
    const period = parseInt(days as string) || 30;

    // Verify website belongs to organization
    const website = await Website.findOne({
      where: { id, organizationId }
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    const trendData = await analyticsService.getTrendData(organizationId, id, period);

    res.json({
      success: true,
      data: {
        trends: trendData,
        period: period,
        website: {
          id: website.id,
          name: website.name,
          domain: website.domain
        }
      }
    });
  });

  public getWebsiteKeywordPerformance = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { platform, limit = '20' } = req.query;
    const organizationId = req.organization.id;
    const keywordLimit = parseInt(limit as string) || 20;

    // Verify website belongs to organization
    const website = await Website.findOne({
      where: { id, organizationId }
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    const topKeywords = await KeywordRanking.getTopRankingKeywords(
      id, 
      platform as PlatformType, 
      keywordLimit
    );

    const platformPerformance = await KeywordRanking.getPlatformPerformance(id);

    res.json({
      success: true,
      data: {
        topKeywords: topKeywords.map(ranking => ({
          keyword: (ranking as any).keyword?.keyword || 'Unknown',
          platform: ranking.platform,
          ranking: ranking.rankingPosition,
          visibilityScore: ranking.visibilityScore,
          mentions: ranking.mentionsCount,
          tier: ranking.getRankingTier(),
          lastTracked: ranking.trackedAt
        })),
        platformSummary: platformPerformance,
        website: {
          id: website.id,
          name: website.name,
          domain: website.domain
        }
      }
    });
  });

  public getWebsiteInsights = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const organizationId = req.organization.id;

    // Verify website belongs to organization
    const website = await Website.findOne({
      where: { id, organizationId }
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    const insights = await analyticsService.getPerformanceInsights(organizationId, id);

    res.json({
      success: true,
      data: {
        insights: insights.insights,
        recommendations: insights.recommendations,
        summary: insights.summary,
        website: {
          id: website.id,
          name: website.name,
          domain: website.domain
        }
      }
    });
  });
}