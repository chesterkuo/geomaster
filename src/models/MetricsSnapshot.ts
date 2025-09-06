import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Metric types enum
export const METRIC_TYPES = {
  MENTION_COUNT: 'mention_count',
  SENTIMENT_SCORE: 'sentiment_score',
  VISIBILITY_PERCENTAGE: 'visibility_percentage',
  GEO_SCORE: 'geo_score',
  COMPETITOR_RANK: 'competitor_rank'
} as const;

// Platform enum
export const PLATFORMS = {
  CHATGPT: 'chatgpt',
  GEMINI: 'gemini',
  PERPLEXITY: 'perplexity',
  CLAUDE: 'claude',
  ALL: 'all'
} as const;

// Time window enum
export const TIME_WINDOWS = {
  ONE_HOUR: '1h',
  ONE_DAY: '1d',
  SEVEN_DAYS: '7d',
  THIRTY_DAYS: '30d'
} as const;

interface MetricsSnapshotAttributes {
  id: string;
  organizationId: string;
  websiteId: string;
  metricType: typeof METRIC_TYPES[keyof typeof METRIC_TYPES];
  platform: typeof PLATFORMS[keyof typeof PLATFORMS];
  timeWindow: typeof TIME_WINDOWS[keyof typeof TIME_WINDOWS];
  metricValue: number;
  previousValue?: number;
  changePercentage?: number;
  snapshotAt?: Date;
}

interface MetricsSnapshotCreationAttributes extends Optional<MetricsSnapshotAttributes, 
  'id' | 'platform' | 'snapshotAt'> {}

class MetricsSnapshot extends Model<MetricsSnapshotAttributes, MetricsSnapshotCreationAttributes> 
  implements MetricsSnapshotAttributes {
  
  public id!: string;
  public organizationId!: string;
  public websiteId!: string;
  public metricType!: typeof METRIC_TYPES[keyof typeof METRIC_TYPES];
  public platform!: typeof PLATFORMS[keyof typeof PLATFORMS];
  public timeWindow!: typeof TIME_WINDOWS[keyof typeof TIME_WINDOWS];
  public metricValue!: number;
  public previousValue?: number;
  public changePercentage?: number;
  public readonly snapshotAt!: Date;

  // Static methods for metric calculations
  static async getLatestSnapshot(
    organizationId: string,
    websiteId: string,
    metricType: string,
    platform: string = PLATFORMS.ALL,
    timeWindow: string = TIME_WINDOWS.ONE_DAY
  ): Promise<MetricsSnapshot | null> {
    return await MetricsSnapshot.findOne({
      where: {
        organizationId,
        websiteId,
        metricType,
        platform,
        timeWindow
      },
      order: [['snapshotAt', 'DESC']]
    });
  }

  static async calculateChangePercentage(currentValue: number, previousValue: number): Promise<number> {
    if (!previousValue || previousValue === 0) {
      return currentValue > 0 ? 100 : 0;
    }
    
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  static async createSnapshot(data: {
    organizationId: string;
    websiteId: string;
    metricType: string;
    platform?: string;
    timeWindow: string;
    metricValue: number;
  }): Promise<MetricsSnapshot> {
    const { organizationId, websiteId, metricType, platform = PLATFORMS.ALL, timeWindow, metricValue } = data;

    // Get previous snapshot for change calculation
    const previousSnapshot = await MetricsSnapshot.getLatestSnapshot(
      organizationId,
      websiteId,
      metricType,
      platform,
      timeWindow
    );

    const previousValue = previousSnapshot?.metricValue;
    const changePercentage = previousValue !== undefined 
      ? await MetricsSnapshot.calculateChangePercentage(metricValue, previousValue)
      : undefined;

    return await MetricsSnapshot.create({
      organizationId,
      websiteId,
      metricType: metricType as typeof METRIC_TYPES[keyof typeof METRIC_TYPES],
      platform: platform as typeof PLATFORMS[keyof typeof PLATFORMS] | undefined,
      timeWindow: timeWindow as typeof TIME_WINDOWS[keyof typeof TIME_WINDOWS],
      metricValue,
      previousValue,
      changePercentage
    });
  }

  // Instance methods
  hasSignificantChange(threshold: number = 10): boolean {
    return this.changePercentage !== undefined && Math.abs(this.changePercentage) >= threshold;
  }

  isPositiveChange(): boolean {
    return this.changePercentage !== undefined && this.changePercentage > 0;
  }

  isNegativeChange(): boolean {
    return this.changePercentage !== undefined && this.changePercentage < 0;
  }

  getFormattedChange(): string {
    if (this.changePercentage === undefined) {
      return 'No change data available';
    }

    const direction = this.changePercentage > 0 ? '↑' : '↓';
    const percentage = Math.abs(this.changePercentage).toFixed(2);
    
    return `${direction} ${percentage}%`;
  }
}

MetricsSnapshot.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'organization_id',
      references: {
        model: 'organizations',
        key: 'id'
      },
      onDelete: 'CASCADE'
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
    metricType: {
      type: DataTypes.ENUM(...Object.values(METRIC_TYPES)),
      allowNull: false,
      field: 'metric_type'
    },
    platform: {
      type: DataTypes.ENUM(...Object.values(PLATFORMS)),
      defaultValue: PLATFORMS.ALL,
      allowNull: false
    },
    timeWindow: {
      type: DataTypes.ENUM(...Object.values(TIME_WINDOWS)),
      allowNull: false,
      field: 'time_window'
    },
    metricValue: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      field: 'metric_value',
      validate: {
        isDecimal: true,
        min: 0
      }
    },
    previousValue: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      field: 'previous_value',
      validate: {
        isDecimal: true,
        min: 0
      }
    },
    changePercentage: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      field: 'change_percentage',
      validate: {
        isDecimal: true
      }
    },
    snapshotAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'snapshot_at'
    }
  },
  {
    sequelize,
    modelName: 'MetricsSnapshot',
    tableName: 'metrics_snapshots',
    timestamps: false, // Using custom snapshotAt field
    underscored: true,
    indexes: [
      {
        name: 'idx_organization',
        fields: ['organization_id']
      },
      {
        name: 'idx_website_metric',
        fields: ['website_id', 'metric_type', 'platform']
      },
      {
        name: 'idx_snapshot_time',
        fields: [{name: 'snapshot_at', order: 'DESC'}]
      },
      {
        name: 'idx_metric_lookup',
        fields: ['organization_id', 'website_id', 'metric_type', 'time_window']
      }
    ]
  }
);

export default MetricsSnapshot;