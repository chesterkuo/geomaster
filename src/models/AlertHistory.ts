import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ALERT_TYPES } from './AlertConfiguration';

// Notification status enum
export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed'
} as const;

// Trigger data interface
export interface TriggerData {
  metric: string;
  currentValue: number;
  previousValue?: number;
  threshold: number;
  changePercentage?: number;
  platform?: string;
  query?: string;
  snippet?: string;
  mentionContext?: string;
  sentiment?: string;
  additionalData?: Record<string, any>;
}

interface AlertHistoryAttributes {
  id: string;
  alertConfigId: string;
  organizationId: string;
  websiteId?: string;
  alertType: typeof ALERT_TYPES[keyof typeof ALERT_TYPES];
  triggerData: TriggerData;
  notificationStatus: typeof NOTIFICATION_STATUS[keyof typeof NOTIFICATION_STATUS];
  notificationChannels?: string[];
  errorMessage?: string;
  triggeredAt?: Date;
  notifiedAt?: Date;
}

interface AlertHistoryCreationAttributes extends Optional<AlertHistoryAttributes, 
  'id' | 'notificationStatus' | 'triggeredAt'> {}

class AlertHistory extends Model<AlertHistoryAttributes, AlertHistoryCreationAttributes> 
  implements AlertHistoryAttributes {
  
  public id!: string;
  public alertConfigId!: string;
  public organizationId!: string;
  public websiteId?: string;
  public alertType!: typeof ALERT_TYPES[keyof typeof ALERT_TYPES];
  public triggerData!: TriggerData;
  public notificationStatus!: typeof NOTIFICATION_STATUS[keyof typeof NOTIFICATION_STATUS];
  public notificationChannels?: string[];
  public errorMessage?: string;
  public readonly triggeredAt!: Date;
  public notifiedAt?: Date;

  // Instance methods
  async markSent(): Promise<void> {
    this.notificationStatus = NOTIFICATION_STATUS.SENT;
    this.notifiedAt = new Date();
    await this.save();
  }

  async markFailed(errorMessage: string): Promise<void> {
    this.notificationStatus = NOTIFICATION_STATUS.FAILED;
    this.errorMessage = errorMessage;
    await this.save();
  }

  getFormattedTriggerData(): string {
    const data = this.triggerData;
    if (!data) return 'No trigger data available';

    let message = `${data.metric}: ${data.currentValue}`;
    
    if (data.previousValue !== undefined) {
      message += ` (was: ${data.previousValue})`;
    }
    
    if (data.changePercentage !== undefined) {
      const direction = data.changePercentage > 0 ? 'increase' : 'decrease';
      message += ` - ${Math.abs(data.changePercentage)}% ${direction}`;
    }
    
    if (data.platform) {
      message += ` on ${data.platform}`;
    }

    return message;
  }

  shouldRetryNotification(): boolean {
    if (this.notificationStatus !== NOTIFICATION_STATUS.FAILED) {
      return false;
    }

    // Retry failed notifications within 24 hours
    const dayInMs = 24 * 60 * 60 * 1000;
    const timeSinceFailure = Date.now() - this.triggeredAt.getTime();
    
    return timeSinceFailure < dayInMs;
  }
}

AlertHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    alertConfigId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'alert_config_id',
      references: {
        model: 'alert_configurations',
        key: 'id'
      },
      onDelete: 'CASCADE'
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
    alertType: {
      type: DataTypes.ENUM(...Object.values(ALERT_TYPES)),
      allowNull: false,
      field: 'alert_type'
    },
    triggerData: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'trigger_data',
      validate: {
        isValidTriggerData(value: any) {
          if (!value || typeof value !== 'object') {
            throw new Error('Trigger data must be an object');
          }
          if (!value.metric || typeof value.currentValue !== 'number') {
            throw new Error('Trigger data must include metric and currentValue');
          }
        }
      }
    },
    notificationStatus: {
      type: DataTypes.ENUM(...Object.values(NOTIFICATION_STATUS)),
      defaultValue: NOTIFICATION_STATUS.PENDING,
      field: 'notification_status'
    },
    notificationChannels: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'notification_channels'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message'
    },
    triggeredAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'triggered_at'
    },
    notifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'notified_at'
    }
  },
  {
    sequelize,
    modelName: 'AlertHistory',
    tableName: 'alert_history',
    timestamps: false, // Using custom timestamp fields
    underscored: true,
    indexes: [
      {
        name: 'idx_alert_config',
        fields: ['alert_config_id']
      },
      {
        name: 'idx_organization',
        fields: ['organization_id']
      },
      {
        name: 'idx_website',
        fields: ['website_id']
      },
      {
        name: 'idx_triggered_at',
        fields: [{name: 'triggered_at', order: 'DESC'}]
      },
      {
        name: 'idx_type_status',
        fields: ['alert_type', 'notification_status']
      }
    ]
  }
);

export default AlertHistory;