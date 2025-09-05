import { DataTypes, Model, Association } from 'sequelize';
import sequelize from '../config/database';
import Organization from './Organization';

export interface PlatformSettingsAttributes {
  id: string;
  organizationId: string;
  platform: 'chatgpt' | 'gemini' | 'perplexity' | 'claude';
  enabled: boolean;
  settings: Record<string, any>; // Platform-specific settings
  apiKey?: string; // Platform API key (encrypted)
  lastSync?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlatformSettingsCreationAttributes extends Omit<PlatformSettingsAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PlatformSettings extends Model<PlatformSettingsAttributes, PlatformSettingsCreationAttributes> implements PlatformSettingsAttributes {
  public id!: string;
  public organizationId!: string;
  public platform!: 'chatgpt' | 'gemini' | 'perplexity' | 'claude';
  public enabled!: boolean;
  public settings!: Record<string, any>;
  public apiKey?: string;
  public lastSync?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    organization: Association<PlatformSettings, Organization>;
  };
}

PlatformSettings.init(
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
    platform: {
      type: DataTypes.ENUM('chatgpt', 'gemini', 'perplexity', 'claude'),
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    apiKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'api_key',
    },
    lastSync: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_sync',
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
    modelName: 'PlatformSettings',
    tableName: 'platform_settings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['organization_id', 'platform'],
        name: 'unique_org_platform',
      },
    ],
  }
);

export default PlatformSettings;