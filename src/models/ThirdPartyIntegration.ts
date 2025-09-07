import { Model, DataTypes, Sequelize } from 'sequelize';

export class ThirdPartyIntegration extends Model {
  public id!: string;
  public organizationId!: string;
  public integrationType!: 'zapier' | 'make' | 'slack' | 'teams' | 'discord' | 'telegram' | 'email';
  public name!: string;
  public config!: any;
  public credentials!: any;
  public webhookUrl!: string | null;
  public isActive!: boolean;
  public lastSyncAt!: Date | null;
  public syncStatus!: 'success' | 'error' | 'pending';
  public errorMessage!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initThirdPartyIntegration = (sequelize: Sequelize): typeof ThirdPartyIntegration => {
  ThirdPartyIntegration.init(
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
      integrationType: {
        type: DataTypes.ENUM('zapier', 'make', 'slack', 'teams', 'discord', 'telegram', 'email'),
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      config: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      credentials: {
        type: DataTypes.JSON,
        allowNull: true
      },
      webhookUrl: {
        type: DataTypes.STRING(1000),
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      lastSyncAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      syncStatus: {
        type: DataTypes.ENUM('success', 'error', 'pending'),
        defaultValue: 'pending'
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ThirdPartyIntegration',
      tableName: 'third_party_integrations',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['organization_id', 'integration_type']
        },
        {
          fields: ['is_active']
        }
      ]
    }
  );

  return ThirdPartyIntegration;
};