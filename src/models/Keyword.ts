import { DataTypes, Model, Association } from 'sequelize';
import sequelize from '../config/database';
import Organization from './Organization';

export interface KeywordAttributes {
  id: string;
  organizationId: string;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface KeywordCreationAttributes extends Omit<KeywordAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Keyword extends Model<KeywordAttributes, KeywordCreationAttributes> implements KeywordAttributes {
  public id!: string;
  public organizationId!: string;
  public keyword!: string;
  public searchVolume?: number;
  public difficulty?: number;
  public cpc?: number;
  public intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    organization: Association<Keyword, Organization>;
  };
}

Keyword.init(
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
    keyword: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    searchVolume: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'search_volume',
    },
    difficulty: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    cpc: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    intent: {
      type: DataTypes.ENUM('informational', 'commercial', 'transactional', 'navigational'),
      allowNull: true,
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
    modelName: 'Keyword',
    tableName: 'keywords',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['organization_id', 'keyword'],
        name: 'unique_org_keyword',
      },
      {
        fields: ['organization_id'],
      },
      {
        fields: ['keyword'],
      },
    ],
  }
);

export default Keyword;