import { logger } from '../utils/logger';
import GeneratedReport from '../models/GeneratedReport';
import ReportTemplate from '../models/ReportTemplate';
import { Website, Keyword, MetricsSnapshot } from '../models';
import * as path from 'path';
import * as fs from 'fs';

export interface ReportData {
  organizationId: string;
  websites: any[];
  analytics: any[];
  competitors: any[];
  keywords: any[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

export class ReportGenerationService {
  private reportsDir: string;

  constructor() {
    this.reportsDir = path.join(process.cwd(), 'storage', 'reports');
    this.ensureReportsDirectory();
  }

  private ensureReportsDirectory(): void {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate a report asynchronously
   */
  public async generateReport(reportId: string): Promise<void> {
    try {
      const report = await GeneratedReport.findByPk(reportId, {
        include: [
          {
            model: ReportTemplate,
            as: 'template'
          }
        ]
      });

      if (!report) {
        throw new Error(`Report ${reportId} not found`);
      }

      logger.info(`Starting report generation: ${reportId}`);

      // Collect data based on report parameters
      const reportData = await this.collectReportData(report);

      // Generate report file based on format
      const filePath = await this.generateReportFile(report, reportData);
      const fileSize = fs.statSync(filePath).size;

      // Update report status
      await report.updateStatus('completed', filePath, fileSize);

      logger.info(`Report generation completed: ${reportId}, file: ${filePath}`);

    } catch (error) {
      logger.error(`Report generation failed for ${reportId}:`, error);
      
      const report = await GeneratedReport.findByPk(reportId);
      if (report) {
        await report.updateStatus('failed');
      }
      
      throw error;
    }
  }

  /**
   * Collect data needed for report generation
   */
  private async collectReportData(report: GeneratedReport): Promise<ReportData> {
    const { organizationId, parameters } = report;
    
    // Determine date range
    const dateRange = this.getDateRange(parameters);

    // Collect websites data
    const websites = await Website.findAll({
      where: { organizationId },
      limit: parameters?.websites?.length || 50
    });

    // Collect analytics data - using MetricsSnapshot as proxy for analytics
    const analytics = await MetricsSnapshot.findAll({
      where: {
        organizationId,
        snapshotAt: {
          [require('sequelize').Op.between]: [dateRange.start, dateRange.end]
        }
      },
      order: [['snapshotAt', 'DESC']],
      limit: 1000
    });

    // Collect competitor data (placeholder - will be implemented with full competitor models)
    const competitors: any[] = [];

    // Collect keywords data
    const keywords = await Keyword.findAll({
      where: { organizationId },
      limit: parameters?.keywords?.length || 100
    });

    return {
      organizationId,
      websites,
      analytics,
      competitors,
      keywords,
      dateRange
    };
  }

  /**
   * Generate report file in the specified format
   */
  private async generateReportFile(report: GeneratedReport, data: ReportData): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${report.fileFormat}`;
    const filePath = path.join(this.reportsDir, fileName);

    switch (report.fileFormat) {
      case 'pdf':
        await this.generatePdfReport(report, data, filePath);
        break;
      case 'excel':
        await this.generateExcelReport(report, data, filePath);
        break;
      case 'csv':
        await this.generateCsvReport(report, data, filePath);
        break;
      case 'json':
        await this.generateJsonReport(report, data, filePath);
        break;
      default:
        throw new Error(`Unsupported report format: ${report.fileFormat}`);
    }

    return filePath;
  }

  /**
   * Generate PDF report
   */
  private async generatePdfReport(report: GeneratedReport, data: ReportData, filePath: string): Promise<void> {
    const PDFDocument = require('pdfkit');
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: report.name,
            Author: 'GEO Platform',
            Subject: `${report.reportType} Report`,
            CreationDate: new Date()
          }
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text(report.name, { align: 'center' });
        doc.fontSize(12).text(`Generated on: ${new Date().toISOString()}`, { align: 'center' });
        doc.moveDown(2);

        // Report content based on type
        switch (report.reportType) {
          case 'competitor_benchmark':
            this.addCompetitorBenchmarkContent(doc, data);
            break;
          case 'market_position':
            this.addMarketPositionContent(doc, data);
            break;
          case 'keyword_analysis':
            this.addKeywordAnalysisContent(doc, data);
            break;
          default:
            this.addGenericContent(doc, data);
        }

        doc.end();

        stream.on('finish', () => {
          resolve();
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Excel report
   */
  private async generateExcelReport(report: GeneratedReport, data: ReportData, filePath: string): Promise<void> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();

    // Metadata
    workbook.creator = 'GEO Platform';
    workbook.lastModifiedBy = 'GEO Platform';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Report Name', report.name]);
    summarySheet.addRow(['Report Type', report.reportType]);
    summarySheet.addRow(['Generated Date', new Date().toISOString()]);
    summarySheet.addRow(['Date Range', `${data.dateRange.start.toISOString()} - ${data.dateRange.end.toISOString()}`]);
    summarySheet.addRow([]);

    // Data sheets based on report type
    if (data.websites.length > 0) {
      const websitesSheet = workbook.addWorksheet('Websites');
      websitesSheet.addRow(['ID', 'Name', 'URL', 'Domain', 'Created At']);
      data.websites.forEach(website => {
        websitesSheet.addRow([website.id, website.name, website.url, website.domain, website.createdAt]);
      });
    }

    if (data.analytics.length > 0) {
      const analyticsSheet = workbook.addWorksheet('Analytics');
      analyticsSheet.addRow(['Date', 'Website ID', 'Metric Type', 'Platform', 'Value', 'Change %']);
      data.analytics.forEach(analytics => {
        analyticsSheet.addRow([
          analytics.snapshotDate,
          analytics.websiteId,
          analytics.metricType,
          analytics.platform,
          analytics.metricValue,
          analytics.changePercentage
        ]);
      });
    }

    if (data.competitors.length > 0) {
      const competitorsSheet = workbook.addWorksheet('Competitor Analysis');
      competitorsSheet.addRow(['Date', 'Website ID', 'Competitor ID', 'Metric', 'Our Score', 'Competitor Score', 'Gap']);
      data.competitors.forEach(comp => {
        competitorsSheet.addRow([
          comp.benchmarkDate,
          comp.websiteId,
          comp.competitorId,
          comp.metricType,
          comp.ourScore,
          comp.competitorScore,
          comp.performanceGap
        ]);
      });
    }

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * Generate CSV report
   */
  private async generateCsvReport(report: GeneratedReport, data: ReportData, filePath: string): Promise<void> {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    
    const csvData: any[] = [];

    // Flatten all data into a single CSV structure
    data.analytics.forEach((item: any) => {
      csvData.push({
        type: 'analytics',
        date: item.createdAt,
        websiteId: item.websiteId,
        metricType: item.metricType,
        platform: item.platform,
        value: item.metricValue,
        changePercentage: item.changePercentage || 0
      });
    });

    data.competitors.forEach((item: any) => {
      csvData.push({
        type: 'competitor',
        date: item.benchmarkDate || new Date(),
        websiteId: item.websiteId,
        competitorId: item.competitorId,
        metricType: item.metricType,
        ourScore: item.ourScore,
        competitorScore: item.competitorScore,
        gap: item.performanceGap
      });
    });

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'type', title: 'Type' },
        { id: 'date', title: 'Date' },
        { id: 'websiteId', title: 'Website ID' },
        { id: 'metricType', title: 'Metric Type' },
        { id: 'platform', title: 'Platform' },
        { id: 'value', title: 'Value' },
        { id: 'changePercentage', title: 'Change %' },
        { id: 'competitorId', title: 'Competitor ID' },
        { id: 'ourScore', title: 'Our Score' },
        { id: 'competitorScore', title: 'Competitor Score' },
        { id: 'gap', title: 'Performance Gap' }
      ]
    });

    await csvWriter.writeRecords(csvData);
  }

  /**
   * Generate JSON report
   */
  private async generateJsonReport(report: GeneratedReport, data: ReportData, filePath: string): Promise<void> {
    const reportJson = {
      metadata: {
        reportId: report.id,
        name: report.name,
        type: report.reportType,
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: data.dateRange.start.toISOString(),
          end: data.dateRange.end.toISOString()
        },
        parameters: report.parameters
      },
      data: {
        websites: data.websites,
        analytics: data.analytics,
        competitors: data.competitors,
        keywords: data.keywords
      },
      summary: {
        websitesCount: data.websites.length,
        analyticsRecords: data.analytics.length,
        competitorRecords: data.competitors.length,
        keywordsCount: data.keywords.length
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(reportJson, null, 2), 'utf8');
  }

  /**
   * Get date range from parameters or use default
   */
  private getDateRange(parameters: any): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Default to 30 days

    if (parameters?.dateRange) {
      return {
        start: new Date(parameters.dateRange.start),
        end: new Date(parameters.dateRange.end)
      };
    }

    return { start, end };
  }

  /**
   * Add competitor benchmark content to PDF
   */
  private addCompetitorBenchmarkContent(doc: any, data: ReportData): void {
    doc.fontSize(16).text('Competitor Benchmark Analysis', { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Analysis Period: ${data.dateRange.start.toDateString()} - ${data.dateRange.end.toDateString()}`);
    doc.text(`Websites Analyzed: ${data.websites.length}`);
    doc.text(`Competitor Records: ${data.competitors.length}`);
    doc.moveDown();

    if (data.competitors.length > 0) {
      doc.fontSize(14).text('Top Performance Gaps:', { underline: true });
      doc.moveDown();

      // Sort by performance gap and show top 10
      const topGaps = data.competitors
        .sort((a, b) => Math.abs(b.performanceGap) - Math.abs(a.performanceGap))
        .slice(0, 10);

      topGaps.forEach((comp, index) => {
        doc.fontSize(10).text(
          `${index + 1}. ${comp.metricType}: ${comp.performanceGap > 0 ? '+' : ''}${comp.performanceGap.toFixed(2)}% gap`,
          { indent: 20 }
        );
      });
    }
  }

  /**
   * Add market position content to PDF
   */
  private addMarketPositionContent(doc: any, data: ReportData): void {
    doc.fontSize(16).text('Market Position Analysis', { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Analysis Period: ${data.dateRange.start.toDateString()} - ${data.dateRange.end.toDateString()}`);
    doc.text(`Websites: ${data.websites.length}`);
    doc.text(`Analytics Records: ${data.analytics.length}`);
    doc.moveDown();

    if (data.analytics.length > 0) {
      doc.fontSize(14).text('Key Metrics Overview:', { underline: true });
      doc.moveDown();

      // Group analytics by metric type
      const metricGroups = data.analytics.reduce((acc: any, item: any) => {
        if (!acc[item.metricType]) acc[item.metricType] = [];
        acc[item.metricType].push(item);
        return acc;
      }, {});

      Object.entries(metricGroups).forEach(([metric, records]) => {
        const recordsArray = records as any[];
        const avg = recordsArray.reduce((sum, r) => sum + (r.metricValue || 0), 0) / recordsArray.length;
        doc.fontSize(10).text(`${metric}: Average ${avg.toFixed(2)}`, { indent: 20 });
      });
    }
  }

  /**
   * Add keyword analysis content to PDF
   */
  private addKeywordAnalysisContent(doc: any, data: ReportData): void {
    doc.fontSize(16).text('Keyword Analysis Report', { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Keywords Analyzed: ${data.keywords.length}`);
    doc.text(`Analysis Period: ${data.dateRange.start.toDateString()} - ${data.dateRange.end.toDateString()}`);
    doc.moveDown();

    if (data.keywords.length > 0) {
      doc.fontSize(14).text('Keywords List:', { underline: true });
      doc.moveDown();

      data.keywords.slice(0, 20).forEach((keyword, index) => {
        doc.fontSize(10).text(
          `${index + 1}. ${keyword.keyword} (${keyword.category || 'General'})`,
          { indent: 20 }
        );
      });

      if (data.keywords.length > 20) {
        doc.fontSize(10).text(`... and ${data.keywords.length - 20} more keywords`, { indent: 20 });
      }
    }
  }

  /**
   * Add generic content to PDF
   */
  private addGenericContent(doc: any, data: ReportData): void {
    doc.fontSize(16).text('Analytics Report', { underline: true });
    doc.moveDown();

    doc.fontSize(12).text('Report Summary:');
    doc.text(`• Websites: ${data.websites.length}`);
    doc.text(`• Analytics Records: ${data.analytics.length}`);
    doc.text(`• Competitor Records: ${data.competitors.length}`);
    doc.text(`• Keywords: ${data.keywords.length}`);
    doc.text(`• Period: ${data.dateRange.start.toDateString()} - ${data.dateRange.end.toDateString()}`);
    doc.moveDown();

    doc.fontSize(10).text('This report contains comprehensive analytics data for your organization.');
  }
}