import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral: number;
  overall_score: number;
}

export interface KeywordPerformance {
  keyword: string;
  ranking: number;
  mentions: number;
  visibility_score: number;
}

export interface ContentGap {
  topic: string;
  competitor_strength: number;
  our_strength: number;
  opportunity_score: number;
}

export interface TechnicalComparison {
  page_speed: number;
  mobile_friendly: boolean;
  structured_data: boolean;
  ai_optimization_score: number;
}

export interface CompetitorBenchmarkAttributes {
  id: string;
  organizationId: string;
  websiteId: string;
  competitorId: string;
  aiVisibilityScore: number;
  mentionFrequency: number;
  sentimentAnalysis?: SentimentAnalysis;
  topKeywords?: KeywordPerformance[];
  contentGaps?: ContentGap[];
  technicalComparison?: TechnicalComparison;
  marketPosition: 'leading' | 'competitive' | 'lagging';
  recommendations?: string;
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitorBenchmarkCreationAttributes 
  extends Optional<CompetitorBenchmarkAttributes, 'id' | 'aiVisibilityScore' | 'mentionFrequency' | 'marketPosition' | 'analyzedAt' | 'createdAt' | 'updatedAt'> {}

class CompetitorBenchmark extends Model<CompetitorBenchmarkAttributes, CompetitorBenchmarkCreationAttributes> 
  implements CompetitorBenchmarkAttributes {
  public id!: string;
  public organizationId!: string;
  public websiteId!: string;
  public competitorId!: string;
  public aiVisibilityScore!: number;
  public mentionFrequency!: number;
  public sentimentAnalysis?: SentimentAnalysis;
  public topKeywords?: KeywordPerformance[];
  public contentGaps?: ContentGap[];
  public technicalComparison?: TechnicalComparison;
  public marketPosition!: 'leading' | 'competitive' | 'lagging';
  public recommendations?: string;
  public analyzedAt!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public static associate(models: any) {
    CompetitorBenchmark.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
    
    CompetitorBenchmark.belongsTo(models.Website, {
      foreignKey: 'websiteId',
      as: 'website'
    });

    CompetitorBenchmark.belongsTo(models.Competitor, {
      foreignKey: 'competitorId',
      as: 'competitor'
    });
  }

  // Instance methods
  public calculateMarketPosition(): 'leading' | 'competitive' | 'lagging' {
    // Determine market position based on scores
    if (this.aiVisibilityScore >= 80) return 'leading';
    if (this.aiVisibilityScore >= 50) return 'competitive';
    return 'lagging';
  }

  public getPerformanceMetrics() {
    return {
      aiVisibilityScore: this.aiVisibilityScore,
      mentionFrequency: this.mentionFrequency,
      marketPosition: this.marketPosition,
      lastAnalyzed: this.analyzedAt,
      overallSentiment: this.sentimentAnalysis?.overall_score || 0
    };
  }

  public getRecommendationsPrioritized() {
    const recommendations = this.recommendations?.split('\n') || [];
    return recommendations.map((rec, index) => ({
      priority: index + 1,
      recommendation: rec.trim(),
      category: this.categorizeRecommendation(rec)
    }));
  }

  private categorizeRecommendation(recommendation: string): string {
    if (recommendation.toLowerCase().includes('content')) return 'content';
    if (recommendation.toLowerCase().includes('technical')) return 'technical';
    if (recommendation.toLowerCase().includes('keyword')) return 'seo';
    return 'general';
  }
}

CompetitorBenchmark.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    organizationId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'organization_id',
    },
    websiteId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'website_id',
    },
    competitorId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'competitor_id',
    },
    aiVisibilityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'ai_visibility_score',
    },
    mentionFrequency: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'mention_frequency',
    },
    sentimentAnalysis: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'sentiment_analysis',
      get() {
        const value = this.getDataValue('sentimentAnalysis');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
    },
    topKeywords: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'top_keywords',
      get() {
        const value = this.getDataValue('topKeywords');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
    },
    contentGaps: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'content_gaps',
      get() {
        const value = this.getDataValue('contentGaps');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
    },
    technicalComparison: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'technical_comparison',
      get() {
        const value = this.getDataValue('technicalComparison');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
    },
    marketPosition: {
      type: DataTypes.ENUM('leading', 'competitive', 'lagging'),
      allowNull: false,
      defaultValue: 'competitive',
      field: 'market_position',
    },
    recommendations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    analyzedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'analyzed_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'competitor_benchmarks',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organization_id', 'competitor_id'],
      },
      {
        fields: ['website_id', 'analyzed_at'],
      },
      {
        fields: ['market_position'],
      },
      {
        fields: ['ai_visibility_score'],
      },
    ],
  }
);

export default CompetitorBenchmark;