import { Model, DataTypes, Sequelize } from 'sequelize';

export class ABUserSegment extends Model {
  public id!: string;
  public organizationId!: string;
  public name!: string;
  public description!: string | null;
  public segmentCriteria!: any;
  public estimatedSize!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initABUserSegment = (sequelize: Sequelize): typeof ABUserSegment => {
  ABUserSegment.init(
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
      segmentCriteria: {
        type: DataTypes.JSON,
        allowNull: false
      },
      estimatedSize: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'ABUserSegment',
      tableName: 'ab_user_segments',
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

  return ABUserSegment;
};