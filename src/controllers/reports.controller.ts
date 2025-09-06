import { Request, Response } from 'express';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import ReportTemplate from '../models/ReportTemplate';
import GeneratedReport from '../models/GeneratedReport';
import { ReportGenerationService } from '../services/reportGeneration.service';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class ReportsController {
  /**
   * GET /api/v1/reports/templates - Get report templates
   */
  public getTemplates = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { reportType, includePublic, includeSystemDefault } = req.query;

    const templates = [];

    // Get organization templates
    const orgTemplates = await ReportTemplate.getOrganizationTemplates(
      organizationId,
      reportType as any
    );
    templates.push(...orgTemplates);

    // Include public templates if requested
    if (includePublic === 'true') {
      const publicTemplates = await ReportTemplate.getPublicTemplates(reportType as any);
      templates.push(...publicTemplates);
    }

    // Include system default templates if requested
    if (includeSystemDefault === 'true') {
      const systemTemplates = await ReportTemplate.getSystemDefaults(reportType as any);
      templates.push(...systemTemplates);
    }

    res.json({
      success: true,
      data: {
        templates: templates.map(t => t.getPreviewData()),
        total: templates.length
      }
    });
  });

  /**
   * POST /api/v1/reports/templates - Create new report template
   */
  public createTemplate = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const userId = req.user.id;
    const { name, reportType, templateConfig, isPublic } = req.body;

    if (!name || !reportType || !templateConfig) {
      throw new AppError('Missing required fields: name, reportType, templateConfig', 400);
    }

    const template = await ReportTemplate.create({
      organizationId,
      name,
      reportType,
      templateConfig,
      isPublic: isPublic || false,
      createdBy: userId
    });

    // Validate configuration
    const validation = template.validateConfig();
    if (!validation.isValid) {
      await template.destroy();
      throw new AppError(`Invalid template configuration: ${validation.errors.join(', ')}`, 400);
    }

    logger.info(`Report template created: ${template.id} by user: ${userId}`);

    res.status(201).json({
      success: true,
      data: { template: template.getPreviewData() }
    });
  });

  /**
   * GET /api/v1/reports/templates/:id - Get specific template
   */
  public getTemplate = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const userId = req.user.id;
    const { id } = req.params;

    const template = await ReportTemplate.findByPk(id);
    
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    if (!template.canUserAccess(userId, organizationId)) {
      throw new AppError('Access denied to this template', 403);
    }

    res.json({
      success: true,
      data: { template }
    });
  });

  /**
   * PUT /api/v1/reports/templates/:id - Update report template
   */
  public updateTemplate = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { id } = req.params;
    const { name, templateConfig, isPublic } = req.body;

    const template = await ReportTemplate.findOne({
      where: { id, organizationId }
    });

    if (!template) {
      throw new AppError('Template not found or access denied', 404);
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (templateConfig) updateData.templateConfig = templateConfig;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    await template.update(updateData);

    // Validate updated configuration
    if (templateConfig) {
      const validation = template.validateConfig();
      if (!validation.isValid) {
        throw new AppError(`Invalid template configuration: ${validation.errors.join(', ')}`, 400);
      }
    }

    res.json({
      success: true,
      data: { template: template.getPreviewData() }
    });
  });

  /**
   * DELETE /api/v1/reports/templates/:id - Delete template
   */
  public deleteTemplate = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { id } = req.params;

    const template = await ReportTemplate.findOne({
      where: { id, organizationId }
    });

    if (!template) {
      throw new AppError('Template not found or access denied', 404);
    }

    if (template.isSystemDefault) {
      throw new AppError('Cannot delete system default template', 400);
    }

    await template.destroy();

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  });

  /**
   * GET /api/v1/reports - Get generated reports
   */
  public getReports = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { reportType, status, limit } = req.query;

    let reports;
    
    if (reportType) {
      reports = await GeneratedReport.getReportsByType(organizationId, reportType as any);
    } else {
      reports = await GeneratedReport.getRecentReports(
        organizationId,
        limit ? parseInt(limit as string) : 20
      );
    }

    // Filter by status if provided
    if (status) {
      reports = reports.filter(r => r.status === status);
    }

    res.json({
      success: true,
      data: {
        reports: reports.map(r => r.getMetadata()),
        total: reports.length
      }
    });
  });

  /**
   * POST /api/v1/reports/generate - Generate new report
   */
  public generateReport = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const userId = req.user.id;
    const { templateId, name, reportType, parameters, fileFormat } = req.body;

    if (!name || !reportType || !fileFormat) {
      throw new AppError('Missing required fields: name, reportType, fileFormat', 400);
    }

    // Validate template access if provided
    if (templateId) {
      const template = await ReportTemplate.findByPk(templateId);
      if (!template || !template.canUserAccess(userId, organizationId)) {
        throw new AppError('Template not found or access denied', 404);
      }
    }

    const report = await GeneratedReport.create({
      organizationId,
      templateId,
      name,
      reportType,
      parameters,
      fileFormat,
      generatedBy: userId,
      status: 'generating'
    });

    // Validate parameters
    const validation = report.validateParameters();
    if (!validation.isValid) {
      await report.destroy();
      throw new AppError(`Invalid parameters: ${validation.errors.join(', ')}`, 400);
    }

    // Start report generation in background
    const reportService = new ReportGenerationService();
    reportService.generateReport(report.id).catch(error => {
      logger.error(`Report generation failed for ${report.id}:`, error);
      report.updateStatus('failed');
    });

    res.status(202).json({
      success: true,
      data: { 
        report: report.getMetadata(),
        message: 'Report generation started'
      }
    });
  });

  /**
   * GET /api/v1/reports/:id - Get specific report
   */
  public getReport = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { id } = req.params;

    const report = await GeneratedReport.findOne({
      where: { id, organizationId },
      include: [
        {
          model: ReportTemplate,
          as: 'template',
          attributes: ['name', 'reportType']
        }
      ]
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    res.json({
      success: true,
      data: { report: report.getMetadata() }
    });
  });

  /**
   * GET /api/v1/reports/:id/download - Download report file
   */
  public downloadReport = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { id } = req.params;

    const report = await GeneratedReport.findOne({
      where: { id, organizationId }
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    if (!report.isAccessible()) {
      throw new AppError('Report not accessible or expired', 400);
    }

    if (!report.filePath) {
      throw new AppError('Report file not found', 404);
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${report.name}.${report.fileFormat}"`);
    res.setHeader('Content-Type', this.getContentType(report.fileFormat));
    
    res.download(report.filePath, (err) => {
      if (err) {
        logger.error(`Error downloading report ${id}:`, err);
        throw new AppError('Error downloading report', 500);
      }
    });
  });

  /**
   * DELETE /api/v1/reports/:id - Delete report
   */
  public deleteReport = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { id } = req.params;

    const report = await GeneratedReport.findOne({
      where: { id, organizationId }
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    // Delete file if exists
    if (report.filePath) {
      const fs = require('fs');
      try {
        fs.unlinkSync(report.filePath);
      } catch (error) {
        logger.warn(`Could not delete report file: ${report.filePath}`, error);
      }
    }

    await report.destroy();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  });

  /**
   * GET /api/v1/reports/stats - Get reporting statistics
   */
  public getReportingStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;

    const [storageUsage, recentReports, popularTemplates] = await Promise.all([
      GeneratedReport.getStorageUsage(organizationId),
      GeneratedReport.getRecentReports(organizationId, 5),
      ReportTemplate.getPopularTemplates(5)
    ]);

    const templateCount = await ReportTemplate.count({
      where: { organizationId }
    });

    const reportCount = await GeneratedReport.count({
      where: { organizationId }
    });

    res.json({
      success: true,
      data: {
        storage: storageUsage,
        counts: {
          templates: templateCount,
          reports: reportCount
        },
        recent: recentReports.map(r => r.getMetadata()),
        popular: popularTemplates.map(t => t.getPreviewData())
      }
    });
  });

  /**
   * POST /api/v1/reports/templates/:id/clone - Clone template
   */
  public cloneTemplate = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const userId = req.user.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      throw new AppError('New template name is required', 400);
    }

    const originalTemplate = await ReportTemplate.findByPk(id);
    
    if (!originalTemplate) {
      throw new AppError('Template not found', 404);
    }

    if (!originalTemplate.canUserAccess(userId, organizationId)) {
      throw new AppError('Access denied to this template', 403);
    }

    const clonedData = originalTemplate.clone(name, organizationId, userId);
    const clonedTemplate = await ReportTemplate.create(clonedData as any);

    await originalTemplate.incrementUsage();

    res.status(201).json({
      success: true,
      data: { template: clonedTemplate.getPreviewData() }
    });
  });

  private getContentType(format: string): string {
    const contentTypes = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      json: 'application/json'
    };
    
    return contentTypes[format as keyof typeof contentTypes] || 'application/octet-stream';
  }
}