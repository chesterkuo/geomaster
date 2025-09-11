import { Response } from 'express';
import analyticsService from '../services/analyticsService';
import competitorAnalysisService from '../services/competitorAnalysis.service';

// Analytics controller interface
interface AuthRequest {
  user?: any;
  organization?: any;
  params: any;
  query: any;
  body: any;
}

// Get analytics dashboard data
export const getAnalyticsDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id;
    const { websiteId } = req.params;

    if (!organizationId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    if (!websiteId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Website ID is required' 
      });
    }

    const snapshotData = await analyticsService.getDashboardData(organizationId, websiteId);

    if (!snapshotData) {
      return res.json({
        success: true,
        data: {
          overview: {
            totalViews: 0,
            uniqueVisitors: 0,
            averageSessionDuration: '0:00',
            bounceRate: 0,
            growth: {
              views: 0,
              visitors: 0,
              sessionDuration: 0,
              bounceRate: 0
            }
          },
          trafficSources: {
            organic: 0,
            direct: 0,
            social: 0,
            referral: 0,
            email: 0,
            paid: 0
          },
          deviceBreakdown: {
            desktop: 0,
            mobile: 0,
            tablet: 0
          },
          topPages: [],
          realtimeUsers: 0,
          conversion: {
            conversionRate: 0,
            totalConversions: 0,
            conversionValue: 0,
            growth: {
              conversionRate: 0,
              totalConversions: 0,
              conversionValue: 0
            }
          }
        }
      });
    }

    // Transform AnalyticsSnapshot data to match frontend AnalyticsDashboard interface
    const dashboardData = {
      overview: {
        totalViews: snapshotData.metrics?.totalViews || 0,
        uniqueVisitors: snapshotData.metrics?.uniqueVisitors || 0,
        averageSessionDuration: snapshotData.metrics?.avgSessionDuration || '0:00',
        bounceRate: snapshotData.metrics?.bounceRate || 0,
        growth: {
          views: snapshotData.metrics?.growth?.views || 0,
          visitors: snapshotData.metrics?.growth?.visitors || 0,
          sessionDuration: snapshotData.metrics?.growth?.sessionDuration || 0,
          bounceRate: snapshotData.metrics?.growth?.bounceRate || 0
        }
      },
      trafficSources: {
        organic: snapshotData.metrics?.trafficSources?.organic || 0,
        direct: snapshotData.metrics?.trafficSources?.direct || 0,
        social: snapshotData.metrics?.trafficSources?.social || 0,
        referral: snapshotData.metrics?.trafficSources?.referral || 0,
        email: snapshotData.metrics?.trafficSources?.email || 0,
        paid: snapshotData.metrics?.trafficSources?.paid || 0
      },
      deviceBreakdown: {
        desktop: snapshotData.metrics?.deviceBreakdown?.desktop || 0,
        mobile: snapshotData.metrics?.deviceBreakdown?.mobile || 0,
        tablet: snapshotData.metrics?.deviceBreakdown?.tablet || 0
      },
      topPages: snapshotData.metrics?.topPages || [],
      realtimeUsers: snapshotData.metrics?.realtimeUsers || 0,
      conversion: {
        conversionRate: snapshotData.metrics?.conversionRate || 0,
        totalConversions: snapshotData.metrics?.totalConversions || 0,
        conversionValue: snapshotData.metrics?.conversionValue || 0,
        growth: {
          conversionRate: snapshotData.metrics?.growth?.conversionRate || 0,
          totalConversions: snapshotData.metrics?.growth?.totalConversions || 0,
          conversionValue: snapshotData.metrics?.growth?.conversionValue || 0
        }
      }
    };

    return res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get analytics dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get analytics trends over time
export const getAnalyticsTrends = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id;
    const { websiteId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    if (!organizationId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    if (!websiteId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Website ID is required' 
      });
    }

    const trendData = await analyticsService.getTrendData(organizationId, websiteId, days);

    return res.json({
      success: true,
      data: {
        trends: trendData,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Get analytics trends error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics trends',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get platform performance breakdown
export const getPlatformPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id;
    const { websiteId } = req.params;

    if (!organizationId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    if (!websiteId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Website ID is required' 
      });
    }

    const platformData = await analyticsService.getPlatformPerformance(organizationId, websiteId);

    return res.json({
      success: true,
      data: {
        platforms: platformData
      }
    });
  } catch (error) {
    console.error('Get platform performance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve platform performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Generate new analytics snapshot
export const generateSnapshot = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id;
    const { websiteId } = req.params;
    const { snapshotType = 'daily' } = req.body;

    if (!organizationId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    if (!websiteId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Website ID is required' 
      });
    }

    if (!['daily', 'weekly', 'monthly'].includes(snapshotType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid snapshot type. Must be daily, weekly, or monthly' 
      });
    }

    const snapshot = await analyticsService.generateSnapshot({
      organizationId,
      websiteId,
      snapshotType
    });

    return res.json({
      success: true,
      data: {
        snapshot,
        message: 'Analytics snapshot generated successfully'
      }
    });
  } catch (error) {
    console.error('Generate snapshot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate analytics snapshot',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get performance insights and recommendations
export const getPerformanceInsights = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id;
    const { websiteId } = req.params;

    if (!organizationId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    if (!websiteId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Website ID is required' 
      });
    }

    const insights = await analyticsService.getPerformanceInsights(organizationId, websiteId);

    return res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Get performance insights error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance insights',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get competitor analysis
export const getCompetitorAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id;
    const { websiteId } = req.params;
    const { competitorIds, analysisType = 'full' } = req.body;

    if (!organizationId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    if (!websiteId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Website ID is required' 
      });
    }

    const analysis = await competitorAnalysisService.analyzeCompetitors({
      organizationId,
      websiteId,
      competitorIds,
      analysisType
    });

    return res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Get competitor analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform competitor analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get competitor summary
export const getCompetitorSummary = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id;

    if (!organizationId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    const competitors = await analyticsService.getCompetitorSummary(organizationId);

    return res.json({
      success: true,
      data: {
        competitors
      }
    });
  } catch (error) {
    console.error('Get competitor summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve competitor summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get competitor trends
export const getCompetitorTrends = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id;
    const { competitorId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    if (!organizationId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    if (!competitorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Competitor ID is required' 
      });
    }

    const trends = await competitorAnalysisService.getCompetitorTrends(
      organizationId, 
      competitorId, 
      days
    );

    return res.json({
      success: true,
      data: {
        trends,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Get competitor trends error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve competitor trends',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get competitor keywords
export const getCompetitorKeywords = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id;
    const { competitorId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!organizationId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    if (!competitorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Competitor ID is required' 
      });
    }

    const keywords = await competitorAnalysisService.getCompetitorKeywords(
      organizationId, 
      competitorId, 
      limit
    );

    return res.json({
      success: true,
      data: {
        keywords
      }
    });
  } catch (error) {
    console.error('Get competitor keywords error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve competitor keywords',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Bulk generate snapshots for all websites (admin/cron use)
export const bulkGenerateSnapshots = async (req: AuthRequest, res: Response) => {
  try {
    const results = await analyticsService.scheduleSnapshots();

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        }
      }
    });
  } catch (error) {
    console.error('Bulk generate snapshots error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate bulk snapshots',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};