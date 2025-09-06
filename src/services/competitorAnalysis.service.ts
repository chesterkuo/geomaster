import CompetitorBenchmark from '../models/CompetitorBenchmark';
import KeywordRanking from '../models/KeywordRanking';
import KeywordResearch from '../models/KeywordResearch';
import AnalyticsSnapshot from '../models/AnalyticsSnapshot';
import Competitor from '../models/Competitor';
import Website from '../models/Website';
import { Op } from 'sequelize';

export interface CompetitorAnalysisParams {
  organizationId: string;
  websiteId: string;
  competitorIds?: string[];
  keywordIds?: string[];
  analysisType?: 'full' | 'quick' | 'keywords_only';
}

export interface CompetitorInsights {
  competitorId: string;
  competitorName: string;
  marketPosition: 'leading' | 'competitive' | 'lagging';
  visibilityScore: number;
  strengthAreas: string[];
  weaknessAreas: string[];
  recommendedActions: string[];
}

export interface MarketAnalysisResult {
  competitorInsights: CompetitorInsights[];
  marketOverview: {
    totalCompetitors: number;
    averageVisibilityScore: number;
    marketLeaders: string[];
    emergingPlayers: string[];
  };
  yourPosition: {
    rank: number;
    visibilityScore: number;
    positionTrend: 'improving' | 'declining' | 'stable';
  };
}

class CompetitorAnalysisService {
  // Main competitor analysis method
  async analyzeCompetitors(params: CompetitorAnalysisParams): Promise<MarketAnalysisResult> {
    const { organizationId, websiteId, competitorIds, analysisType = 'full' } = params;

    // Get competitors (either specified ones or all active competitors)
    const competitors = await this.getCompetitors(organizationId, competitorIds);
    
    // Perform different types of analysis based on analysisType
    const competitorInsights = await Promise.all(
      competitors.map(competitor => this.analyzeCompetitor(organizationId, websiteId, competitor.id, analysisType))
    );

    // Calculate market overview
    const marketOverview = await this.calculateMarketOverview(competitorInsights);
    
    // Determine user's position
    const yourPosition = await this.calculateYourPosition(organizationId, websiteId, competitorInsights);

    return {
      competitorInsights,
      marketOverview,
      yourPosition
    };
  }

  // Analyze individual competitor
  private async analyzeCompetitor(
    organizationId: string, 
    websiteId: string, 
    competitorId: string,
    analysisType: string
  ): Promise<CompetitorInsights> {
    // Get existing benchmark or create new analysis
    let benchmark = await CompetitorBenchmark.findOne({
      where: { organizationId, websiteId, competitorId },
      include: [{ model: Competitor, as: 'competitor' }]
    });

    if (!benchmark || this.isAnalysisStale(benchmark.analyzedAt)) {
      benchmark = await this.performFreshAnalysis(organizationId, websiteId, competitorId, analysisType);
    }

    return this.formatCompetitorInsights(benchmark);
  }

  // Perform fresh competitor analysis
  private async performFreshAnalysis(
    organizationId: string,
    websiteId: string, 
    competitorId: string,
    analysisType: string
  ): Promise<CompetitorBenchmark> {
    // Get competitor data
    const competitor = await Competitor.findByPk(competitorId);
    if (!competitor) throw new Error('Competitor not found');

    // Analyze visibility across AI platforms
    const visibilityAnalysis = await this.analyzeAIVisibility(organizationId, competitorId);
    
    // Analyze keyword performance
    const keywordAnalysis = await this.analyzeKeywordPerformance(organizationId, competitorId);
    
    // Perform content gap analysis
    const contentGaps = await this.analyzeContentGaps(organizationId, websiteId, competitorId);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(visibilityAnalysis, keywordAnalysis, contentGaps);

    // Save benchmark results
    const benchmark = await CompetitorBenchmark.create({
      organizationId,
      websiteId,
      competitorId,
      aiVisibilityScore: visibilityAnalysis.overallScore,
      mentionFrequency: visibilityAnalysis.mentionFrequency,
      sentimentAnalysis: visibilityAnalysis.sentimentAnalysis,
      topKeywords: keywordAnalysis.topPerformers,
      contentGaps: contentGaps,
      technicalComparison: await this.getTechnicalComparison(competitorId),
      marketPosition: this.calculateMarketPosition(visibilityAnalysis.overallScore),
      recommendations: recommendations.join('\n'),
      analyzedAt: new Date()
    });

    return benchmark;
  }

  // Analyze AI platform visibility
  private async analyzeAIVisibility(organizationId: string, competitorId: string) {
    // Get recent keyword rankings for competitor
    const rankings = await KeywordRanking.findAll({
      where: { organizationId },
      include: [
        {
          model: Website,
          as: 'website',
          where: { /* competitor website filter */ }
        }
      ],
      order: [['trackedAt', 'DESC']],
      limit: 100
    });

    // Calculate platform-specific scores
    const platformScores = rankings.reduce((acc, ranking) => {
      if (!acc[ranking.platform]) {
        acc[ranking.platform] = { total: 0, count: 0, mentions: 0 };
      }
      acc[ranking.platform].total += ranking.visibilityScore;
      acc[ranking.platform].count += 1;
      acc[ranking.platform].mentions += ranking.mentionsCount;
      return acc;
    }, {} as Record<string, { total: number; count: number; mentions: number }>);

    // Calculate overall scores
    const averageScores = Object.keys(platformScores).map(platform => {
      const data = platformScores[platform];
      return {
        platform,
        averageScore: data.total / data.count,
        totalMentions: data.mentions
      };
    });

    const overallScore = averageScores.reduce((sum, p) => sum + p.averageScore, 0) / averageScores.length;
    const mentionFrequency = averageScores.reduce((sum, p) => sum + p.totalMentions, 0);

    return {
      overallScore: overallScore || 0,
      mentionFrequency: mentionFrequency || 0,
      platformBreakdown: averageScores,
      sentimentAnalysis: {
        positive: 70,
        negative: 20,
        neutral: 10,
        overall_score: 75
      }
    };
  }

  // Analyze keyword performance
  private async analyzeKeywordPerformance(organizationId: string, competitorId: string) {
    // This would involve analyzing competitor's keyword rankings
    // For now, return mock data structure
    return {
      topPerformers: [
        { keyword: 'ai tools', ranking: 3, mentions: 150, visibility_score: 85 },
        { keyword: 'chatbot platform', ranking: 5, mentions: 120, visibility_score: 78 }
      ],
      improvingKeywords: [],
      decliningKeywords: []
    };
  }

  // Analyze content gaps
  private async analyzeContentGaps(organizationId: string, websiteId: string, competitorId: string) {
    // This would involve comparing content topics and performance
    // For now, return mock data structure
    return [
      {
        topic: 'AI automation workflows',
        competitor_strength: 85,
        our_strength: 45,
        opportunity_score: 90
      },
      {
        topic: 'Enterprise integrations',
        competitor_strength: 70,
        our_strength: 80,
        opportunity_score: 25
      }
    ];
  }

  // Generate recommendations based on analysis
  private generateRecommendations(visibilityAnalysis: any, keywordAnalysis: any, contentGaps: any): string[] {
    const recommendations: string[] = [];

    // Visibility-based recommendations
    if (visibilityAnalysis.overallScore < 50) {
      recommendations.push('Focus on improving AI platform visibility through targeted content optimization');
    }

    // Keyword-based recommendations
    if (keywordAnalysis.topPerformers.length > 0) {
      recommendations.push(`Target high-performing competitor keywords: ${keywordAnalysis.topPerformers.slice(0, 3).map((k: any) => k.keyword).join(', ')}`);
    }

    // Content gap recommendations
    const highOpportunityGaps = contentGaps.filter((gap: any) => gap.opportunity_score > 70);
    if (highOpportunityGaps.length > 0) {
      recommendations.push(`Create content for high-opportunity topics: ${highOpportunityGaps.map((g: any) => g.topic).join(', ')}`);
    }

    return recommendations;
  }

  // Get technical comparison data
  private async getTechnicalComparison(competitorId: string) {
    // This would involve technical SEO analysis
    // For now, return mock data
    return {
      page_speed: 85,
      mobile_friendly: true,
      structured_data: true,
      ai_optimization_score: 75
    };
  }

  // Calculate market position
  private calculateMarketPosition(visibilityScore: number): 'leading' | 'competitive' | 'lagging' {
    if (visibilityScore >= 80) return 'leading';
    if (visibilityScore >= 50) return 'competitive';
    return 'lagging';
  }

  // Helper methods
  private async getCompetitors(organizationId: string, competitorIds?: string[]) {
    const where: any = { organizationId, isActive: true };
    if (competitorIds && competitorIds.length > 0) {
      where.id = competitorIds;
    }
    
    return Competitor.findAll({ where });
  }

  private isAnalysisStale(analyzedAt: Date): boolean {
    const daysSinceAnalysis = (Date.now() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceAnalysis > 7; // Consider analysis stale after 7 days
  }

  private async calculateMarketOverview(insights: CompetitorInsights[]) {
    const totalCompetitors = insights.length;
    const averageVisibilityScore = insights.reduce((sum, i) => sum + i.visibilityScore, 0) / totalCompetitors;
    
    const marketLeaders = insights
      .filter(i => i.marketPosition === 'leading')
      .map(i => i.competitorName);
    
    const emergingPlayers = insights
      .filter(i => i.marketPosition === 'competitive' && i.visibilityScore > averageVisibilityScore)
      .map(i => i.competitorName);

    return {
      totalCompetitors,
      averageVisibilityScore: Math.round(averageVisibilityScore),
      marketLeaders,
      emergingPlayers
    };
  }

  private async calculateYourPosition(organizationId: string, websiteId: string, competitorInsights: CompetitorInsights[]) {
    // Get your website's latest analytics snapshot
    const latestSnapshot = await AnalyticsSnapshot.findOne({
      where: { organizationId, websiteId },
      order: [['generatedAt', 'DESC']]
    });

    const yourVisibilityScore = latestSnapshot?.metrics?.aiVisibilityScore || 0;
    
    // Calculate rank compared to competitors
    const allScores = [...competitorInsights.map(c => c.visibilityScore), yourVisibilityScore];
    allScores.sort((a, b) => b - a);
    const rank = allScores.indexOf(yourVisibilityScore) + 1;

    return {
      rank,
      visibilityScore: yourVisibilityScore,
      positionTrend: 'stable' as const // TODO: Calculate based on historical data
    };
  }

  private formatCompetitorInsights(benchmark: CompetitorBenchmark): CompetitorInsights {
    return {
      competitorId: benchmark.competitorId,
      competitorName: (benchmark as any).competitor?.name || 'Unknown Competitor',
      marketPosition: benchmark.marketPosition,
      visibilityScore: benchmark.aiVisibilityScore,
      strengthAreas: this.identifyStrengths(benchmark),
      weaknessAreas: this.identifyWeaknesses(benchmark),
      recommendedActions: benchmark.recommendations?.split('\n') || []
    };
  }

  private identifyStrengths(benchmark: CompetitorBenchmark): string[] {
    const strengths: string[] = [];
    
    if (benchmark.aiVisibilityScore > 75) {
      strengths.push('High AI platform visibility');
    }
    
    if (benchmark.mentionFrequency > 100) {
      strengths.push('Strong mention frequency');
    }

    if (benchmark.sentimentAnalysis && benchmark.sentimentAnalysis.positive > 60) {
      strengths.push('Positive brand sentiment');
    }

    return strengths;
  }

  private identifyWeaknesses(benchmark: CompetitorBenchmark): string[] {
    const weaknesses: string[] = [];
    
    if (benchmark.aiVisibilityScore < 40) {
      weaknesses.push('Low AI platform visibility');
    }
    
    if (benchmark.mentionFrequency < 20) {
      weaknesses.push('Limited mention frequency');
    }

    if (benchmark.sentimentAnalysis && benchmark.sentimentAnalysis.negative > 40) {
      weaknesses.push('Negative brand sentiment');
    }

    return weaknesses;
  }

  // Public method to get competitor benchmark history
  async getCompetitorTrends(organizationId: string, competitorId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    return CompetitorBenchmark.findAll({
      where: {
        organizationId,
        competitorId,
        analyzedAt: { [Op.between]: [startDate, endDate] }
      },
      order: [['analyzedAt', 'ASC']]
    });
  }

  // Public method to get top performing competitor keywords
  async getCompetitorKeywords(organizationId: string, competitorId: string, limit: number = 20) {
    return KeywordRanking.findAll({
      where: { organizationId },
      include: [
        {
          model: Website,
          as: 'website',
          where: { /* competitor website filter */ }
        },
        {
          model: KeywordResearch,
          as: 'keyword',
          attributes: ['keyword', 'searchVolume', 'difficultyScore']
        }
      ],
      order: [['visibilityScore', 'DESC']],
      limit
    });
  }
}

export default new CompetitorAnalysisService();