import { Model, DataTypes, Sequelize } from 'sequelize';

export class Webhook extends Model {
  public id!: string;
  public organizationId!: string;
  public name!: string;
  public url!: string;
  public secret!: string | null;
  public events!: string[];
  public isActive!: boolean;
  public headers!: any;
  public retryAttempts!: number;
  public timeoutSeconds!: number;
  public lastTriggeredAt!: Date | null;
  public totalDeliveries!: number;
  public successfulDeliveries!: number;
  public failedDeliveries!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initWebhook = (sequelize: Sequelize): typeof Webhook => {
  Webhook.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      url: {
        type: DataTypes.STRING(1000),
        allowNull: false
      },
      secret: {
        type: DataTypes.STRING,
        allowNull: true
      },
      events: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      headers: {
        type: DataTypes.JSON,
        allowNull: true
      },
      retryAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 3
      },
      timeoutSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 30
      },
      lastTriggeredAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      totalDeliveries: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      successfulDeliveries: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      failedDeliveries: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: 'Webhook',
      tableName: 'webhooks',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['organization_id']
        },
        {
          fields: ['is_active']
        }
      ]
    }
  );

  return Webhook;
};