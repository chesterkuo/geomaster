import { Model, DataTypes, Sequelize } from 'sequelize';

export class MLOptimizationSuggestion extends Model {
  public id!: string;
  public organizationId!: string;
  public websiteId!: string;
  public modelId!: string;
  public suggestionType!: 'content' | 'technical' | 'ai_visibility' | 'keyword_strategy' | 'competitor_gap';
  public confidenceScore!: number;
  public priorityScore!: number;
  public estimatedImpact!: any;
  public suggestionData!: any;
  public implementationDifficulty!: 'easy' | 'medium' | 'hard';
  public estimatedTimeHours!: number | null;
  public status!: 'new' | 'reviewing' | 'accepted' | 'implemented' | 'rejected';
  public feedback!: string | null;
  public implementedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initMLOptimizationSuggestion = (sequelize: Sequelize): typeof MLOptimizationSuggestion => {
  MLOptimizationSuggestion.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      websiteId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'websites',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      modelId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'ml_models',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      suggestionType: {
        type: DataTypes.ENUM('content', 'technical', 'ai_visibility', 'keyword_strategy', 'competitor_gap'),
        allowNull: false
      },
      confidenceScore: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false
      },
      priorityScore: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false
      },
      estimatedImpact: {
        type: DataTypes.JSON,
        allowNull: false
      },
      suggestionData: {
        type: DataTypes.JSON,
        allowNull: false
      },
      implementationDifficulty: {
        type: DataTypes.ENUM('easy', 'medium', 'hard'),
        allowNull: false
      },
      estimatedTimeHours: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('new', 'reviewing', 'accepted', 'implemented', 'rejected'),
        defaultValue: 'new'
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      implementedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'MLOptimizationSuggestion',
      tableName: 'ml_optimization_suggestions',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['organization_id', 'website_id']
        },
        {
          fields: ['model_id', 'suggestion_type']
        },
        {
          fields: ['confidence_score', 'priority_score']
        },
        {
          fields: ['status']
        }
      ]
    }
  );

  return MLOptimizationSuggestion;
};