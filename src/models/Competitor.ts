import { DataTypes, Model, Association } from 'sequelize';
import sequelize from '../config/database';
import Organization from './Organization';

export interface CompetitorAttributes {
  id: string;
  organizationId: string;
  websiteUrl: string;
  domain: string;
  name?: string;
  isActive: boolean;
  lastAnalyzedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompetitorCreationAttributes extends Omit<CompetitorAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Competitor extends Model<CompetitorAttributes, CompetitorCreationAttributes> implements CompetitorAttributes {
  public id!: string;
  public organizationId!: string;
  public websiteUrl!: string;
  public domain!: string;
  public name?: string;
  public isActive!: boolean;
  public lastAnalyzedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    organization: Association<Competitor, Organization>;
  };
}

Competitor.init(
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
    websiteUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'website_url',
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    lastAnalyzedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_analyzed_at',
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
    modelName: 'Competitor',
    tableName: 'competitors',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['organization_id', 'domain'],
        name: 'unique_org_competitor',
      },
      {
        fields: ['organization_id'],
      },
      {
        fields: ['domain'],
      },
    ],
  }
);

export default Competitor;