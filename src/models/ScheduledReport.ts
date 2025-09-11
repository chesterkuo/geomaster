import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ReportParameters } from './GeneratedReport';

export type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';

export interface Schedule {
  type: ScheduleType;
  frequency: number; // e.g., every N days/weeks/months
  dayOfWeek?: number; // 0-6 for weekly schedules (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly schedules
  hour: number; // 0-23
  minute: number; // 0-59
  timezone?: string;
}

export interface ScheduledReportAttributes {
  id: string;
  organizationId: string;
  templateId: string;
  name: string;
  schedule: Schedule;
  recipients: string[]; // Array of email addresses
  parameters?: ReportParameters;
  isActive: boolean;
  lastExecuted?: Date;
  nextExecution?: Date;
  executionCount: number;
  failureCount: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledReportCreationAttributes 
  extends Optional<ScheduledReportAttributes, 'id' | 'isActive' | 'executionCount' | 'failureCount' | 'createdAt' | 'updatedAt'> {}

class ScheduledReport extends Model<ScheduledReportAttributes, ScheduledReportCreationAttributes> 
  implements ScheduledReportAttributes {
  public id!: string;
  public organizationId!: string;
  public templateId!: string;
  public name!: string;
  public schedule!: Schedule;
  public recipients!: string[];
  public parameters?: ReportParameters;
  public isActive!: boolean;
  public lastExecuted?: Date;
  public nextExecution?: Date;
  public executionCount!: number;
  public failureCount!: number;
  public createdBy?: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public static associate(models: any) {
    ScheduledReport.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });

    ScheduledReport.belongsTo(models.ReportTemplate, {
      foreignKey: 'templateId',
      as: 'template'
    });

    ScheduledReport.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    ScheduledReport.hasMany(models.GeneratedReport, {
      foreignKey: 'scheduledReportId',
      as: 'generatedReports'
    });
  }

  // Static methods
  public static async getDueReports(currentTime: Date = new Date()) {
    return this.findAll({
      where: {
        isActive: true,
        nextExecution: { [require('sequelize').Op.lte]: currentTime }
      },
      include: [
        {
          model: sequelize.models.ReportTemplate,
          as: 'template',
          attributes: ['name', 'reportType', 'templateConfig']
        }
      ]
    });
  }

  public static async getByOrganization(organizationId: string) {
    return this.findAll({
      where: { organizationId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: sequelize.models.ReportTemplate,
          as: 'template',
          attributes: ['name', 'reportType']
        }
      ]
    });
  }

  public static async getActiveReports() {
    return this.findAll({
      where: { isActive: true },
      include: [
        {
          model: sequelize.models.ReportTemplate,
          as: 'template',
          attributes: ['name', 'reportType']
        }
      ]
    });
  }

  // Instance methods
  public calculateNextExecution(): Date {
    const { type, frequency, dayOfWeek, dayOfMonth, hour, minute, timezone } = this.schedule;
    const now = new Date();
    let nextExec = new Date(now);
    
    nextExec.setHours(hour, minute, 0, 0);
    
    switch (type) {
      case 'daily':
        nextExec.setDate(now.getDate() + frequency);
        break;
        
      case 'weekly':
        const currentDay = now.getDay();
        const targetDay = dayOfWeek || 0;
        const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
        nextExec.setDate(now.getDate() + daysUntilTarget + (frequency - 1) * 7);
        break;
        
      case 'monthly':
        const targetDate = dayOfMonth || 1;
        nextExec.setDate(targetDate);
        nextExec.setMonth(now.getMonth() + frequency);
        break;
        
      case 'quarterly':
        nextExec.setMonth(now.getMonth() + 3 * frequency);
        break;
        
      default:
        // For custom schedules, add 1 day as default
        nextExec.setDate(now.getDate() + 1);
    }
    
    // If the calculated time is in the past, move to next occurrence
    if (nextExec <= now) {
      return this.calculateNextExecution();
    }
    
    return nextExec;
  }

  public updateNextExecution() {
    const nextExec = this.calculateNextExecution();
    return this.update({ nextExecution: nextExec });
  }

  public recordExecution(success: boolean = true) {
    const updates: any = {
      lastExecuted: new Date(),
      executionCount: this.executionCount + 1
    };
    
    if (!success) {
      updates.failureCount = this.failureCount + 1;
    }
    
    // Calculate next execution time
    updates.nextExecution = this.calculateNextExecution();
    
    return this.update(updates);
  }

  public getSuccessRate(): number {
    if (this.executionCount === 0) return 0;
    const successCount = this.executionCount - this.failureCount;
    return (successCount / this.executionCount) * 100;
  }

  public isOverdue(): boolean {
    if (!this.isActive || !this.nextExecution) return false;
    return new Date() > this.nextExecution;
  }

  public validateSchedule(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const schedule = this.schedule;

    if (!schedule.type) {
      errors.push('Schedule type is required');
    }

    if (typeof schedule.hour !== 'number' || schedule.hour < 0 || schedule.hour > 23) {
      errors.push('Hour must be between 0 and 23');
    }

    if (typeof schedule.minute !== 'number' || schedule.minute < 0 || schedule.minute > 59) {
      errors.push('Minute must be between 0 and 59');
    }

    if (schedule.type === 'weekly' && (typeof schedule.dayOfWeek !== 'number' || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6)) {
      errors.push('Day of week must be between 0 (Sunday) and 6 (Saturday)');
    }

    if (schedule.type === 'monthly' && (typeof schedule.dayOfMonth !== 'number' || schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31)) {
      errors.push('Day of month must be between 1 and 31');
    }

    return { isValid: errors.length === 0, errors };
  }

  public validateRecipients(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(this.recipients) || this.recipients.length === 0) {
      errors.push('At least one recipient email is required');
      return { isValid: false, errors };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.recipients.forEach((email, index) => {
      if (!emailRegex.test(email)) {
        errors.push(`Invalid email format at position ${index + 1}: ${email}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  public getScheduleDisplay(): string {
    const { type, frequency, dayOfWeek, dayOfMonth, hour, minute } = this.schedule;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    switch (type) {
      case 'daily':
        return frequency === 1 ? `Daily at ${timeStr}` : `Every ${frequency} days at ${timeStr}`;
        
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[dayOfWeek || 0];
        return frequency === 1 ? `Weekly on ${dayName} at ${timeStr}` : `Every ${frequency} weeks on ${dayName} at ${timeStr}`;
        
      case 'monthly':
        const suffix = ['th', 'st', 'nd', 'rd'][(dayOfMonth || 1) % 10] || 'th';
        return frequency === 1 
          ? `Monthly on the ${dayOfMonth}${suffix} at ${timeStr}` 
          : `Every ${frequency} months on the ${dayOfMonth}${suffix} at ${timeStr}`;
          
      case 'quarterly':
        return frequency === 1 ? `Quarterly at ${timeStr}` : `Every ${frequency} quarters at ${timeStr}`;
        
      default:
        return `Custom schedule at ${timeStr}`;
    }
  }
}

ScheduledReport.init(
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
      allowNull: false,
      field: 'template_id',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    schedule: {
      type: DataTypes.JSON,
      allowNull: false,
      get() {
        const value = this.getDataValue('schedule');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
    },
    recipients: {
      type: DataTypes.JSON,
      allowNull: false,
      get() {
        const value = this.getDataValue('recipients');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
    },
    parameters: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        const value = this.getDataValue('parameters');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    lastExecuted: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_executed',
    },
    nextExecution: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_execution',
    },
    executionCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'execution_count',
    },
    failureCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'failure_count',
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
    tableName: 'scheduled_reports',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organization_id'],
      },
      {
        fields: ['template_id'],
      },
      {
        fields: ['is_active', 'next_execution'],
      },
      {
        fields: ['created_by'],
      },
    ],
  }
);

export default ScheduledReport;