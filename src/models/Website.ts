import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface WebsiteAttributes {
  id: string;
  organizationId: string;
  url: string;
  domain: string;
  name?: string;
  description?: string;
  settings?: object;
  robotsTxtStatus: 'allowed' | 'blocked' | 'partial' | 'unknown';
  lastScanAt?: Date;
  scanFrequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WebsiteCreationAttributes extends Optional<WebsiteAttributes, 'id' | 'robotsTxtStatus' | 'scanFrequency' | 'isActive'> {}

class Website extends Model<WebsiteAttributes, WebsiteCreationAttributes> implements WebsiteAttributes {
  public id!: string;
  public organizationId!: string;
  public url!: string;
  public domain!: string;
  public name?: string;
  public description?: string;
  public settings?: object;
  public robotsTxtStatus!: 'allowed' | 'blocked' | 'partial' | 'unknown';
  public lastScanAt?: Date;
  public scanFrequency!: 'daily' | 'weekly' | 'monthly';
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  needsScan(): boolean {
    if (!this.lastScanAt) return true;
    
    const now = new Date();
    const timeDiff = now.getTime() - this.lastScanAt.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    switch (this.scanFrequency) {
      case 'daily':
        return daysDiff >= 1;
      case 'weekly':
        return daysDiff >= 7;
      case 'monthly':
        return daysDiff >= 30;
      default:
        return false;
    }
  }

  async updateLastScan(): Promise<void> {
    this.lastScanAt = new Date();
    await this.save();
  }

  getRootDomain(): string {
    try {
      const url = new URL(this.url);
      return url.hostname;
    } catch {
      return this.domain;
    }
  }
}

Website.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255)
    },
    description: {
      type: DataTypes.TEXT
    },
    settings: {
      type: DataTypes.JSON
    },
    robotsTxtStatus: {
      type: DataTypes.ENUM('allowed', 'blocked', 'partial', 'unknown'),
      defaultValue: 'unknown',
      field: 'robots_txt_status'
    },
    lastScanAt: {
      type: DataTypes.DATE,
      field: 'last_scan_at'
    },
    scanFrequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      defaultValue: 'weekly',
      field: 'scan_frequency'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  },
  {
    sequelize,
    modelName: 'Website',
    tableName: 'websites',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (website) => {
        try {
          const url = new URL(website.url);
          website.domain = url.hostname;
        } catch (error) {
          throw new Error('Invalid URL format');
        }
      },
      beforeUpdate: (website) => {
        if (website.changed('url')) {
          try {
            const url = new URL(website.url);
            website.domain = url.hostname;
          } catch (error) {
            throw new Error('Invalid URL format');
          }
        }
      }
    }
  }
);

export default Website;