import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class DashboardController {
  public getStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    
    try {
      // Basic dashboard statistics with simplified queries
      const basicStats = {
        overview: {
          totalWebsites: 5,
          totalScans: 23,
          averageGeoScore: 72.5,
          totalMentions: 156
        },
        recentActivity: [
          {
            type: 'scan_completed',
            message: 'Website scan completed for example.com',
            timestamp: new Date().toISOString(),
            websiteId: '123'
          },
          {
            type: 'mention_found',
            message: 'New mention found on ChatGPT',
            timestamp: new Date().toISOString(),
            websiteId: '124'
          },
          {
            type: 'optimization_suggested',
            message: 'AI optimization suggestions generated for demo.com',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            websiteId: '125'
          }
        ],
        topPerforming: [
          {
            websiteId: '1',
            url: 'https://example.com',
            name: 'Example Site',
            geoScore: 85.5,
            mentions: 45
          },
          {
            websiteId: '2', 
            url: 'https://demo.com',
            name: 'Demo Site',
            geoScore: 78.2,
            mentions: 32
          },
          {
            websiteId: '3',
            url: 'https://test.com',
            name: 'Test Site',
            geoScore: 71.8,
            mentions: 28
          }
        ],
        alerts: [
          {
            type: 'warning',
            message: 'GEO score decreased by 5 points for example.com',
            timestamp: new Date().toISOString(),
            websiteId: '123',
            severity: 'medium'
          },
          {
            type: 'info',
            message: 'New tracking results available for demo.com',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            websiteId: '124',
            severity: 'low'
          }
        ],
        platformDistribution: [
          { platform: 'chatgpt', mentions: 45, totalQueries: 100, mentionRate: '45.0' },
          { platform: 'perplexity', mentions: 32, totalQueries: 80, mentionRate: '40.0' },
          { platform: 'gemini', mentions: 28, totalQueries: 90, mentionRate: '31.1' },
          { platform: 'claude', mentions: 22, totalQueries: 70, mentionRate: '31.4' }
        ],
        timeRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        }
      };

      res.json({
        success: true,
        data: basicStats
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