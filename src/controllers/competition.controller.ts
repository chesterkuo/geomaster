import { Request, Response } from 'express';
import { Competitor, AITrackingResult, Website } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { URL } from 'url';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class CompetitionController {
  // GET /api/v1/tracking/competitors - List competitors
  async getCompetitors(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { page = 1, limit = 20, active } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {
        organizationId
      };

      if (active !== undefined) {
        whereClause.isActive = active === 'true';
      }

      const { count, rows: competitors } = await Competitor.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      return res.json({
        success: true,
        data: {
          competitors,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching competitors:', error);
      return res.status(500).json({ error: 'Failed to fetch competitors' });
    }
  }

  // POST /api/v1/tracking/competitors - Add competitor
  async addCompetitor(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { websiteUrl, name } = req.body;

      // Extract domain from URL
      let domain: string;
      try {
        const url = new URL(websiteUrl);
        domain = url.hostname;
      } catch (error) {
        return res.status(400).json({ error: 'Invalid website URL' });
      }

      // Check if competitor already exists
      const existingCompetitor = await Competitor.findOne({
        where: {
          organizationId,
          domain
        }
      });

      if (existingCompetitor) {
        return res.status(409).json({ error: 'Competitor already exists' });
      }

      const newCompetitor = await Competitor.create({
        organizationId,
        websiteUrl,
        domain,
        name: name || domain,
        isActive: true
      });

      return res.status(201).json({
        success: true,
        data: newCompetitor
      });
    } catch (error) {
      console.error('Error adding competitor:', error);
      return res.status(500).json({ error: 'Failed to add competitor' });
    }
  }

  // DELETE /api/v1/tracking/competitors/:id - Remove competitor
  async removeCompetitor(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { id } = req.params;

      const competitor = await Competitor.findOne({
        where: {
          id,
          organizationId
        }
      });

      if (!competitor) {
        return res.status(404).json({ error: 'Competitor not found' });
      }

      await competitor.destroy();

      return res.json({
        success: true,
        message: 'Competitor removed successfully'
      });
    } catch (error) {
      console.error('Error removing competitor:', error);
      return res.status(500).json({ error: 'Failed to remove competitor' });
    }
  }

  // GET /api/v1/tracking/competitive-analysis - Competitor comparison data
  async getCompetitiveAnalysis(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { timeframe = '30d', platform } = req.query;

      // Get date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get organization's websites
      const orgWebsites = await Website.findAll({
        where: { organizationId },
        attributes: ['id', 'domain', 'name']
      });

      const orgWebsiteIds = orgWebsites.map(w => w.id);

      // Get competitors
      const competitors = await Competitor.findAll({
        where: { organizationId, isActive: true },
        attributes: ['id', 'domain', 'name']
      });

      // Build tracking results query
      const whereClause: any = {
        tracked_at: {
          [Op.between]: [startDate, endDate]
        }
      };

      if (platform) {
        whereClause.platform = platform;
      }

      // Get organization's tracking results
      const orgTrackingResults = await AITrackingResult.findAll({
        where: {
          ...whereClause,
          websiteId: { [Op.in]: orgWebsiteIds }
        },
        attributes: ['platform', 'isMentioned', 'isCited', 'trackedAt'],
        include: [{
          model: Website,
          as: 'website',
          attributes: ['domain', 'name']
        }]
      });

      // Get competitor mention data from stored tracking results
      // Note: This would need to be populated by actual tracking jobs
      const competitorMentions = await AITrackingResult.findAll({
        where: whereClause,
        attributes: ['platform', 'competitorMentions', 'trackedAt']
      });

      // Calculate platform breakdown for organization
      const platformStats: any = {};
      orgTrackingResults.forEach(result => {
        const platform = result.platform;
        if (!platformStats[platform]) {
          platformStats[platform] = { mentions: 0, citations: 0 };
        }
        if (result.isMentioned) platformStats[platform].mentions++;
        if (result.isCited) platformStats[platform].citations++;
      });

      // Calculate organization metrics
      const orgMentions = orgTrackingResults.filter(r => r.isMentioned).length;
      const orgCitations = orgTrackingResults.filter(r => r.isCited).length;
      const orgGeoScore = orgCitations > 0 ? Math.round((orgCitations / Math.max(orgMentions, 1)) * 100) : 0;

      // Process competitor data
      const competitorData = competitors.map(comp => {
        // For now, using mock data as actual competitor tracking needs to be implemented
        const competitorMentions = Math.floor(Math.random() * 10);
        const competitorCitations = Math.floor(Math.random() * 5);
        const competitorScore = competitorMentions > 0 ? Math.round((competitorCitations / competitorMentions) * 100) : 0;

        return {
          competitorId: comp.id,
          domain: comp.domain,
          name: comp.name,
          metrics: {
            geoScore: competitorScore,
            visibilityScore: competitorScore,
            mentionCount: competitorMentions,
            averagePosition: Math.floor(Math.random() * 10) + 1,
            sentimentScore: Math.floor(Math.random() * 100),
            technicalScore: Math.floor(Math.random() * 100),
            contentScore: Math.floor(Math.random() * 100)
          },
          trends: {
            visibilityTrend: Math.floor(Math.random() * 21) - 10, // -10 to +10
            mentionTrend: Math.floor(Math.random() * 21) - 10,
            positionTrend: Math.floor(Math.random() * 21) - 10
          },
          marketShare: Math.floor(Math.random() * 30) + 10,
          platforms: {
            chatgpt: { mentions: Math.floor(Math.random() * 5), avgPosition: Math.floor(Math.random() * 10) + 1, sentiment: Math.floor(Math.random() * 100) },
            perplexity: { mentions: Math.floor(Math.random() * 5), avgPosition: Math.floor(Math.random() * 10) + 1, sentiment: Math.floor(Math.random() * 100) },
            gemini: { mentions: Math.floor(Math.random() * 5), avgPosition: Math.floor(Math.random() * 10) + 1, sentiment: Math.floor(Math.random() * 100) },
            claude: { mentions: Math.floor(Math.random() * 5), avgPosition: Math.floor(Math.random() * 10) + 1, sentiment: Math.floor(Math.random() * 100) }
          }
        };
      });

      // Format response to match frontend expectations
      const responseData = {
        websiteId: orgWebsiteIds[0] || '', // Use first website ID as primary
        analysis: {
          yourBrand: {
            name: orgWebsites[0]?.name || 'Your Brand',
            metrics: {
              geoScore: orgGeoScore,
              visibilityScore: orgGeoScore,
              mentionCount: orgMentions,
              averagePosition: 3, // Mock data
              sentimentScore: 75, // Mock data
              technicalScore: 80, // Mock data
              contentScore: 70 // Mock data
            },
            marketShare: Math.max(20, 50 - (competitorData.length * 10)) // Ensure reasonable market share
          },
          competitors: competitorData,
          benchmarks: {
            industryAverage: {
              geoScore: 45,
              visibilityScore: 45,
              mentionCount: 10,
              averagePosition: 5,
              sentimentScore: 60,
              technicalScore: 65,
              contentScore: 55
            },
            topPerformer: {
              geoScore: 85,
              visibilityScore: 85,
              mentionCount: 25,
              averagePosition: 2,
              sentimentScore: 90,
              technicalScore: 95,
              contentScore: 90
            }
          }
        },
        insights: [
          {
            type: 'opportunity',
            title: 'Improve AI Platform Visibility',
            description: 'Your brand has good citation rates but could increase overall mentions across AI platforms',
            impact: 'high',
            recommendedAction: 'Focus on content optimization and keyword targeting for AI search engines'
          },
          {
            type: 'strength',
            title: 'Strong Citation Performance',
            description: 'Your brand maintains good citation rates when mentioned in AI responses',
            impact: 'medium',
            recommendedAction: 'Continue creating authoritative content that AI models reference'
          }
        ],
        gapAnalysis: [
          {
            category: 'AI Visibility',
            yourScore: orgGeoScore,
            competitorAverage: Math.round(competitorData.reduce((sum, c) => sum + c.metrics.geoScore, 0) / Math.max(competitorData.length, 1)),
            gap: Math.round(competitorData.reduce((sum, c) => sum + c.metrics.geoScore, 0) / Math.max(competitorData.length, 1)) - orgGeoScore,
            recommendations: [
              'Increase content creation frequency',
              'Optimize for AI-relevant keywords',
              'Build more authoritative backlinks'
            ]
          }
        ]
      };

      return res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('Error getting competitive analysis:', error);
      return res.status(500).json({ error: 'Failed to get competitive analysis' });
    }
  }

  // PUT /api/v1/tracking/competitors/:id - Update competitor
  async updateCompetitor(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { id } = req.params;
      const { name, websiteUrl, isActive } = req.body;

      const competitor = await Competitor.findOne({
        where: {
          id,
          organizationId
        }
      });

      if (!competitor) {
        return res.status(404).json({ error: 'Competitor not found' });
      }

      let domain = competitor.domain;
      if (websiteUrl && websiteUrl !== competitor.websiteUrl) {
        try {
          const url = new URL(websiteUrl);
          domain = url.hostname;
        } catch (error) {
          return res.status(400).json({ error: 'Invalid website URL' });
        }

        // Check if domain conflicts with existing competitor
        const existingCompetitor = await Competitor.findOne({
          where: {
            organizationId,
            domain,
            id: { [Op.ne]: id }
          }
        });

        if (existingCompetitor) {
          return res.status(409).json({ error: 'Competitor with this domain already exists' });
        }
      }

      await competitor.update({
        name: name || competitor.name,
        websiteUrl: websiteUrl || competitor.websiteUrl,
        domain,
        isActive: isActive !== undefined ? isActive : competitor.isActive
      });

      return res.json({
        success: true,
        data: competitor
      });
    } catch (error) {
      console.error('Error updating competitor:', error);
      return res.status(500).json({ error: 'Failed to update competitor' });
    }
  }
}