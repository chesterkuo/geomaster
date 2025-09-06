import AnalyticsSnapshot from '../models/AnalyticsSnapshot';
import KeywordRanking from '../models/KeywordRanking';
import CompetitorBenchmark from '../models/CompetitorBenchmark';
import Website from '../models/Website';
import Organization from '../models/Organization';
import { Op } from 'sequelize';

export interface MetricsData {
  aiVisibilityScore: number;
  totalMentions: number;
  averageRanking: number;
  platformBreakdown: Record<string, number>;
  topKeywords: Array<{
    keyword: string;
    ranking: number;
    visibilityScore: number;
  }>;
  competitorComparison: {
    betterThan: number;
    totalCompetitors: number;
    marketPosition: string;
  };
  trendData: {
    visibilityTrend: 'up' | 'down' | 'stable';
    changePercentage: number;
  };
}

export interface AnalyticsParams {
  organizationId: string;
  websiteId: string;
  snapshotType: 'daily' | 'weekly' | 'monthly';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

class AnalyticsService {
  // Generate new analytics snapshot
  async generateSnapshot(params: AnalyticsParams): Promise<AnalyticsSnapshot> {
    const { organizationId, websiteId, snapshotType } = params;

    // Collect current metrics
    const metrics = await this.collectMetrics(organizationId, websiteId);

    // Create snapshot
    return AnalyticsSnapshot.create({
      organizationId,
      websiteId,
      snapshotType,
      metrics,
      generatedAt: new Date()
    });
  }

  // Collect comprehensive metrics for snapshot
  private async collectMetrics(organizationId: string, websiteId: string): Promise<MetricsData> {
    // Get recent keyword rankings
    const rankings = await this.getRecentKeywordRankings(organizationId, websiteId);
    
    // Calculate visibility scores
    const aiVisibilityScore = this.calculateAverageVisibility(rankings);
    
    // Get platform breakdown
    const platformBreakdown = this.calculatePlatformBreakdown(rankings);
    
    // Get top performing keywords
    const topKeywords = this.getTopKeywords(rankings);
    
    // Get competitor comparison
    const competitorComparison = await this.getCompetitorComparison(organizationId, websiteId);
    
    // Calculate trend data
    const trendData = await this.calculateTrendData(organizationId, websiteId);

    return {
      aiVisibilityScore,
      totalMentions: rankings.reduce((sum, r) => sum + r.mentionsCount, 0),
      averageRanking: rankings.reduce((sum, r) => sum + r.rankingPosition, 0) / rankings.length || 0,
      platformBreakdown,
      topKeywords,
      competitorComparison,
      trendData
    };
  }

  // Get recent keyword rankings for analytics
  private async getRecentKeywordRankings(organizationId: string, websiteId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return KeywordRanking.findAll({
      where: {
        organizationId,
        websiteId,
        trackedAt: { [Op.gte]: since }
      },
      include: [
        {
          model: Website,
          as: 'website',
          attributes: ['name', 'domain']
        }
      ],
      order: [['trackedAt', 'DESC']]
    });
  }

  // Calculate average AI visibility score
  private calculateAverageVisibility(rankings: KeywordRanking[]): number {
    if (rankings.length === 0) return 0;
    
    const totalVisibility = rankings.reduce((sum, ranking) => sum + ranking.visibilityScore, 0);
    return Math.round(totalVisibility / rankings.length);
  }

  // Calculate performance breakdown by platform
  private calculatePlatformBreakdown(rankings: KeywordRanking[]): Record<string, number> {
    const platformData = rankings.reduce((acc, ranking) => {
      if (!acc[ranking.platform]) {
        acc[ranking.platform] = { total: 0, count: 0 };
      }
      acc[ranking.platform].total += ranking.visibilityScore;
      acc[ranking.platform].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const breakdown: Record<string, number> = {};
    for (const platform in platformData) {
      const data = platformData[platform];
      breakdown[platform] = Math.round(data.total / data.count);
    }

    return breakdown;
  }

  // Get top performing keywords
  private getTopKeywords(rankings: KeywordRanking[], limit: number = 10) {
    return rankings
      .sort((a, b) => b.visibilityScore - a.visibilityScore)
      .slice(0, limit)
      .map(ranking => ({
        keyword: (ranking as any).keyword?.keyword || 'Unknown',
        ranking: ranking.rankingPosition,
        visibilityScore: ranking.visibilityScore
      }));
  }

  // Get competitor comparison data
  private async getCompetitorComparison(organizationId: string, websiteId: string) {
    // Get recent competitor benchmarks
    const competitorBenchmarks = await CompetitorBenchmark.findAll({
      where: { organizationId },
      order: [['analyzedAt', 'DESC']]
    });

    // Get your current visibility score
    const latestSnapshot = await AnalyticsSnapshot.findOne({
      where: { organizationId, websiteId },
      order: [['generatedAt', 'DESC']]
    });

    const yourScore = latestSnapshot?.metrics?.aiVisibilityScore || 0;
    const betterThan = competitorBenchmarks.filter(
      benchmark => yourScore > benchmark.aiVisibilityScore
    ).length;

    return {
      betterThan,
      totalCompetitors: competitorBenchmarks.length,
      marketPosition: this.determineMarketPosition(yourScore, competitorBenchmarks)
    };
  }

  // Determine market position based on competitor scores
  private determineMarketPosition(yourScore: number, competitors: CompetitorBenchmark[]): string {
    if (competitors.length === 0) return 'unknown';
    
    const averageScore = competitors.reduce((sum, c) => sum + c.aiVisibilityScore, 0) / competitors.length;
    const topScore = Math.max(...competitors.map(c => c.aiVisibilityScore));
    
    if (yourScore >= topScore * 0.9) return 'leader';
    if (yourScore >= averageScore * 1.1) return 'above_average';
    if (yourScore >= averageScore * 0.9) return 'average';
    return 'below_average';
  }

  // Calculate trend data by comparing with previous period
  private async calculateTrendData(organizationId: string, websiteId: string) {
    const snapshots = await AnalyticsSnapshot.findAll({
      where: { organizationId, websiteId },
      order: [['generatedAt', 'DESC']],
      limit: 2
    });

    if (snapshots.length < 2) {
      return {
        visibilityTrend: 'stable' as const,
        changePercentage: 0
      };
    }

    const [current, previous] = snapshots;
    const currentScore = current.metrics.aiVisibilityScore;
    const previousScore = previous.metrics.aiVisibilityScore;
    
    const changePercentage = previousScore > 0 
      ? Math.round(((currentScore - previousScore) / previousScore) * 100)
      : 0;

    let visibilityTrend: 'up' | 'down' | 'stable' = 'stable';
    if (changePercentage > 5) visibilityTrend = 'up';
    else if (changePercentage < -5) visibilityTrend = 'down';

    return {
      visibilityTrend,
      changePercentage
    };
  }

  // Get analytics dashboard data
  async getDashboardData(organizationId: string, websiteId: string) {
    // Get latest snapshot
    const latestSnapshot = await AnalyticsSnapshot.findOne({
      where: { organizationId, websiteId },
      order: [['generatedAt', 'DESC']]
    });

    if (!latestSnapshot) {
      // Generate first snapshot if none exists
      return this.generateSnapshot({
        organizationId,
        websiteId,
        snapshotType: 'daily'
      });
    }

    return latestSnapshot;
  }

  // Get trend data for charts
  async getTrendData(organizationId: string, websiteId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await AnalyticsSnapshot.findAll({
      where: {
        organizationId,
        websiteId,
        generatedAt: { [Op.gte]: since }
      },
      order: [['generatedAt', 'ASC']]
    });

    return snapshots.map(snapshot => ({
      date: snapshot.generatedAt,
      aiVisibilityScore: snapshot.metrics.aiVisibilityScore,
      totalMentions: snapshot.metrics.totalMentions,
      averageRanking: snapshot.metrics.averageRanking
    }));
  }

  // Get platform performance comparison
  async getPlatformPerformance(organizationId: string, websiteId: string) {
    const rankings = await this.getRecentKeywordRankings(organizationId, websiteId, 7);
    return this.calculatePlatformBreakdown(rankings);
  }

  // Get competitor performance summary
  async getCompetitorSummary(organizationId: string) {
    const benchmarks = await CompetitorBenchmark.findAll({
      where: { organizationId },
      include: [
        {
          model: Website,
          as: 'website',
          attributes: ['name', 'domain']
        }
      ],
      order: [['aiVisibilityScore', 'DESC']]
    });

    return benchmarks.map(benchmark => ({
      competitorId: benchmark.competitorId,
      name: (benchmark as any).website?.name || 'Unknown',
      domain: (benchmark as any).website?.domain || '',
      visibilityScore: benchmark.aiVisibilityScore,
      marketPosition: benchmark.marketPosition,
      lastAnalyzed: benchmark.analyzedAt
    }));
  }

  // Schedule automatic snapshot generation
  async scheduleSnapshots() {
    // This would typically be called by a cron job or scheduler
    // Get all active websites
    const websites = await Website.findAll({
      where: { isActive: true },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id']
        }
      ]
    });

    const results = [];
    for (const website of websites) {
      try {
        const snapshot = await this.generateSnapshot({
          organizationId: website.organizationId,
          websiteId: website.id,
          snapshotType: 'daily'
        });
        results.push({ websiteId: website.id, success: true, snapshotId: snapshot.id });
      } catch (error) {
        results.push({ 
          websiteId: website.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return results;
  }

  // Get performance insights and recommendations
  async getPerformanceInsights(organizationId: string, websiteId: string) {
    const latestSnapshot = await this.getDashboardData(organizationId, websiteId);
    const trendData = await this.calculateTrendData(organizationId, websiteId);
    const competitorComparison = await this.getCompetitorComparison(organizationId, websiteId);

    const insights: string[] = [];
    const recommendations: string[] = [];

    // Generate insights based on data
    if (latestSnapshot.metrics.aiVisibilityScore < 40) {
      insights.push('Your AI visibility score is below average');
      recommendations.push('Focus on optimizing content for AI platforms');
    }

    if (trendData.visibilityTrend === 'down') {
      insights.push(`Visibility has declined by ${Math.abs(trendData.changePercentage)}% recently`);
      recommendations.push('Review recent content changes and competitor activities');
    }

    if (competitorComparison.betterThan < competitorComparison.totalCompetitors / 2) {
      insights.push('You are performing below most competitors');
      recommendations.push('Analyze top competitor strategies and keywords');
    }

    return {
      insights,
      recommendations,
      summary: {
        overallHealth: latestSnapshot.metrics.aiVisibilityScore > 60 ? 'good' : 'needs_improvement',
        keyMetrics: {
          visibilityScore: latestSnapshot.metrics.aiVisibilityScore,
          trend: trendData.visibilityTrend,
          competitorRank: competitorComparison.betterThan + 1
        }
      }
    };
  }
}

export default new AnalyticsService();