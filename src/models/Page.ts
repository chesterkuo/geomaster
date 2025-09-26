import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PageAttributes {
  id: string;
  organizationId: string;
  title: string;
  url: string;
  type: 'product' | 'blog' | 'FAQ' | 'service' | 'other';
  traffic: 'high' | 'medium' | 'low';
  geoScore?: number;
  lastAnalyzedAt?: Date;
  analysisStatus: 'pending' | 'analyzing' | 'completed' | 'failed';
  issues?: string[];
  estimatedImprovement?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PageCreationAttributes extends Optional<PageAttributes, 'id' | 'geoScore' | 'lastAnalyzedAt' | 'issues' | 'estimatedImprovement' | 'createdAt' | 'updatedAt'> {}

class Page extends Model<PageAttributes, PageCreationAttributes> implements PageAttributes {
  public id!: string;
  public organizationId!: string;
  public title!: string;
  public url!: string;
  public type!: 'product' | 'blog' | 'FAQ' | 'service' | 'other';
  public traffic!: 'high' | 'medium' | 'low';
  public geoScore?: number;
  public lastAnalyzedAt?: Date;
  public analysisStatus!: 'pending' | 'analyzing' | 'completed' | 'failed';
  public issues?: string[];
  public estimatedImprovement?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Page.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'organization_id'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    type: {
      type: DataTypes.ENUM('product', 'blog', 'FAQ', 'service', 'other'),
      allowNull: false,
      defaultValue: 'other'
    },
    traffic: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium'
    },
    geoScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    lastAnalyzedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    analysisStatus: {
      type: DataTypes.ENUM('pending', 'analyzing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    issues: {
      type: DataTypes.JSON,
      allowNull: true
    },
    estimatedImprovement: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    }
  },
  {
    sequelize,
    tableName: 'pages',
    modelName: 'Page',
    timestamps: true,
    underscored: true
  }
);

export { Page, PageAttributes, PageCreationAttributes };