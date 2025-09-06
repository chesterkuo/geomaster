import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/database';

export type PlatformType = 'chatgpt' | 'gemini' | 'perplexity' | 'claude' | 'copilot' | 'meta' | 'poe';

export interface KeywordRankingAttributes {
  id: string;
  organizationId: string;
  websiteId: string;
  keywordId: string;
  platform: PlatformType;
  rankingPosition: number;
  visibilityScore: number;
  mentionsCount: number;
  trackedAt: Date;
  createdAt: Date;
}

export interface KeywordRankingCreationAttributes 
  extends Optional<KeywordRankingAttributes, 'id' | 'rankingPosition' | 'visibilityScore' | 'mentionsCount' | 'trackedAt' | 'createdAt'> {}

class KeywordRanking extends Model<KeywordRankingAttributes, KeywordRankingCreationAttributes> 
  implements KeywordRankingAttributes {
  public id!: string;
  public organizationId!: string;
  public websiteId!: string;
  public keywordId!: string;
  public platform!: PlatformType;
  public rankingPosition!: number;
  public visibilityScore!: number;
  public mentionsCount!: number;
  public trackedAt!: Date;
  public createdAt!: Date;

  // Associations
  public static associate(models: any) {
    KeywordRanking.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
    
    KeywordRanking.belongsTo(models.Website, {
      foreignKey: 'websiteId',
      as: 'website'
    });

    KeywordRanking.belongsTo(models.KeywordResearch, {
      foreignKey: 'keywordId',
      as: 'keyword'
    });
  }

  // Static methods for ranking analysis
  public static async getRankingTrends(websiteId: string, keywordId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.findAll({
      where: {
        websiteId,
        keywordId,
        trackedAt: { [Op.gte]: startDate }
      },
      order: [['trackedAt', 'ASC']]
    });
  }

  public static async getTopRankingKeywords(websiteId: string, platform?: PlatformType, limit: number = 10) {
    const whereClause: any = { websiteId };
    if (platform) whereClause.platform = platform;

    return this.findAll({
      where: whereClause,
      order: [
        ['visibilityScore', 'DESC'],
        ['rankingPosition', 'ASC']
      ],
      limit,
      include: [{
        model: sequelize.models.KeywordResearch,
        as: 'keyword',
        attributes: ['keyword', 'searchVolume', 'difficultyScore']
      }]
    });
  }

  public static async getPlatformPerformance(websiteId: string) {
    const results = await this.findAll({
      where: { websiteId },
      attributes: [
        'platform',
        [sequelize.fn('AVG', sequelize.col('visibility_score')), 'avgVisibility'],
        [sequelize.fn('AVG', sequelize.col('ranking_position')), 'avgRanking'],
        [sequelize.fn('SUM', sequelize.col('mentions_count')), 'totalMentions'],
        [sequelize.fn('COUNT', sequelize.col('*')), 'totalKeywords']
      ],
      group: ['platform']
    });

    return results.map((result: any) => ({
      platform: result.platform,
      avgVisibility: parseFloat(result.getDataValue('avgVisibility')),
      avgRanking: parseFloat(result.getDataValue('avgRanking')),
      totalMentions: parseInt(result.getDataValue('totalMentions')),
      totalKeywords: parseInt(result.getDataValue('totalKeywords'))
    }));
  }

  public static async getCompetitorRankings(organizationId: string, keywordId: string) {
    // This would involve joining with competitor websites
    return this.findAll({
      where: { organizationId, keywordId },
      include: [{
        model: sequelize.models.Website,
        as: 'website',
        attributes: ['name', 'domain']
      }],
      order: [['visibilityScore', 'DESC']]
    });
  }

  // Instance methods
  public getRankingTier(): 'top' | 'good' | 'average' | 'poor' {
    if (this.visibilityScore >= 80) return 'top';
    if (this.visibilityScore >= 60) return 'good';
    if (this.visibilityScore >= 40) return 'average';
    return 'poor';
  }

  public getPerformanceMetrics() {
    return {
      platform: this.platform,
      ranking: this.rankingPosition,
      visibility: this.visibilityScore,
      mentions: this.mentionsCount,
      tier: this.getRankingTier(),
      trackedAt: this.trackedAt
    };
  }

  public calculateTrendChange(previousRanking?: KeywordRanking): { 
    positionChange: number, 
    visibilityChange: number,
    trendDirection: 'up' | 'down' | 'stable'
  } {
    if (!previousRanking) {
      return { positionChange: 0, visibilityChange: 0, trendDirection: 'stable' };
    }

    const positionChange = previousRanking.rankingPosition - this.rankingPosition;
    const visibilityChange = this.visibilityScore - previousRanking.visibilityScore;
    
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    if (positionChange > 0 || visibilityChange > 5) trendDirection = 'up';
    else if (positionChange < 0 || visibilityChange < -5) trendDirection = 'down';

    return { positionChange, visibilityChange, trendDirection };
  }

  public isImproving(daysBack: number = 7): boolean {
    // This would require comparing with previous rankings
    // For now, return based on current visibility score
    return this.visibilityScore >= 60;
  }
}

KeywordRanking.init(
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
    keywordId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'keyword_id',
    },
    platform: {
      type: DataTypes.ENUM('chatgpt', 'gemini', 'perplexity', 'claude', 'copilot', 'meta', 'poe'),
      allowNull: false,
    },
    rankingPosition: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'ranking_position',
    },
    visibilityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'visibility_score',
    },
    mentionsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'mentions_count',
    },
    trackedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'tracked_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'keyword_rankings',
    timestamps: false, // Only using createdAt
    underscored: true,
    indexes: [
      {
        fields: ['website_id', 'keyword_id'],
      },
      {
        fields: ['keyword_id', 'platform'],
      },
      {
        fields: ['tracked_at'],
      },
      {
        fields: ['ranking_position'],
      },
      {
        fields: ['visibility_score'],
      },
    ],
  }
);

export default KeywordRanking;