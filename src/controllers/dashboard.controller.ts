import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { 
  Website, 
  Scan, 
  AITrackingResult, 
  AlertHistory, 
  AlertConfiguration,
  MetricsSnapshot 
} from '../models';
import { Op } from 'sequelize';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class DashboardController {
  public getStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    
    if (!organizationId) {
      res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
      return;
    }
    
    try {
      // Get date range for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const now = new Date();

      // Query real data from database
      const [
        totalWebsites,
        totalScans,
        recentScans,
        trackingResults,
        recentAlerts,
        alertConfigurations,
        topWebsites
      ] = await Promise.all([
        // Total websites count
        Website.count({
          where: { organizationId: organizationId, isActive: true }
        }),
        
        // Total scans count
        Scan.count({
          include: [{
            model: Website,
            as: 'website',
            where: { organizationId: organizationId },
            attributes: []
          }]
        }),
        
        // Recent scans for activity
        Scan.findAll({
          limit: 5,
          order: [['createdAt', 'DESC']],
          include: [{
            model: Website,
            as: 'website',
            where: { organizationId: organizationId },
            attributes: ['id', 'name', 'url']
          }],
          attributes: ['id', 'status', 'createdAt', 'completedAt']
        }),
        
        // AI tracking results for mentions and platform distribution
        AITrackingResult.findAll({
          include: [{
            model: Website,
            as: 'website',
            where: { organizationId: organizationId },
            attributes: ['id', 'name', 'url']
          }],
          where: {
            trackedAt: { [Op.gte]: thirtyDaysAgo }
          },
          attributes: ['id', 'platform', 'query', 'isMentioned', 'snippet', 'citationPosition', 'trackedAt', 'websiteId']
        }),
        
        // Recent alerts
        AlertHistory.findAll({
          limit: 10,
          order: [['triggeredAt', 'DESC']],
          include: [{
            model: Website,
            as: 'website',
            where: { organizationId: organizationId },
            attributes: ['id', 'name', 'url'],
            required: false
          }],
          where: {
            organizationId: organizationId,
            triggeredAt: { [Op.gte]: thirtyDaysAgo }
          },
          attributes: ['id', 'alertType', 'triggerData', 'triggeredAt', 'websiteId']
        }),
        
        // Alert configurations count
        AlertConfiguration.count({
          where: { organizationId: organizationId, isActive: true }
        }),
        
        // Top performing websites based on mentions
        Website.findAll({
          where: { organizationId: organizationId, isActive: true },
          include: [{
            model: AITrackingResult,
            as: 'trackingResults',
            where: {
              trackedAt: { [Op.gte]: thirtyDaysAgo },
              isMentioned: true
            },
            attributes: ['id', 'platform', 'citationPosition'],
            required: false
          }],
          attributes: ['id', 'name', 'url'],
          limit: 10
        })
      ]);

      // Calculate platform distribution from tracking results
      const platformStats: Record<string, { mentions: number; totalQueries: number }> = {};
      
      trackingResults.forEach(result => {
        const platform = result.platform;
        if (!platformStats[platform]) {
          platformStats[platform] = { mentions: 0, totalQueries: 0 };
        }
        platformStats[platform].totalQueries++;
        if (result.isMentioned) {
          platformStats[platform].mentions++;
        }
      });

      // Calculate average GEO score (simplified - you might want a more complex calculation)
      const totalMentions = trackingResults.filter(r => r.isMentioned).length;
      const totalQueries = trackingResults.length;
      const averageGeoScore = totalQueries > 0 ? Math.round((totalMentions / totalQueries) * 100 * 100) / 100 : 0;

      // Format recent activity
      const recentActivity = recentScans.map(scan => ({
        type: scan.status === 'completed' ? 'scan_completed' : 'scan_started',
        message: `Website scan ${scan.status} for ${(scan as any).website?.name || 'website'}`,
        timestamp: scan.completedAt || scan.createdAt,
        websiteId: (scan as any).website?.id
      }));

      // Format top performing websites
      const topPerforming = topWebsites.map(website => {
        const mentions = (website as any).trackingResults?.length || 0;
        const avgCitation = mentions > 0 
          ? (website as any).trackingResults.reduce((sum: number, tr: any) => sum + (tr.citationPosition || 0), 0) / mentions 
          : 0;
        const geoScore = mentions > 0 ? Math.max(0, 100 - (avgCitation * 10)) : 0;
        
        return {
          websiteId: website.id,
          url: website.url,
          name: website.name,
          geoScore: Math.round(geoScore * 100) / 100,
          mentions: mentions
        };
      }).sort((a, b) => b.geoScore - a.geoScore);

      // Format platform distribution
      const platformDistribution = Object.entries(platformStats).map(([platform, stats]) => ({
        platform,
        mentions: stats.mentions,
        totalQueries: stats.totalQueries,
        mentionRate: stats.totalQueries > 0 
          ? (stats.mentions / stats.totalQueries * 100).toFixed(1)
          : '0.0'
      }));

      // Format alerts
      const alerts = recentAlerts.map(alert => ({
        type: alert.alertType,
        message: alert.triggerData ? (alert.triggerData as any).metric || 'Alert triggered' : 'Alert triggered',
        timestamp: alert.triggeredAt,
        websiteId: alert.websiteId,
        severity: 'medium' // Default severity since it's not in the model
      }));

      const dashboardStats = {
        overview: {
          totalWebsites,
          totalScans,
          averageGeoScore,
          totalMentions
        },
        recentActivity,
        topPerforming: topPerforming.slice(0, 5), // Top 5
        alerts: alerts.slice(0, 5), // Latest 5 alerts
        platformDistribution,
        timeRange: {
          from: thirtyDaysAgo.toISOString(),
          to: now.toISOString()
        }
      };

      res.json({
        success: true,
        data: dashboardStats
      });

    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics'
      });
    }
  });

}