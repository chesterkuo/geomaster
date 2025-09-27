import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { asyncHandler } from '../middlewares/error.middleware';
import AITrackingResult from '../models/AITrackingResult';
import Website from '../models/Website';
import KeywordRanking, { PlatformType } from '../models/KeywordRanking';
import sequelize from '../config/database';
import { AI_PLATFORMS } from '../config/constants';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

// TypeScript interfaces for API responses
interface MentionData {
  id: string;
  platform: string;
  query: string;
  mention: string;
  url: string;
  websiteName: string;
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  isCited: boolean;
  citationPosition: number | null;
}

interface MentionsResponse {
  mentions: MentionData[];
  summary: {
    total: number;
    byPlatform: Record<string, number>;
    bySentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface TrendData {
  date: string;
  chatgpt: number;
  perplexity: number;
  gemini: number;
  claude: number;
}

interface VisibilityTrendsResponse {
  trends: TrendData[];
  summary: {
    averageVisibility: number;
    growth: number;
    topPerformingPlatform: string;
    totalMentions: number;
    totalQueries: number;
  };
}

export class TrackingController {

  public getMentions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { websiteId, platform, dateRange, page = 1, limit = 10 } = req.query;
    const organizationId = req.organization?.id;
    
    if (!organizationId) {
      res.status(401).json({
        success: false,
        message: 'Organization ID is required'
      });
      return;
    }

    try {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      // Build the where clause for filtering
      const whereClause: any = {};
      
      // Always filter by organization through website relationship
      const websiteWhere: any = {
        organizationId
      };
      
      if (websiteId && typeof websiteId === 'string') {
        websiteWhere.id = websiteId;
        whereClause.websiteId = websiteId;
      }
      
      if (platform && typeof platform === 'string') {
        whereClause.platform = platform;
      }
      
      // Add date range filtering if provided
      if (dateRange && typeof dateRange === 'string') {
        const days = parseInt(dateRange.replace('d', ''));
        if (!isNaN(days)) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          whereClause.trackedAt = {
            [Op.gte]: startDate
          };
        }
      }
      
      // Only include mentions that were actually found
      whereClause.isMentioned = true;

      // Execute parallel queries for better performance
      const [trackingResults, totalCount] = await Promise.all([
        AITrackingResult.findAll({
          where: whereClause,
          include: [{
            model: Website,
            as: 'website',
            where: websiteWhere,
            attributes: ['name', 'url', 'domain']
          }],
          order: [['trackedAt', 'DESC']],
          limit: limitNum,
          offset
        }),
        AITrackingResult.count({
          where: whereClause,
          include: [{
            model: Website,
            as: 'website',
            where: websiteWhere
          }]
        })
      ]);

      // Transform the data to match the expected API format
      const mentions: MentionData[] = trackingResults.map(result => {
        // Determine sentiment based on mention status and citation position
        // Since citation detection isn't working properly, use position as indicator
        let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';

        if (result.isMentioned) {
          // If mentioned and has a good position (1-50), consider positive
          if (result.citationPosition && result.citationPosition <= 50) {
            sentiment = 'positive';
          }
          // If mentioned but position is poor (>100), consider neutral
          else if (result.citationPosition && result.citationPosition > 100) {
            sentiment = 'neutral';
          }
          // If mentioned with moderate position (51-100), consider neutral to positive
          else if (result.citationPosition && result.citationPosition <= 100) {
            sentiment = 'neutral';
          }
          // If mentioned but no position info, default to neutral
          else {
            sentiment = 'neutral';
          }
        }

        const website = (result as any).website;
        
        return {
          id: result.id,
          platform: result.platform,
          query: result.query,
          mention: result.snippet || result.fullResponse?.substring(0, 200) + '...' || 'No snippet available',
          url: website?.url || '',
          websiteName: website?.name || website?.domain || 'Unknown',
          timestamp: result.trackedAt.toISOString(),
          sentiment,
          isCited: result.isCited,
          citationPosition: result.citationPosition || null
        };
      });

      // Calculate summary statistics
      const platformCounts: Record<string, number> = {};
      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
      
      // Initialize platform counts
      Object.values(AI_PLATFORMS).forEach(platform => {
        platformCounts[platform] = 0;
      });
      
      mentions.forEach(mention => {
        platformCounts[mention.platform] = (platformCounts[mention.platform] || 0) + 1;
        sentimentCounts[mention.sentiment]++;
      });

      const totalPages = Math.ceil(totalCount / limitNum);

      const response: MentionsResponse = {
        mentions,
        summary: {
          total: totalCount,
          byPlatform: platformCounts,
          bySentiment: sentimentCounts
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages
        }
      };

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Failed to get mentions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve mentions data'
      });
    }
  });

  public getVisibilityTrends = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { websiteId, period = '30d' } = req.query;
    const organizationId = req.organization?.id;
    
    if (!organizationId) {
      res.status(401).json({
        success: false,
        message: 'Organization ID is required'
      });
      return;
    }

    try {
      // Parse period (e.g., '30d' -> 30 days)
      const days = parseInt((period as string).replace('d', '')) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Build where clause for organization filtering
      const websiteWhere: any = {
        organizationId
      };
      
      if (websiteId && typeof websiteId === 'string') {
        websiteWhere.id = websiteId;
      }

      // Build where clause for KeywordRanking
      const keywordRankingWhere: any = {
        organizationId,
        trackedAt: {
          [Op.gte]: startDate
        }
      };
      
      if (websiteId && typeof websiteId === 'string') {
        keywordRankingWhere.websiteId = websiteId;
      }

      // Execute parallel queries for trends and summary data
      const [keywordRankings, trackingResults, websiteInfo] = await Promise.all([
        // Get keyword rankings for visibility trends (if available)
        KeywordRanking.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('tracked_at')), 'date'],
            'platform',
            [sequelize.fn('AVG', sequelize.col('visibility_score')), 'avgVisibility']
          ],
          where: keywordRankingWhere,
          group: [
            sequelize.fn('DATE', sequelize.col('tracked_at')),
            'platform'
          ],
          order: [
            [sequelize.fn('DATE', sequelize.col('tracked_at')), 'ASC']
          ]
        }),
        // Get AI tracking results for mention counts and trends
        AITrackingResult.findAll({
          where: {
            trackedAt: {
              [Op.gte]: startDate
            }
          },
          include: [{
            model: Website,
            as: 'website',
            where: websiteWhere,
            attributes: []
          }]
        }),
        // Get website info if specific websiteId is provided
        websiteId && typeof websiteId === 'string' ? Website.findOne({
          where: { id: websiteId as string, organizationId }
        }) : null
      ]);

      // Process both keyword rankings and AI tracking results into trends format
      const trendsByDate: Record<string, Record<string, number>> = {};
      
      // First, process keyword rankings if available
      (keywordRankings as any[]).forEach(ranking => {
        const date = ranking.getDataValue('date');
        const platform = ranking.platform;
        const visibility = parseFloat(ranking.getDataValue('avgVisibility'));
        
        if (!trendsByDate[date]) {
          trendsByDate[date] = {
            chatgpt: 0,
            perplexity: 0,
            gemini: 0,
            claude: 0
          };
        }
        
        trendsByDate[date][platform] = Math.round(visibility);
      });

      // Then, process AI tracking results to generate trends if no keyword data exists
      if ((keywordRankings as any[]).length === 0 && (trackingResults as any[]).length > 0) {
        // Group AI tracking results by date and platform to calculate daily visibility scores
        const aiTrendsByDate: Record<string, Record<string, { mentioned: number; total: number; cited: number; }>> = {};
        
        (trackingResults as any[]).forEach(result => {
          const date = result.trackedAt.toISOString().split('T')[0];
          const platform = result.platform.toLowerCase();

          if (!aiTrendsByDate[date]) {
            aiTrendsByDate[date] = {
              chatgpt: { mentioned: 0, total: 0, cited: 0 },
              perplexity: { mentioned: 0, total: 0, cited: 0 },
              gemini: { mentioned: 0, total: 0, cited: 0 },
              claude: { mentioned: 0, total: 0, cited: 0 }
            };
          }

          if (aiTrendsByDate[date][platform]) {
            aiTrendsByDate[date][platform].total++;
            if (result.isMentioned) {
              aiTrendsByDate[date][platform].mentioned++;
            }
            if (result.isCited) {
              aiTrendsByDate[date][platform].cited++;
            }
          }
        });


        // Convert AI tracking data to visibility scores (0-100 scale)
        Object.entries(aiTrendsByDate).forEach(([date, platforms]) => {
          if (!trendsByDate[date]) {
            trendsByDate[date] = {
              chatgpt: 0,
              perplexity: 0,
              gemini: 0,
              claude: 0
            };
          }

          Object.entries(platforms).forEach(([platform, stats]) => {
            // Calculate visibility score: since citation detection is not working properly,
            // we'll use mention rate as the primary score (scaled to 0-100)
            let score = 0;
            if (stats.total > 0) {
              // For now, use mention rate as main visibility indicator
              // Later we can enhance citation detection
              const mentionRate = stats.mentioned / stats.total;

              // Scale mention rate to 0-100 with some bonus for citations if they exist
              if (stats.cited > 0) {
                // If citations exist, give full weight
                const citationBonus = (stats.cited / stats.total) * 30;
                score = Math.round((mentionRate * 70) + citationBonus);
              } else {
                // If no citations detected, treat mentions as primary visibility indicator
                score = Math.round(mentionRate * 80); // Scale mentions to 80% max to leave room for citations
              }
            }
            trendsByDate[date][platform] = score;
          });
        });
      }

      // Convert to array format and fill missing dates
      const trends: TrendData[] = [];

      // Generate date range ending with today to include current data
      const today = new Date();
      const dateRange = Array.from({ length: Math.min(days, 30) }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (Math.min(days, 30) - 1 - i));
        return date.toISOString().split('T')[0];
      });


      dateRange.forEach(date => {
        const dayData = trendsByDate[date] || {
          chatgpt: 0,
          perplexity: 0,
          gemini: 0,
          claude: 0
        };
        
        trends.push({
          date,
          chatgpt: dayData.chatgpt,
          perplexity: dayData.perplexity,
          gemini: dayData.gemini,
          claude: dayData.claude
        });
      });

      // Calculate summary statistics
      const platformSums = { chatgpt: 0, perplexity: 0, gemini: 0, claude: 0 };
      let totalDataPoints = 0;
      
      trends.forEach(trend => {
        Object.keys(platformSums).forEach(platform => {
          const value = trend[platform as keyof typeof platformSums];
          platformSums[platform as keyof typeof platformSums] += value;
          if (value > 0) totalDataPoints++;
        });
      });

      const averageVisibility = totalDataPoints > 0 
        ? Object.values(platformSums).reduce((sum, val) => sum + val, 0) / totalDataPoints 
        : 0;

      // Calculate growth (comparing first week vs last week)
      const firstWeekAvg = trends.slice(0, 7).reduce((sum, trend) => {
        return sum + (trend.chatgpt + trend.perplexity + trend.gemini + trend.claude) / 4;
      }, 0) / 7;
      
      const lastWeekAvg = trends.slice(-7).reduce((sum, trend) => {
        return sum + (trend.chatgpt + trend.perplexity + trend.gemini + trend.claude) / 4;
      }, 0) / 7;
      
      const growth = firstWeekAvg > 0 ? ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100 : 0;

      // Find top performing platform
      const topPerformingPlatform = Object.entries(platformSums)
        .sort(([,a], [,b]) => b - a)[0][0];

      // Count total mentions and queries (only mentioned ones for the summary)
      const totalMentions = trackingResults.filter((result: any) => result.isMentioned).length;
      const totalQueries = await AITrackingResult.count({
        where: {
          trackedAt: {
            [Op.gte]: startDate
          }
        },
        include: [{
          model: Website,
          as: 'website',
          where: websiteWhere,
          attributes: []
        }],
        distinct: true,
        col: 'query'
      });

      const response: VisibilityTrendsResponse = {
        trends,
        summary: {
          averageVisibility: Math.round(averageVisibility * 100) / 100,
          growth: Math.round(growth * 100) / 100,
          topPerformingPlatform: topPerformingPlatform.charAt(0).toUpperCase() + topPerformingPlatform.slice(1),
          totalMentions,
          totalQueries
        }
      };

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Failed to get visibility trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve visibility trends'
      });
    }
  });

  public startImmediateTracking = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { websiteId, platforms, keywords } = req.body;
    const organizationId = req.organization?.id;

    if (!organizationId) {
      res.status(401).json({
        success: false,
        message: 'Organization ID is required'
      });
      return;
    }

    try {
      // Import dependencies
      const { sequelize } = await import('../models');
      const TrackingSettings = (await import('../models/TrackingSettings')).default;

      // Get organization's tracking settings and keywords
      const trackingSettings = await TrackingSettings.findOne({
        where: { organizationId, trackingEnabled: true }
      });

      if (!trackingSettings) {
        res.status(400).json({
          success: false,
          message: 'Tracking is not enabled for this organization'
        });
        return;
      }

      // Get keywords for this organization
      const keywordsQuery = `
        SELECT GROUP_CONCAT(DISTINCT k.keyword) as keywords
        FROM keywords k
        WHERE k.organization_id = ?
      `;

      const [keywordData] = await sequelize.query(keywordsQuery, {
        replacements: [organizationId],
        type: QueryTypes.SELECT
      }) as any[];

      const orgKeywords = keywordData?.keywords ?
        keywordData.keywords.split(',').map((k: string) => k.trim()) :
        ['ai', 'tracking'];

      // Use provided values or fall back to organization settings
      const finalPlatforms = platforms && platforms.length > 0 ? platforms : trackingSettings.platforms;
      const finalKeywords = keywords && keywords.length > 0 ? keywords : orgKeywords;

      // Get websites to track
      let websitesToTrack: any[] = [];
      if (websiteId) {
        // Track specific website
        const website = await Website.findOne({
          where: { id: websiteId, organizationId, isActive: true }
        });
        if (website) {
          websitesToTrack = [website];
        }
      } else {
        // Track all active websites for this organization
        websitesToTrack = await Website.findAll({
          where: { organizationId, isActive: true }
        });
      }

      if (websitesToTrack.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No active websites found to track'
        });
        return;
      }

      // Import app to trigger immediate tracking
      const App = (await import('../app')).default;

      // Create a new App instance to access the method
      const appInstance = new App();

      // Trigger immediate tracking using the App's method
      await appInstance.triggerTrackingForOrganization(
        organizationId,
        finalPlatforms,
        finalKeywords,
        true // immediate = true
      );

      res.json({
        success: true,
        message: 'Immediate tracking started successfully',
        data: {
          jobsQueued: websitesToTrack.length * finalPlatforms.length,
          websites: websitesToTrack.map(w => ({ id: w.id, domain: w.domain })),
          platforms: finalPlatforms,
          keywords: finalKeywords,
          estimatedTimeMinutes: Math.ceil(finalPlatforms.length * finalKeywords.length / 10) // Rough estimate
        }
      });

    } catch (error) {
      console.error('Failed to start immediate tracking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start immediate tracking'
      });
    }
  });

}