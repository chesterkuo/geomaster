import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/database';

export interface RelatedKeyword {
  keyword: string;
  relevance_score: number;
  search_volume?: number;
  difficulty?: number;
}

export interface KeywordResearchAttributes {
  id: string;
  organizationId: string;
  keyword: string;
  searchVolume: number;
  difficultyScore: number;
  cpcEstimate: number;
  relatedKeywords?: RelatedKeyword[];
  competitionLevel: 'low' | 'medium' | 'high';
  researchDate: Date;
  dataSource: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeywordResearchCreationAttributes 
  extends Optional<KeywordResearchAttributes, 'id' | 'searchVolume' | 'difficultyScore' | 'cpcEstimate' | 'competitionLevel' | 'dataSource' | 'createdAt' | 'updatedAt'> {}

class KeywordResearch extends Model<KeywordResearchAttributes, KeywordResearchCreationAttributes> 
  implements KeywordResearchAttributes {
  public id!: string;
  public organizationId!: string;
  public keyword!: string;
  public searchVolume!: number;
  public difficultyScore!: number;
  public cpcEstimate!: number;
  public relatedKeywords?: RelatedKeyword[];
  public competitionLevel!: 'low' | 'medium' | 'high';
  public researchDate!: Date;
  public dataSource!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public static associate(models: any) {
    KeywordResearch.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });

    KeywordResearch.hasMany(models.KeywordRanking, {
      foreignKey: 'keywordId',
      as: 'rankings'
    });
  }

  // Static methods for keyword analysis
  public static async findTopKeywordsByVolume(organizationId: string, limit: number = 10) {
    return this.findAll({
      where: { organizationId },
      order: [['searchVolume', 'DESC']],
      limit
    });
  }

  public static async findKeywordsByDifficulty(organizationId: string, maxDifficulty: number = 50) {
    return this.findAll({
      where: { 
        organizationId,
        difficultyScore: { [Op.lte]: maxDifficulty }
      },
      order: [['searchVolume', 'DESC']]
    });
  }

  public static async getKeywordOpportunities(organizationId: string) {
    // Find keywords with high volume but low difficulty
    return this.findAll({
      where: {
        organizationId,
        searchVolume: { [Op.gte]: 1000 },
        difficultyScore: { [Op.lte]: 40 },
        competitionLevel: ['low', 'medium']
      },
      order: [
        ['searchVolume', 'DESC'],
        ['difficultyScore', 'ASC']
      ]
    });
  }

  // Instance methods
  public getOpportunityScore(): number {
    // Calculate opportunity score based on volume, difficulty, and competition
    const volumeScore = Math.min(this.searchVolume / 10000, 1) * 40; // Max 40 points
    const difficultyScore = (100 - this.difficultyScore) * 0.3; // Max 30 points
    const competitionScore = this.getCompetitionScore() * 30; // Max 30 points
    
    return Math.round(volumeScore + difficultyScore + competitionScore);
  }

  public getCompetitionScore(): number {
    switch (this.competitionLevel) {
      case 'low': return 1.0;
      case 'medium': return 0.6;
      case 'high': return 0.2;
      default: return 0.5;
    }
  }

  public isLongTailKeyword(): boolean {
    return this.keyword.split(' ').length >= 3;
  }

  public getKeywordInsights() {
    return {
      keyword: this.keyword,
      searchVolume: this.searchVolume,
      difficulty: this.difficultyScore,
      competition: this.competitionLevel,
      opportunityScore: this.getOpportunityScore(),
      isLongTail: this.isLongTailKeyword(),
      cpcEstimate: this.cpcEstimate,
      relatedCount: this.relatedKeywords?.length || 0
    };
  }

  public formatForExport() {
    return {
      keyword: this.keyword,
      'Search Volume': this.searchVolume,
      'Difficulty Score': this.difficultyScore,
      'Competition Level': this.competitionLevel,
      'CPC Estimate': `$${this.cpcEstimate}`,
      'Opportunity Score': this.getOpportunityScore(),
      'Keyword Type': this.isLongTailKeyword() ? 'Long-tail' : 'Short-tail',
      'Research Date': this.researchDate.toISOString().split('T')[0],
      'Data Source': this.dataSource
    };
  }
}

KeywordResearch.init(
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
    keyword: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    searchVolume: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'search_volume',
    },
    difficultyScore: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'difficulty_score',
    },
    cpcEstimate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'cpc_estimate',
    },
    relatedKeywords: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'related_keywords',
      get() {
        const value = this.getDataValue('relatedKeywords');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
    },
    competitionLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
      field: 'competition_level',
    },
    researchDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'research_date',
    },
    dataSource: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'internal',
      field: 'data_source',
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
    tableName: 'keyword_research',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organization_id', 'keyword'],
      },
      {
        fields: ['keyword', 'research_date'],
      },
      {
        fields: ['difficulty_score'],
      },
      {
        fields: ['competition_level'],
      },
      {
        fields: ['search_volume'],
      },
    ],
  }
);

export default KeywordResearch;