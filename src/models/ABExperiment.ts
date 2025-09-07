import { Model, DataTypes, Sequelize } from 'sequelize';

export class ABExperiment extends Model {
  public id!: string;
  public organizationId!: string;
  public websiteId!: string;
  public name!: string;
  public description!: string | null;
  public experimentType!: 'content_optimization' | 'seo_strategy' | 'ui_design' | 'keyword_targeting';
  public hypothesis!: string;
  public successMetric!: string;
  public targetMetricValue!: number | null;
  public significanceLevel!: number;
  public minimumSampleSize!: number;
  public trafficAllocation!: number;
  public status!: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  public startDate!: Date | null;
  public endDate!: Date | null;
  public expectedDurationDays!: number | null;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initABExperiment = (sequelize: Sequelize): typeof ABExperiment => {
  ABExperiment.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      experimentType: {
        type: DataTypes.ENUM('content_optimization', 'seo_strategy', 'ui_design', 'keyword_targeting'),
        allowNull: false
      },
      hypothesis: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      successMetric: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      targetMetricValue: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true
      },
      significanceLevel: {
        type: DataTypes.DECIMAL(4, 3),
        defaultValue: 0.050
      },
      minimumSampleSize: {
        type: DataTypes.INTEGER,
        defaultValue: 1000
      },
      trafficAllocation: {
        type: DataTypes.DECIMAL(4, 3),
        defaultValue: 0.500
      },
      status: {
        type: DataTypes.ENUM('draft', 'running', 'paused', 'completed', 'cancelled'),
        defaultValue: 'draft'
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      expectedDurationDays: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      }
    },
    {
      sequelize,
      modelName: 'ABExperiment',
      tableName: 'ab_experiments',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['organization_id', 'website_id']
        },
        {
          fields: ['status']
        },
        {
          fields: ['experiment_type']
        },
        {
          fields: ['start_date', 'end_date']
        },
        {
          fields: ['created_by']
        }
      ]
    }
  );

  return ABExperiment;
};