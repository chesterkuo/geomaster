import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class DashboardController {
  public getStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    // Mock dashboard statistics
    const mockStats = {
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
          timestamp: new Date().toISOString()
        },
        {
          type: 'mention_found',
          message: 'New mention found on ChatGPT',
          timestamp: new Date().toISOString()
        }
      ],
      topPerforming: [
        {
          websiteId: '1',
          url: 'https://example.com',
          geoScore: 85.5,
          mentions: 45
        },
        {
          websiteId: '2', 
          url: 'https://demo.com',
          geoScore: 78.2,
          mentions: 32
        }
      ],
      alerts: [
        {
          type: 'warning',
          message: 'GEO score decreased by 5 points for example.com',
          timestamp: new Date().toISOString()
        }
      ]
    };

    res.json({
      success: true,
      data: mockStats
    });
  });
}