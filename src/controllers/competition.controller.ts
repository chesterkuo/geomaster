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

      // Process data for analysis
      const analysis = {
        organization: {
          websites: orgWebsites,
          totalMentions: orgTrackingResults.filter(r => r.isMentioned).length,
          totalCitations: orgTrackingResults.filter(r => r.isCited).length,
          platformBreakdown: {}
        },
        competitors: competitors.map(comp => ({
          id: comp.id,
          domain: comp.domain,
          name: comp.name,
          mentions: 0, // Would be calculated from actual competitor tracking data
          citations: 0,
          platformBreakdown: {}
        })),
        timeframe: {
          start: startDate,
          end: endDate,
          period: timeframe
        }
      };

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
      analysis.organization.platformBreakdown = platformStats;

      // Process competitor mentions from stored data
      // This is a simplified version - in reality, you'd need actual competitor tracking
      competitorMentions.forEach(result => {
        if (result.competitorMentions) {
          const mentions = result.competitorMentions as any;
          if (Array.isArray(mentions)) {
            mentions.forEach((mention: any) => {
              const competitor = analysis.competitors.find(c => c.domain === mention.domain);
              if (competitor) {
                competitor.mentions += mention.count || 1;
              }
            });
          }
        }
      });

      return res.json({
        success: true,
        data: analysis
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