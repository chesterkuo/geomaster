import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Report Types
 */
type ReportType = 'competitor_benchmark' | 'market_position' | 'swot_analysis' | 'keyword_analysis' | 'custom';
type ReportStatus = 'generating' | 'completed' | 'failed';
type FileFormat = 'pdf' | 'excel' | 'csv' | 'json';

/**
 * Generated Report Interface
 */
interface GeneratedReport {
  id: string;
  organizationId: string;
  templateId?: string;
  name: string;
  reportType: ReportType;
  parameters?: any;
  filePath?: string;
  fileFormat: FileFormat;
  fileSize: string;
  status: ReportStatus;
  isAccessible: boolean;
  isExpired: boolean;
  generatedBy?: string;
  generatedAt: string;
  expiresAt?: string;
  downloadUrl?: string;
  generationTime?: number;
}

/**
 * Reports Controller
 */
export class ReportsController {
  /**
   * Get generated reports
   */
  async getReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportType, status, limit = 10 } = req.query;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      // Query the database for actual reports
      const where: any = { organizationId };
      
      if (reportType) {
        where.reportType = reportType;
      }
      
      if (status) {
        where.status = status;
      }

      const GeneratedReport = require('../models/GeneratedReport').default;
      const reports = await GeneratedReport.findAll({
        where,
        order: [['generatedAt', 'DESC']],
        limit: parseInt(limit as string, 10),
        include: [
          {
            model: require('../models/ReportTemplate').default,
            as: 'template',
            attributes: ['name', 'reportType']
          }
        ]
      });

      // Transform to match frontend expectations
      const transformedReports = reports.map((report: any) => ({
        id: report.id,
        organizationId: report.organizationId,
        templateId: report.templateId,
        name: report.name,
        reportType: report.reportType,
        parameters: report.parameters,
        filePath: report.filePath,
        fileFormat: report.fileFormat,
        fileSize: report.formatFileSize(), // Use model method to format file size
        status: report.status,
        isAccessible: report.isAccessible(),
        isExpired: report.isExpired(),
        generatedBy: report.generatedBy,
        generatedAt: report.generatedAt.toISOString(),
        expiresAt: report.expiresAt ? report.expiresAt.toISOString() : null,
        downloadUrl: report.getDownloadUrl(),
        generationTime: report.getGenerationTime()
      }));

      res.status(200).json({
        success: true,
        data: {
          reports: transformedReports,
          total: transformedReports.length
        }
      });
    } catch (error) {
      console.error('Error getting reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reports',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get specific report
   */
  async getReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      const GeneratedReport = require('../models/GeneratedReport').default;
      const report = await GeneratedReport.findOne({
        where: { 
          id: reportId,
          organizationId: organizationId
        },
        include: [
          {
            model: require('../models/ReportTemplate').default,
            as: 'template',
            attributes: ['name', 'reportType']
          }
        ]
      });

      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Report not found'
        });
        return;
      }

      // Transform to match frontend expectations
      const transformedReport = {
        id: report.id,
        organizationId: report.organizationId,
        templateId: report.templateId,
        name: report.name,
        reportType: report.reportType,
        parameters: report.parameters,
        filePath: report.filePath,
        fileFormat: report.fileFormat,
        fileSize: report.formatFileSize(),
        status: report.status,
        isAccessible: report.isAccessible(),
        isExpired: report.isExpired(),
        generatedBy: report.generatedBy,
        generatedAt: report.generatedAt.toISOString(),
        expiresAt: report.expiresAt ? report.expiresAt.toISOString() : null,
        downloadUrl: report.getDownloadUrl(),
        generationTime: report.getGenerationTime()
      };

      res.status(200).json({
        success: true,
        data: transformedReport
      });
    } catch (error) {
      console.error('Error getting report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate new report
   */
  async generateReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, reportType, parameters, fileFormat = 'pdf' } = req.body;
      const organizationId = req.organization?.id;
      const userId = req.user?.id;

      // Mock report generation - in production this would create a background job
      const newReport: GeneratedReport = {
        id: Math.random().toString(36).substr(2, 9),
        organizationId: organizationId!,
        name,
        reportType,
        parameters,
        fileFormat,
        fileSize: '0 MB',
        status: 'generating',
        isAccessible: false,
        isExpired: false,
        generatedBy: userId,
        generatedAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        data: newReport,
        message: 'Report generation started'
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete report
   */
  async deleteReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;

      // Mock deletion - in production this would delete from database and file system
      res.status(200).json({
        success: true,
        message: 'Report deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Download report
   */
  async downloadReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;

      // Mock download - in production this would stream the actual file
      res.status(200).json({
        success: true,
        message: 'Report download would start here',
        downloadUrl: `/api/v1/reports/${reportId}/download`
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Schedule a report
   */
  async scheduleReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { templateId, name, schedule, recipients, parameters, isActive = true } = req.body;
      const organizationId = req.organization?.id;
      const userId = req.user?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      // Create scheduled report in database
      const ScheduledReport = require('../models/ScheduledReport').default;
      const ReportTemplate = require('../models/ReportTemplate').default;

      // Verify template exists and belongs to organization or is public
      const template = await ReportTemplate.findOne({
        where: {
          id: templateId,
          [require('sequelize').Op.or]: [
            { organizationId: organizationId },
            { isPublic: true },
            { isSystemDefault: true }
          ]
        }
      });

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found or not accessible'
        });
        return;
      }

      const newScheduledReport = await ScheduledReport.create({
        organizationId,
        templateId,
        name,
        schedule,
        recipients,
        parameters,
        isActive,
        createdBy: userId
      });

      // Calculate initial next execution time
      await newScheduledReport.updateNextExecution();

      // Reload with template data
      await newScheduledReport.reload({
        include: [
          {
            model: ReportTemplate,
            as: 'template',
            attributes: ['name', 'reportType']
          }
        ]
      });

      const transformedReport = {
        id: newScheduledReport.id,
        organizationId: newScheduledReport.organizationId,
        templateId: newScheduledReport.templateId,
        name: newScheduledReport.name,
        schedule: newScheduledReport.schedule,
        recipients: newScheduledReport.recipients,
        parameters: newScheduledReport.parameters,
        isActive: newScheduledReport.isActive,
        lastExecuted: null,
        nextExecution: newScheduledReport.nextExecution ? newScheduledReport.nextExecution.toISOString() : null,
        executionCount: newScheduledReport.executionCount,
        failureCount: newScheduledReport.failureCount,
        createdBy: newScheduledReport.createdBy,
        createdAt: newScheduledReport.createdAt.toISOString(),
        updatedAt: newScheduledReport.updatedAt.toISOString(),
        template: newScheduledReport.template ? {
          name: newScheduledReport.template.name,
          reportType: newScheduledReport.template.reportType
        } : null
      };

      res.status(201).json({
        success: true,
        data: {
          scheduledReport: transformedReport
        },
        message: 'Report scheduled successfully'
      });
    } catch (error) {
      console.error('Error scheduling report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      // Query the database for actual scheduled reports
      const ScheduledReport = require('../models/ScheduledReport').default;
      const scheduledReports = await ScheduledReport.findAll({
        where: { organizationId },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: require('../models/ReportTemplate').default,
            as: 'template',
            attributes: ['name', 'reportType']
          }
        ]
      });

      // Transform to match frontend expectations
      const transformedReports = scheduledReports.map((report: any) => ({
        id: report.id,
        organizationId: report.organizationId,
        templateId: report.templateId,
        name: report.name,
        schedule: report.schedule,
        recipients: report.recipients,
        parameters: report.parameters,
        isActive: report.isActive,
        lastExecuted: report.lastExecuted ? report.lastExecuted.toISOString() : null,
        nextExecution: report.nextExecution ? report.nextExecution.toISOString() : null,
        executionCount: report.executionCount,
        failureCount: report.failureCount,
        createdBy: report.createdBy,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        template: report.template ? {
          name: report.template.name,
          reportType: report.template.reportType
        } : null
      }));

      res.status(200).json({
        success: true,
        data: {
          scheduledReports: transformedReports,
          total: transformedReports.length
        }
      });
    } catch (error) {
      console.error('Error getting scheduled reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduled reports',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update scheduled report
   */
  async updateScheduledReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scheduledReportId } = req.params;
      const updateData = req.body;

      // Mock update - in production this would update the database
      const updatedScheduledReport = {
        id: scheduledReportId,
        organizationId: req.organization?.id!,
        templateId: 'template-1',
        name: updateData.name || 'Updated Report',
        schedule: updateData.schedule || {
          type: 'weekly',
          frequency: 1,
          dayOfWeek: 1,
          hour: 9,
          minute: 0,
          timezone: 'UTC'
        },
        recipients: updateData.recipients || ['user@example.com'],
        parameters: updateData.parameters || {},
        isActive: updateData.isActive !== undefined ? updateData.isActive : true,
        lastExecuted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextExecution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdBy: req.user?.id,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        template: {
          name: 'Updated Template',
          reportType: 'competitor_benchmark' as const
        }
      };

      res.status(200).json({
        success: true,
        data: {
          scheduledReport: updatedScheduledReport
        },
        message: 'Scheduled report updated successfully'
      });
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update scheduled report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete scheduled report
   */
  async deleteScheduledReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scheduledReportId } = req.params;

      // Mock deletion - in production this would delete from database
      res.status(200).json({
        success: true,
        message: 'Scheduled report deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete scheduled report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}