import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AnalyticsSnapshotAttributes {
  id: string;
  organizationId: string;
  websiteId: string;
  snapshotType: 'daily' | 'weekly' | 'monthly';
  metrics: Record<string, any>;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsSnapshotCreationAttributes 
  extends Optional<AnalyticsSnapshotAttributes, 'id' | 'generatedAt' | 'createdAt' | 'updatedAt'> {}

class AnalyticsSnapshot extends Model<AnalyticsSnapshotAttributes, AnalyticsSnapshotCreationAttributes> 
  implements AnalyticsSnapshotAttributes {
  public id!: string;
  public organizationId!: string;
  public websiteId!: string;
  public snapshotType!: 'daily' | 'weekly' | 'monthly';
  public metrics!: Record<string, any>;
  public generatedAt!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public static associate(models: any) {
    AnalyticsSnapshot.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
    
    AnalyticsSnapshot.belongsTo(models.Website, {
      foreignKey: 'websiteId',
      as: 'website'
    });
  }

  // Instance methods
  public getMetricsForPeriod(startDate: Date, endDate: Date) {
    // Helper method to extract metrics for specific period
    return this.metrics;
  }

  public getTrendData() {
    // Helper method to format trend data
    const { metrics } = this;
    return {
      timestamp: this.generatedAt,
      type: this.snapshotType,
      values: metrics
    };
  }
}

AnalyticsSnapshot.init(
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
    snapshotType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false,
      field: 'snapshot_type',
    },
    metrics: {
      type: DataTypes.JSON,
      allowNull: false,
      get() {
        const value = this.getDataValue('metrics');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'generated_at',
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
    tableName: 'analytics_snapshots',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organization_id', 'snapshot_type'],
      },
      {
        fields: ['website_id', 'generated_at'],
      },
      {
        fields: ['organization_id', 'website_id', 'generated_at'],
      },
    ],
  }
);

export default AnalyticsSnapshot;