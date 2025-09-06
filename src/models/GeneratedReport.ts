import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/database';

export type ReportStatus = 'generating' | 'completed' | 'failed';
export type FileFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type ReportType = 'competitor_benchmark' | 'market_position' | 'swot_analysis' | 'keyword_analysis' | 'custom';

export interface ReportParameters {
  dateRange?: {
    start: string;
    end: string;
  };
  competitors?: string[];
  keywords?: string[];
  websites?: string[];
  metrics?: string[];
  filters?: Record<string, any>;
  customOptions?: Record<string, any>;
}

export interface GeneratedReportAttributes {
  id: string;
  organizationId: string;
  templateId?: string;
  name: string;
  reportType: ReportType;
  parameters?: ReportParameters;
  filePath?: string;
  fileFormat: FileFormat;
  fileSize: number;
  status: ReportStatus;
  generatedBy?: string;
  generatedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedReportCreationAttributes 
  extends Optional<GeneratedReportAttributes, 'id' | 'fileSize' | 'status' | 'generatedAt' | 'createdAt' | 'updatedAt'> {}

class GeneratedReport extends Model<GeneratedReportAttributes, GeneratedReportCreationAttributes> 
  implements GeneratedReportAttributes {
  public id!: string;
  public organizationId!: string;
  public templateId?: string;
  public name!: string;
  public reportType!: ReportType;
  public parameters?: ReportParameters;
  public filePath?: string;
  public fileFormat!: FileFormat;
  public fileSize!: number;
  public status!: ReportStatus;
  public generatedBy?: string;
  public generatedAt!: Date;
  public expiresAt?: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public static associate(models: any) {
    GeneratedReport.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });

    GeneratedReport.belongsTo(models.ReportTemplate, {
      foreignKey: 'templateId',
      as: 'template'
    });

    GeneratedReport.belongsTo(models.User, {
      foreignKey: 'generatedBy',
      as: 'generator'
    });
  }

  // Static methods
  public static async getRecentReports(organizationId: string, limit: number = 20) {
    return this.findAll({
      where: { organizationId },
      order: [['generatedAt', 'DESC']],
      limit,
      include: [
        {
          model: sequelize.models.ReportTemplate,
          as: 'template',
          attributes: ['name', 'reportType']
        },
        {
          model: sequelize.models.User,
          as: 'generator',
          attributes: ['fullName', 'email']
        }
      ]
    });
  }

  public static async getReportsByType(organizationId: string, reportType: ReportType) {
    return this.findAll({
      where: { organizationId, reportType },
      order: [['generatedAt', 'DESC']]
    });
  }

  public static async getExpiredReports() {
    return this.findAll({
      where: {
        expiresAt: { [Op.lt]: new Date() },
        status: 'completed'
      }
    });
  }

  public static async getStorageUsage(organizationId: string) {
    const result = await this.findOne({
      where: { organizationId },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('file_size')), 'totalSize'],
        [sequelize.fn('COUNT', sequelize.col('*')), 'totalReports'],
        [sequelize.fn('AVG', sequelize.col('file_size')), 'averageSize']
      ]
    });

    const resultData = result as any;
    return {
      totalSize: parseInt(String(resultData?.getDataValue('totalSize') || 0)),
      totalReports: parseInt(String(resultData?.getDataValue('totalReports') || 0)),
      averageSize: parseInt(String(resultData?.getDataValue('averageSize') || 0))
    };
  }

  // Instance methods
  public isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  public isAccessible(): boolean {
    return this.status === 'completed' && !this.isExpired() && !!this.filePath;
  }

  public getDownloadUrl(): string | null {
    if (!this.isAccessible()) return null;
    return `/api/v1/reports/${this.id}/download`;
  }

  public formatFileSize(): string {
    const bytes = this.fileSize;
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public getGenerationTime(): number | null {
    if (this.status !== 'completed') return null;
    return this.generatedAt.getTime() - this.createdAt.getTime();
  }

  public updateStatus(status: ReportStatus, filePath?: string, fileSize?: number) {
    const updates: any = { status };
    
    if (status === 'completed') {
      updates.generatedAt = new Date();
      if (filePath) updates.filePath = filePath;
      if (fileSize) updates.fileSize = fileSize;
      
      // Set expiration date (30 days from generation)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      updates.expiresAt = expiresAt;
    }

    return this.update(updates);
  }

  public getMetadata() {
    return {
      id: this.id,
      name: this.name,
      reportType: this.reportType,
      fileFormat: this.fileFormat,
      fileSize: this.formatFileSize(),
      status: this.status,
      isAccessible: this.isAccessible(),
      isExpired: this.isExpired(),
      generatedAt: this.generatedAt,
      expiresAt: this.expiresAt,
      downloadUrl: this.getDownloadUrl(),
      generationTime: this.getGenerationTime()
    };
  }

  public validateParameters(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const params = this.parameters;

    if (!params) return { isValid: true, errors: [] };

    // Validate date range
    if (params.dateRange) {
      const { start, end } = params.dateRange;
      if (start && end && new Date(start) > new Date(end)) {
        errors.push('Start date must be before end date');
      }
    }

    // Validate competitor IDs format
    if (params.competitors) {
      params.competitors.forEach((id, index) => {
        if (!id || typeof id !== 'string') {
          errors.push(`Invalid competitor ID at index ${index}`);
        }
      });
    }

    // Validate keyword list
    if (params.keywords) {
      if (params.keywords.length > 1000) {
        errors.push('Too many keywords (max 1000)');
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

GeneratedReport.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    organizationId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'organization_id',
    },
    templateId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      field: 'template_id',
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
    parameters: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        const value = this.getDataValue('parameters');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'file_path',
    },
    fileFormat: {
      type: DataTypes.ENUM('pdf', 'excel', 'csv', 'json'),
      allowNull: false,
      field: 'file_format',
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'file_size',
    },
    status: {
      type: DataTypes.ENUM('generating', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'generating',
    },
    generatedBy: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      field: 'generated_by',
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'generated_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
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
    tableName: 'generated_reports',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organization_id', 'report_type'],
      },
      {
        fields: ['status', 'generated_at'],
      },
      {
        fields: ['generated_by'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['organization_id', 'status'],
      },
    ],
  }
);

export default GeneratedReport;