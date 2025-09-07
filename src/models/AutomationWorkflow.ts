import { Model, DataTypes, Sequelize } from 'sequelize';

export class AutomationWorkflow extends Model {
  public id!: string;
  public organizationId!: string;
  public name!: string;
  public description!: string | null;
  public triggerEvent!: string;
  public triggerConditions!: any;
  public actions!: any[];
  public isActive!: boolean;
  public executionCount!: number;
  public lastExecutedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initAutomationWorkflow = (sequelize: Sequelize): typeof AutomationWorkflow => {
  AutomationWorkflow.init(
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      triggerEvent: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      triggerConditions: {
        type: DataTypes.JSON,
        allowNull: true
      },
      actions: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      executionCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      lastExecutedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'AutomationWorkflow',
      tableName: 'automation_workflows',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['organization_id']
        },
        {
          fields: ['trigger_event']
        },
        {
          fields: ['is_active']
        }
      ]
    }
  );

  return AutomationWorkflow;
};