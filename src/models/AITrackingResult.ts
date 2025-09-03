import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { AI_PLATFORMS } from '../config/constants';

interface AITrackingResultAttributes {
  id: string;
  websiteId: string;
  keywordId?: string;
  platform: typeof AI_PLATFORMS[keyof typeof AI_PLATFORMS];
  query: string;
  isMentioned: boolean;
  isCited: boolean;
  citationPosition?: number;
  snippet?: string;
  fullResponse?: string;
  competitorMentions?: object;
  trackedAt: Date;
}

interface AITrackingResultCreationAttributes extends Optional<AITrackingResultAttributes, 'id' | 'isMentioned' | 'isCited' | 'trackedAt'> {}

class AITrackingResult extends Model<AITrackingResultAttributes, AITrackingResultCreationAttributes> implements AITrackingResultAttributes {
  public id!: string;
  public websiteId!: string;
  public keywordId?: string;
  public platform!: typeof AI_PLATFORMS[keyof typeof AI_PLATFORMS];
  public query!: string;
  public isMentioned!: boolean;
  public isCited!: boolean;
  public citationPosition?: number;
  public snippet?: string;
  public fullResponse?: string;
  public competitorMentions?: object;
  public trackedAt!: Date;

  // Instance methods
  getCompetitorMentionsArray(): string[] {
    if (!this.competitorMentions || typeof this.competitorMentions !== 'object') {
      return [];
    }
    return Object.keys(this.competitorMentions);
  }

  getVisibilityScore(): number {
    let score = 0;
    
    // Base score for being mentioned
    if (this.isMentioned) {
      score += 50;
    }
    
    // Additional score for being cited
    if (this.isCited) {
      score += 30;
      
      // Higher score for better citation position
      if (this.citationPosition) {
        const positionScore = Math.max(0, 20 - (this.citationPosition - 1) * 2);
        score += positionScore;
      }
    }
    
    return Math.min(100, score);
  }

  isPrimaryMention(): boolean {
    return this.isCited && (this.citationPosition || 0) <= 3;
  }

  hasSnippet(): boolean {
    return Boolean(this.snippet && this.snippet.length > 0);
  }

  async updateMentionStatus(mentioned: boolean, cited: boolean, position?: number): Promise<void> {
    this.isMentioned = mentioned;
    this.isCited = cited;
    if (position !== undefined) {
      this.citationPosition = position;
    }
    await this.save();
  }
}

AITrackingResult.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    websiteId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'website_id',
      references: {
        model: 'websites',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    keywordId: {
      type: DataTypes.UUID,
      field: 'keyword_id',
      references: {
        model: 'keywords',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    platform: {
      type: DataTypes.ENUM(...Object.values(AI_PLATFORMS)),
      allowNull: false
    },
    query: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isMentioned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_mentioned'
    },
    isCited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_cited'
    },
    citationPosition: {
      type: DataTypes.INTEGER,
      field: 'citation_position',
      validate: {
        min: 1
      }
    },
    snippet: {
      type: DataTypes.TEXT
    },
    fullResponse: {
      type: DataTypes.TEXT('long'),
      field: 'full_response'
    },
    competitorMentions: {
      type: DataTypes.JSON,
      field: 'competitor_mentions'
    },
    trackedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'tracked_at'
    }
  },
  {
    sequelize,
    modelName: 'AITrackingResult',
    tableName: 'ai_tracking_results',
    timestamps: false,
    underscored: true
  }
);

export default AITrackingResult;