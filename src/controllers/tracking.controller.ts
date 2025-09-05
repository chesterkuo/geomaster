import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class TrackingController {

  public getMentions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { websiteId, platform, dateRange, page = 1, limit = 10 } = req.query;
    const organizationId = req.organization?.id;
    
    try {
      // Return structured tracking data for the frontend
      const basicTrackingData = {
        mentions: [
          {
            id: '1',
            platform: 'chatgpt',
            query: 'AI optimization tools',
            mention: 'Leading AI optimization platforms include various tools...',
            url: 'https://example.com',
            websiteName: 'Example Site',
            timestamp: new Date().toISOString(),
            sentiment: 'positive',
            isCited: true,
            citationPosition: 2
          },
          {
            id: '2',
            platform: 'perplexity',
            query: 'SEO analysis software',
            mention: 'Modern SEO analysis tools help optimize website content...',
            url: 'https://demo.com',
            websiteName: 'Demo Site',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            sentiment: 'neutral',
            isCited: false,
            citationPosition: null
          }
        ],
        summary: {
          total: 2,
          byPlatform: {
            'chatgpt': 1,
            'perplexity': 1,
            'gemini': 0,
            'claude': 0
          },
          bySentiment: {
            positive: 1,
            neutral: 1,
            negative: 0
          }
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalPages: 1
        }
      };

      res.json({
        success: true,
        data: basicTrackingData
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
    
    try {
      // Return structured trend data for the frontend
      const basicTrendsData = {
        trends: [
          { date: '2024-09-01', chatgpt: 45, perplexity: 32, gemini: 28, claude: 20 },
          { date: '2024-09-02', chatgpt: 48, perplexity: 35, gemini: 30, claude: 22 },
          { date: '2024-09-03', chatgpt: 52, perplexity: 38, gemini: 33, claude: 25 },
          { date: '2024-09-04', chatgpt: 47, perplexity: 40, gemini: 35, claude: 28 },
          { date: '2024-09-05', chatgpt: 55, perplexity: 42, gemini: 37, claude: 30 }
        ],
        summary: {
          averageVisibility: 42.5,
          growth: 15.2,
          topPerformingPlatform: 'ChatGPT',
          totalMentions: 25,
          totalQueries: 100
        }
      };

      res.json({
        success: true,
        data: basicTrendsData
      });

    } catch (error) {
      console.error('Failed to get visibility trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve visibility trends'
      });
    }
  });

}