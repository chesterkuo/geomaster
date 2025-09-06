import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Alert types enum
export const ALERT_TYPES = {
  MENTION_SPIKE: 'mention_spike',
  VISIBILITY_DROP: 'visibility_drop',
  COMPETITOR_OUTRANK: 'competitor_outrank',
  SCORE_CHANGE: 'score_change',
  NEW_MENTION: 'new_mention',
  SENTIMENT_CHANGE: 'sentiment_change'
} as const;

// Notification channels enum
export const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SLACK: 'slack',
  WEBHOOK: 'webhook',
  IN_APP: 'in_app'
} as const;

// Alert condition interface
export interface AlertCondition {
  metric: 'mention_count' | 'sentiment_score' | 'visibility_percentage' | 'geo_score';
  operator: 'greater_than' | 'less_than' | 'equals' | 'percentage_change';
  value: number;
  timeframe: '1h' | '1d' | '7d' | '30d';
}

interface AlertConfigurationAttributes {
  id: string;
  organizationId: string;
  websiteId?: string;
  name: string;
  description?: string;
  alertType: typeof ALERT_TYPES[keyof typeof ALERT_TYPES];
  conditions: AlertCondition[];
  notificationChannels?: string[];
  isActive: boolean;
  cooldownMinutes: number;
  lastTriggeredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AlertConfigurationCreationAttributes extends Optional<AlertConfigurationAttributes, 
  'id' | 'isActive' | 'cooldownMinutes' | 'createdAt' | 'updatedAt'> {}

class AlertConfiguration extends Model<AlertConfigurationAttributes, AlertConfigurationCreationAttributes> 
  implements AlertConfigurationAttributes {
  
  public id!: string;
  public organizationId!: string;
  public websiteId?: string;
  public name!: string;
  public description?: string;
  public alertType!: typeof ALERT_TYPES[keyof typeof ALERT_TYPES];
  public conditions!: AlertCondition[];
  public notificationChannels?: string[];
  public isActive!: boolean;
  public cooldownMinutes!: number;
  public lastTriggeredAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  canTrigger(): boolean {
    if (!this.isActive) return false;
    
    // Check cooldown period
    if (this.lastTriggeredAt) {
      const cooldownMs = this.cooldownMinutes * 60 * 1000;
      const timeSinceLastTrigger = Date.now() - this.lastTriggeredAt.getTime();
      return timeSinceLastTrigger > cooldownMs;
    }
    
    return true;
  }

  async markTriggered(): Promise<void> {
    this.lastTriggeredAt = new Date();
    await this.save();
  }

  getNotificationChannels(): string[] {
    return this.notificationChannels || ['email'];
  }

  validateConditions(): boolean {
    if (!Array.isArray(this.conditions) || this.conditions.length === 0) {
      return false;
    }

    return this.conditions.every(condition => 
      condition.metric && 
      condition.operator && 
      typeof condition.value === 'number' &&
      condition.timeframe
    );
  }
}

AlertConfiguration.init(
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
      allowNull: true,
      field: 'website_id',
      references: {
        model: 'websites',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    alertType: {
      type: DataTypes.ENUM(...Object.values(ALERT_TYPES)),
      allowNull: false,
      field: 'alert_type'
    },
    conditions: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidConditions(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Conditions must be an array');
          }
          if (value.length === 0) {
            throw new Error('At least one condition is required');
          }
        }
      }
    },
    notificationChannels: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'notification_channels',
      defaultValue: ['email']
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    cooldownMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 60,
      field: 'cooldown_minutes',
      validate: {
        min: 1,
        max: 1440 // 24 hours max
      }
    },
    lastTriggeredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_triggered_at'
    }
  },
  {
    sequelize,
    modelName: 'AlertConfiguration',
    tableName: 'alert_configurations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_organization',
        fields: ['organization_id']
      },
      {
        name: 'idx_website',
        fields: ['website_id']
      },
      {
        name: 'idx_type_active',
        fields: ['alert_type', 'is_active']
      }
    ]
  }
);

export default AlertConfiguration;