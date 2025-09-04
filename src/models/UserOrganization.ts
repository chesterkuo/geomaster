import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserOrganizationAttributes {
  id: string;
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

interface UserOrganizationCreationAttributes extends Optional<UserOrganizationAttributes, 'id' | 'role' | 'joinedAt'> {}

class UserOrganization extends Model<UserOrganizationAttributes, UserOrganizationCreationAttributes> implements UserOrganizationAttributes {
  public id!: string;
  public userId!: string;
  public organizationId!: string;
  public role!: 'owner' | 'admin' | 'member';
  public joinedAt!: Date;
}

UserOrganization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
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
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'member'),
      defaultValue: 'member'
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at'
    }
  },
  {
    sequelize,
    modelName: 'UserOrganization',
    tableName: 'user_organizations',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'organization_id']
      }
    ]
  }
);

export default UserOrganization;