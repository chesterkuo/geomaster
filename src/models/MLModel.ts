import { Model, DataTypes, Sequelize } from 'sequelize';

export class MLModel extends Model {
  public id!: string;
  public name!: string;
  public modelType!: 'content_optimization' | 'competitor_analysis' | 'keyword_prediction' | 'trend_forecast';
  public version!: string;
  public algorithm!: string;
  public trainingDataSize!: number;
  public accuracyScore!: number | null;
  public precisionScore!: number | null;
  public recallScore!: number | null;
  public f1Score!: number | null;
  public modelFilePath!: string | null;
  public hyperparameters!: any;
  public featureWeights!: any;
  public isActive!: boolean;
  public trainedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initMLModel = (sequelize: Sequelize): typeof MLModel => {
  MLModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      modelType: {
        type: DataTypes.ENUM('content_optimization', 'competitor_analysis', 'keyword_prediction', 'trend_forecast'),
        allowNull: false
      },
      version: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      algorithm: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      trainingDataSize: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      accuracyScore: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true
      },
      precisionScore: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true
      },
      recallScore: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true
      },
      f1Score: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true
      },
      modelFilePath: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      hyperparameters: {
        type: DataTypes.JSON,
        allowNull: true
      },
      featureWeights: {
        type: DataTypes.JSON,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      trainedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'MLModel',
      tableName: 'ml_models',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['name', 'version']
        },
        {
          fields: ['model_type', 'is_active']
        },
        {
          fields: ['accuracy_score']
        }
      ]
    }
  );

  return MLModel;
};