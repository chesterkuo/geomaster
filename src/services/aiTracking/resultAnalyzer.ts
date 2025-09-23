import { TrackingResult, Mention, CompetitorMention } from '../platforms/aiPlatformInterface';
import { SentimentAnalyzer } from '../../utils/sentimentAnalyzer';

export interface AnalysisSummary {
  averageVisibilityScore: number;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  totalMentions: number;
  competitorAnalysis: CompetitorAnalysis[];
  insights: string[];
  trends: TrendAnalysis;
  recommendations: string[];
}

export interface CompetitorAnalysis {
  domain: string;
  name: string;
  mentionCount: number;
  averageVisibilityScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  relativePerformance: 'better' | 'similar' | 'worse';
}

export interface TrendAnalysis {
  visibilityTrend: 'increasing' | 'stable' | 'decreasing';
  sentimentTrend: 'improving' | 'stable' | 'declining';
  competitiveTrend: 'gaining' | 'stable' | 'losing';
  confidence: number;
}

export interface MentionAnalysis {
  platform: string;
  totalMentions: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  averageConfidence: number;
  citationQuality: {
    high: number;
    medium: number;
    low: number;
  };
}

export class ResultAnalyzer {
  private sentimentAnalyzer: SentimentAnalyzer;

  constructor() {
    this.sentimentAnalyzer = new SentimentAnalyzer();
  }

  generateSummary(results: TrackingResult[], errors: any[] = []): AnalysisSummary {
    // Calculate basic metrics
    const totalMentions = results.reduce((sum, result) => sum + result.mentions.length, 0);
    const averageVisibilityScore = this.calculateAverageVisibilityScore(results);
    const overallSentiment = this.calculateOverallSentiment(results);
    
    // Analyze competitors
    const competitorAnalysis = this.analyzeCompetitors(results);
    
    // Generate insights
    const insights = this.generateInsights(results, competitorAnalysis, errors);
    
    // Analyze trends (placeholder for now)
    const trends = this.analyzeTrends(results);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(results, competitorAnalysis, insights);

    return {
      averageVisibilityScore,
      overallSentiment,
      totalMentions,
      competitorAnalysis,
      insights,
      trends,
      recommendations
    };
  }

  analyzeMentionsByPlatform(results: TrackingResult[]): Map<string, MentionAnalysis> {
    const platformAnalysis = new Map<string, MentionAnalysis>();

    results.forEach(result => {
      const platform = result.platform;
      
      if (!platformAnalysis.has(platform)) {
        platformAnalysis.set(platform, {
          platform,
          totalMentions: 0,
          positiveCount: 0,
          neutralCount: 0,
          negativeCount: 0,
          averageConfidence: 0,
          citationQuality: { high: 0, medium: 0, low: 0 }
        });
      }

      const analysis = platformAnalysis.get(platform)!;
      analysis.totalMentions += result.mentions.length;

      result.mentions.forEach(mention => {
        switch (mention.sentiment) {
          case 'positive':
            analysis.positiveCount++;
            break;
          case 'negative':
            analysis.negativeCount++;
            break;
          default:
            analysis.neutralCount++;
        }

        switch (mention.citationQuality) {
          case 'high':
            analysis.citationQuality.high++;
            break;
          case 'low':
            analysis.citationQuality.low++;
            break;
          default:
            analysis.citationQuality.medium++;
        }
      });

      // Calculate average confidence
      if (result.mentions.length > 0) {
        const totalConfidence = result.mentions.reduce((sum, m) => sum + m.confidence, 0);
        analysis.averageConfidence = totalConfidence / result.mentions.length;
      }
    });

    return platformAnalysis;
  }

  analyzeVisibilityByQuery(results: TrackingResult[]): Map<string, number> {
    const queryVisibility = new Map<string, number>();

    results.forEach(result => {
      const visibilityScore = this.calculateResultVisibilityScore(result);
      queryVisibility.set(result.query, visibilityScore);
    });

    return queryVisibility;
  }

  detectAnomalies(results: TrackingResult[]): Array<{
    type: 'low_visibility' | 'negative_sentiment' | 'competitor_surge' | 'mention_drop';
    description: string;
    severity: 'low' | 'medium' | 'high';
    affected: string[];
  }> {
    const anomalies: any[] = [];

    // Check for low visibility
    const avgVisibility = this.calculateAverageVisibilityScore(results);
    if (avgVisibility < 20) {
      anomalies.push({
        type: 'low_visibility',
        description: `Overall visibility score is low (${avgVisibility.toFixed(1)})`,
        severity: 'high',
        affected: ['overall']
      });
    }

    // Check for negative sentiment spike
    const negativeResults = results.filter(r => 
      r.mentions.some(m => m.sentiment === 'negative')
    );
    
    if (negativeResults.length > results.length * 0.3) {
      anomalies.push({
        type: 'negative_sentiment',
        description: `High proportion of negative mentions detected (${negativeResults.length}/${results.length})`,
        severity: 'medium',
        affected: negativeResults.map(r => r.platform)
      });
    }

    // Check for competitor surge
    const competitorAnalysis = this.analyzeCompetitors(results);
    const strongCompetitors = competitorAnalysis.filter(c => 
      c.relativePerformance === 'better' && c.averageVisibilityScore > avgVisibility * 1.5
    );

    if (strongCompetitors.length > 0) {
      anomalies.push({
        type: 'competitor_surge',
        description: `Competitors showing strong performance: ${strongCompetitors.map(c => c.name).join(', ')}`,
        severity: 'medium',
        affected: strongCompetitors.map(c => c.domain)
      });
    }

    return anomalies;
  }

  private calculateAverageVisibilityScore(results: TrackingResult[]): number {
    if (results.length === 0) return 0;
    
    const scores = results.map(result => this.calculateResultVisibilityScore(result));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private calculateResultVisibilityScore(result: TrackingResult): number {
    if (result.mentions.length === 0) return 0;
    
    return result.mentions.reduce((sum, mention) => {
      let score = 10; // Base score per mention
      
      // Adjust for sentiment
      if (mention.sentiment === 'positive') score += 5;
      else if (mention.sentiment === 'negative') score -= 3;
      
      // Adjust for citation quality
      if (mention.citationQuality === 'high') score += 3;
      else if (mention.citationQuality === 'low') score -= 1;
      
      // Adjust for confidence
      score *= mention.confidence;
      
      return sum + score;
    }, 0) / result.mentions.length;
  }

  private calculateOverallSentiment(results: TrackingResult[]): 'positive' | 'neutral' | 'negative' {
    const allMentions = results.flatMap(result => result.mentions);
    
    if (allMentions.length === 0) return 'neutral';
    
    const sentimentCounts = {
      positive: allMentions.filter(m => m.sentiment === 'positive').length,
      neutral: allMentions.filter(m => m.sentiment === 'neutral').length,
      negative: allMentions.filter(m => m.sentiment === 'negative').length
    };
    
    const total = allMentions.length;
    const positiveRatio = sentimentCounts.positive / total;
    const negativeRatio = sentimentCounts.negative / total;
    
    if (positiveRatio > 0.4) return 'positive';
    if (negativeRatio > 0.3) return 'negative';
    return 'neutral';
  }

  private analyzeCompetitors(results: TrackingResult[]): CompetitorAnalysis[] {
    const competitorMap = new Map<string, {
      mentions: CompetitorMention[];
      totalScore: number;
      count: number;
    }>();

    // Collect competitor data
    results.forEach(result => {
      result.competitors.forEach(competitor => {
        const domain = competitor.competitorDomain;
        
        if (!competitorMap.has(domain)) {
          competitorMap.set(domain, {
            mentions: [],
            totalScore: 0,
            count: 0
          });
        }

        const data = competitorMap.get(domain)!;
        data.mentions.push(competitor);
        data.totalScore += competitor.visibilityScore;
        data.count++;
      });
    });

    // Calculate analysis for each competitor
    const targetAverageScore = this.calculateAverageVisibilityScore(results);
    
    return Array.from(competitorMap.entries()).map(([domain, data]) => {
      const averageScore = data.totalScore / data.count;
      const allMentions = data.mentions.flatMap(m => m.mentions);
      
      // Calculate sentiment
      const sentimentCounts = {
        positive: allMentions.filter(m => m.sentiment === 'positive').length,
        neutral: allMentions.filter(m => m.sentiment === 'neutral').length,
        negative: allMentions.filter(m => m.sentiment === 'negative').length
      };
      
      const dominantSentiment = Object.entries(sentimentCounts)
        .reduce((a, b) => sentimentCounts[a[0] as keyof typeof sentimentCounts] > sentimentCounts[b[0] as keyof typeof sentimentCounts] ? a : b)[0] as 'positive' | 'neutral' | 'negative';

      // Determine relative performance
      let relativePerformance: 'better' | 'similar' | 'worse';
      if (averageScore > targetAverageScore * 1.2) {
        relativePerformance = 'better';
      } else if (averageScore < targetAverageScore * 0.8) {
        relativePerformance = 'worse';
      } else {
        relativePerformance = 'similar';
      }

      return {
        domain,
        name: this.extractDomainName(domain),
        mentionCount: allMentions.length,
        averageVisibilityScore: averageScore,
        sentiment: dominantSentiment,
        relativePerformance
      };
    }).sort((a, b) => b.averageVisibilityScore - a.averageVisibilityScore);
  }

  private analyzeTrends(results: TrackingResult[]): TrendAnalysis {
    // Placeholder implementation - would need historical data for real trend analysis
    return {
      visibilityTrend: 'stable',
      sentimentTrend: 'stable',
      competitiveTrend: 'stable',
      confidence: 0.5
    };
  }

  private generateInsights(
    results: TrackingResult[], 
    competitorAnalysis: CompetitorAnalysis[], 
    errors: any[]
  ): string[] {
    const insights: string[] = [];
    
    const totalMentions = results.reduce((sum, r) => sum + r.mentions.length, 0);
    const avgVisibility = this.calculateAverageVisibilityScore(results);
    const overallSentiment = this.calculateOverallSentiment(results);

    // Visibility insights
    if (totalMentions === 0) {
      insights.push('No mentions found across all platforms - focus on increasing brand visibility');
    } else if (totalMentions < 5) {
      insights.push('Low mention count - consider improving SEO and content marketing');
    } else if (totalMentions > 20) {
      insights.push('Strong mention presence across platforms - good brand awareness');
    }

    // Sentiment insights
    if (overallSentiment === 'positive') {
      insights.push('Positive sentiment detected - good brand perception');
    } else if (overallSentiment === 'negative') {
      insights.push('Negative sentiment detected - may need reputation management');
    }

    // Competitive insights
    if (competitorAnalysis.length > 0) {
      const strongCompetitors = competitorAnalysis.filter(c => c.relativePerformance === 'better');
      if (strongCompetitors.length > 0) {
        insights.push(`Strong competitors identified: ${strongCompetitors.map(c => c.name).join(', ')}`);
      }

      const weakCompetitors = competitorAnalysis.filter(c => c.relativePerformance === 'worse');
      if (weakCompetitors.length > 0) {
        insights.push(`Opportunities to differentiate from: ${weakCompetitors.map(c => c.name).join(', ')}`);
      }
    }

    // Platform-specific insights
    const platformAnalysis = this.analyzeMentionsByPlatform(results);
    const bestPlatform = Array.from(platformAnalysis.entries())
      .sort((a, b) => b[1].totalMentions - a[1].totalMentions)[0];
    
    if (bestPlatform) {
      insights.push(`Strongest performance on ${bestPlatform[0]} platform`);
    }

    // Error insights
    if (errors.length > 0) {
      insights.push(`${errors.length} queries failed - may need API key validation or rate limit adjustment`);
    }

    return insights;
  }

  private generateRecommendations(
    results: TrackingResult[], 
    competitorAnalysis: CompetitorAnalysis[], 
    insights: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    const totalMentions = results.reduce((sum, r) => sum + r.mentions.length, 0);
    const avgVisibility = this.calculateAverageVisibilityScore(results);
    const overallSentiment = this.calculateOverallSentiment(results);

    // Visibility recommendations
    if (totalMentions === 0) {
      recommendations.push('Create more content and improve SEO to increase brand mentions');
      recommendations.push('Consider content marketing and thought leadership initiatives');
    } else if (avgVisibility < 30) {
      recommendations.push('Focus on improving content quality and relevance');
      recommendations.push('Engage more actively in industry discussions and forums');
    }

    // Sentiment recommendations
    if (overallSentiment === 'negative') {
      recommendations.push('Address negative feedback and improve customer satisfaction');
      recommendations.push('Implement reputation management strategies');
    } else if (overallSentiment === 'neutral') {
      recommendations.push('Work on creating more positive brand associations');
      recommendations.push('Highlight customer success stories and testimonials');
    }

    // Competitive recommendations
    const strongCompetitors = competitorAnalysis.filter(c => c.relativePerformance === 'better');
    if (strongCompetitors.length > 0) {
      recommendations.push(`Analyze and learn from top performers: ${strongCompetitors.map(c => c.name).join(', ')}`);
      recommendations.push('Identify unique value propositions to differentiate from competition');
    }

    // Platform-specific recommendations
    const platformAnalysis = this.analyzeMentionsByPlatform(results);
    const weakPlatforms = Array.from(platformAnalysis.entries())
      .filter(([_, analysis]) => analysis.totalMentions === 0)
      .map(([platform]) => platform);
    
    if (weakPlatforms.length > 0) {
      recommendations.push(`Focus on improving visibility on: ${weakPlatforms.join(', ')}`);
    }

    return recommendations;
  }

  private extractDomainName(url: string): string {
    try {
      const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      return domain.split('.')[0];
    } catch {
      return url;
    }
  }
}