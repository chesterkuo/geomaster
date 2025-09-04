import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class TrackingController {
  public getMentions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { websiteId, platform, dateRange } = req.query;
    
    // Mock AI mentions data
    const mockMentions = {
      mentions: [
        {
          id: '1',
          platform: 'ChatGPT',
          query: 'best AI optimization tools',
          mention: 'For AI optimization, consider using specialized tools like...',
          url: 'https://example.com',
          timestamp: new Date().toISOString(),
          sentiment: 'positive'
        },
        {
          id: '2', 
          platform: 'Perplexity',
          query: 'SEO for AI search engines',
          mention: 'Leading platforms include...',
          url: 'https://example.com/page',
          timestamp: new Date().toISOString(),
          sentiment: 'neutral'
        }
      ],
      summary: {
        total: 15,
        byPlatform: {
          'ChatGPT': 8,
          'Perplexity': 4,
          'Gemini': 3
        },
        bySentiment: {
          positive: 10,
          neutral: 4,
          negative: 1
        }
      }
    };

    res.json({
      success: true,
      data: mockMentions
    });
  });

  public getVisibilityTrends = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { websiteId, period } = req.query;
    
    // Mock visibility trends data
    const mockTrends = {
      trends: [
        { date: '2024-01-01', chatgpt: 45, perplexity: 32, gemini: 28 },
        { date: '2024-01-02', chatgpt: 48, perplexity: 35, gemini: 30 },
        { date: '2024-01-03', chatgpt: 52, perplexity: 38, gemini: 33 }
      ],
      summary: {
        averageVisibility: 42.5,
        growth: 15.2,
        topPerformingPlatform: 'ChatGPT'
      }
    };

    res.json({
      success: true,
      data: mockTrends
    });
  });
}