import { Model, DataTypes, Sequelize } from 'sequelize';

export class ABVariant extends Model {
  public id!: string;
  public experimentId!: string;
  public name!: string;
  public description!: string | null;
  public variantType!: 'control' | 'treatment';
  public trafficPercentage!: number;
  public configuration!: any;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initABVariant = (sequelize: Sequelize): typeof ABVariant => {
  ABVariant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      experimentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'ab_experiments',
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
      variantType: {
        type: DataTypes.ENUM('control', 'treatment'),
        allowNull: false
      },
      trafficPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 50.00
      },
      configuration: {
        type: DataTypes.JSON,
        allowNull: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'ABVariant',
      tableName: 'ab_variants',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['experiment_id']
        },
        {
          fields: ['variant_type']
        }
      ]
    }
  );

  return ABVariant;
};