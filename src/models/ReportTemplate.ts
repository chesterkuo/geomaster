import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ReportType = 'competitor_benchmark' | 'market_position' | 'swot_analysis' | 'keyword_analysis' | 'custom';

export interface ReportSection {
  id: string;
  name: string;
  type: 'chart' | 'table' | 'text' | 'image';
  config: Record<string, any>;
  order: number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  dataSource: string;
  xAxis: string;
  yAxis: string;
  title: string;
}

export interface TemplateConfig {
  sections: ReportSection[];
  charts: ChartConfig[];
  format: 'pdf' | 'excel' | 'csv' | 'html';
  branding: boolean;
  customizations: Record<string, any>;
}

export interface ReportTemplateAttributes {
  id: string;
  organizationId?: string;
  name: string;
  reportType: ReportType;
  templateConfig: TemplateConfig;
  isPublic: boolean;
  isSystemDefault: boolean;
  usageCount: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportTemplateCreationAttributes 
  extends Optional<ReportTemplateAttributes, 'id' | 'isPublic' | 'isSystemDefault' | 'usageCount' | 'createdAt' | 'updatedAt'> {}

class ReportTemplate extends Model<ReportTemplateAttributes, ReportTemplateCreationAttributes> 
  implements ReportTemplateAttributes {
  public id!: string;
  public organizationId?: string;
  public name!: string;
  public reportType!: ReportType;
  public templateConfig!: TemplateConfig;
  public isPublic!: boolean;
  public isSystemDefault!: boolean;
  public usageCount!: number;
  public createdBy?: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public static associate(models: any) {
    ReportTemplate.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });

    ReportTemplate.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    ReportTemplate.hasMany(models.GeneratedReport, {
      foreignKey: 'templateId',
      as: 'generatedReports'
    });

    ReportTemplate.hasMany(models.ScheduledReport, {
      foreignKey: 'templateId',
      as: 'scheduledReports'
    });
  }

  // Static methods
  public static async getSystemDefaults(reportType?: ReportType) {
    const where: any = { isSystemDefault: true };
    if (reportType) where.reportType = reportType;

    return this.findAll({
      where,
      order: [['usageCount', 'DESC']]
    });
  }

  public static async getPublicTemplates(reportType?: ReportType, limit: number = 50) {
    const where: any = { isPublic: true };
    if (reportType) where.reportType = reportType;

    return this.findAll({
      where,
      order: [['usageCount', 'DESC']],
      limit
    });
  }

  public static async getOrganizationTemplates(organizationId: string, reportType?: ReportType) {
    const where: any = { organizationId };
    if (reportType) where.reportType = reportType;

    return this.findAll({
      where,
      order: [['updatedAt', 'DESC']]
    });
  }

  public static async getPopularTemplates(limit: number = 10) {
    return this.findAll({
      where: { isPublic: true },
      order: [['usageCount', 'DESC']],
      limit
    });
  }

  // Instance methods
  public incrementUsage() {
    return this.increment('usageCount');
  }

  public canUserAccess(userId: string, organizationId: string): boolean {
    // System default templates are accessible to everyone
    if (this.isSystemDefault) return true;
    
    // Public templates are accessible to everyone
    if (this.isPublic) return true;
    
    // Private templates are only accessible to the same organization
    return this.organizationId === organizationId;
  }

  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.templateConfig;

    // Validate required fields
    if (!config.sections || !Array.isArray(config.sections)) {
      errors.push('Template must have sections array');
    }

    if (!config.format) {
      errors.push('Template must specify output format');
    }

    // Validate sections
    config.sections?.forEach((section, index) => {
      if (!section.name) errors.push(`Section ${index + 1}: Missing name`);
      if (!section.type) errors.push(`Section ${index + 1}: Missing type`);
      if (typeof section.order !== 'number') errors.push(`Section ${index + 1}: Invalid order`);
    });

    // Validate charts
    config.charts?.forEach((chart, index) => {
      if (!chart.type) errors.push(`Chart ${index + 1}: Missing chart type`);
      if (!chart.dataSource) errors.push(`Chart ${index + 1}: Missing data source`);
    });

    return { isValid: errors.length === 0, errors };
  }

  public getSectionsByType(type: string): ReportSection[] {
    return this.templateConfig.sections?.filter(section => section.type === type) || [];
  }

  public getChartConfigs(): ChartConfig[] {
    return this.templateConfig.charts || [];
  }

  public clone(newName: string, organizationId: string, userId: string): Partial<ReportTemplateAttributes> {
    return {
      name: newName,
      organizationId,
      reportType: this.reportType,
      templateConfig: JSON.parse(JSON.stringify(this.templateConfig)),
      isPublic: false,
      isSystemDefault: false,
      usageCount: 0,
      createdBy: userId
    };
  }

  public getPreviewData() {
    return {
      id: this.id,
      name: this.name,
      reportType: this.reportType,
      sectionsCount: this.templateConfig.sections?.length || 0,
      chartsCount: this.templateConfig.charts?.length || 0,
      format: this.templateConfig.format,
      isPublic: this.isPublic,
      isSystemDefault: this.isSystemDefault,
      usageCount: this.usageCount
    };
  }
}

ReportTemplate.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    organizationId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      field: 'organization_id',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    reportType: {
      type: DataTypes.ENUM('competitor_benchmark', 'market_position', 'swot_analysis', 'keyword_analysis', 'custom'),
      allowNull: false,
      field: 'report_type',
    },
    templateConfig: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'template_config',
      get() {
        const value = this.getDataValue('templateConfig');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_public',
    },
    isSystemDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_system_default',
    },
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'usage_count',
    },
    createdBy: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      field: 'created_by',
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
    tableName: 'report_templates',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organization_id', 'report_type'],
      },
      {
        fields: ['is_public', 'is_system_default'],
      },
      {
        fields: ['usage_count'],
      },
      {
        fields: ['report_type'],
      },
    ],
  }
);

export default ReportTemplate;