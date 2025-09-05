import { DataTypes, Model, Association } from 'sequelize';
import sequelize from '../config/database';
import Organization from './Organization';

export interface TrackingSettingsAttributes {
  id: string;
  organizationId: string;
  trackingEnabled: boolean;
  trackingFrequency: 'hourly' | 'daily' | 'weekly';
  platforms: string[]; // Array of enabled platforms: ['chatgpt', 'gemini', 'perplexity', 'claude']
  alertsEnabled: boolean;
  alertThreshold: number; // Minimum mention count to trigger alert
  alertEmails: string[]; // Array of email addresses for alerts
  settings: Record<string, any>; // Additional tracking settings
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TrackingSettingsCreationAttributes extends Omit<TrackingSettingsAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class TrackingSettings extends Model<TrackingSettingsAttributes, TrackingSettingsCreationAttributes> implements TrackingSettingsAttributes {
  public id!: string;
  public organizationId!: string;
  public trackingEnabled!: boolean;
  public trackingFrequency!: 'hourly' | 'daily' | 'weekly';
  public platforms!: string[];
  public alertsEnabled!: boolean;
  public alertThreshold!: number;
  public alertEmails!: string[];
  public settings!: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    organization: Association<TrackingSettings, Organization>;
  };
}

TrackingSettings.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'organization_id',
      references: {
        model: 'organizations',
        key: 'id',
      },
    },
    trackingEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'tracking_enabled',
    },
    trackingFrequency: {
      type: DataTypes.ENUM('hourly', 'daily', 'weekly'),
      allowNull: false,
      defaultValue: 'daily',
      field: 'tracking_frequency',
    },
    platforms: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ['chatgpt', 'gemini', 'perplexity', 'claude'],
    },
    alertsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'alerts_enabled',
    },
    alertThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      field: 'alert_threshold',
    },
    alertEmails: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'alert_emails',
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
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
    modelName: 'TrackingSettings',
    tableName: 'tracking_settings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['organization_id'],
        name: 'unique_org_tracking_settings',
      },
    ],
  }
);

export default TrackingSettings;