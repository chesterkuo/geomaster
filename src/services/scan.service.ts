import Bull from 'bull';
import { Website, Scan, Content } from '../models';
import { CrawlerService, CrawlResult } from './crawler.service';
import { OptimizationService } from './optimization.service';
import { AITrackingService } from './ai-tracking.service';
import { logger } from '../utils/logger';
import { queueRedis } from '../config/redis';
import { QUEUE_NAMES, SCAN_TYPES, SCAN_STATUS, GEO_SCORING_WEIGHTS } from '../config/constants';

interface ScanJobData {
  scanId: string;
  websiteId: string;
  scanType: string;
  userId?: string;
}

interface ScanResults {
  crawlData: CrawlResult[];
  geoScore: number;
  recommendations: any[];
  contentAnalysis: any;
  technicalIssues: any[];
  performance: any;
}

export class ScanService {
  private scanQueue: Bull.Queue;
  private crawlerService: CrawlerService;
  private optimizationService: OptimizationService;
  private aiTrackingService: AITrackingService;

  constructor() {
    this.scanQueue = new Bull(QUEUE_NAMES.WEBSITE_SCAN, {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    this.crawlerService = new CrawlerService();
    this.optimizationService = new OptimizationService();
    this.aiTrackingService = new AITrackingService();

    this.setupQueueProcessors();
  }

  private setupQueueProcessors(): void {
    this.scanQueue.process('website-scan', async (job) => {
      const { scanId, websiteId, scanType } = job.data as ScanJobData;
      
      try {
        logger.info(`Starting scan ${scanId} for website ${websiteId}`);

        // Update scan status to running
        await this.updateScanStatus(scanId, SCAN_STATUS.RUNNING, 0);

        // Step 1: Crawl website (30% progress)
        await job.progress(10);
        const crawlData = await this.crawlerService.crawlWebsite(
          await this.getWebsiteUrl(websiteId), 
          scanType as any
        );
        await job.progress(30);

        // Step 2: Analyze content and calculate GEO score (50% progress)
        const contentAnalysis = await this.analyzeContent(crawlData);
        const geoScore = this.calculateGEOScore(contentAnalysis);
        await job.progress(50);

        // Step 3: Generate recommendations (70% progress)
        const recommendations = await this.generateRecommendations(crawlData, contentAnalysis);
        await job.progress(70);

        // Step 4: Check for technical issues (85% progress)
        const technicalIssues = this.analyzeTechnicalIssues(crawlData);
        await job.progress(85);

        // Step 5: Save crawled content to database (95% progress)
        await this.saveContentData(websiteId, crawlData, geoScore);
        await job.progress(95);

        // Step 6: Finalize results (100% progress)
        const results: ScanResults = {
          crawlData,
          geoScore,
          recommendations,
          contentAnalysis,
          technicalIssues,
          performance: this.calculatePerformanceMetrics(crawlData)
        };

        await this.completeScan(scanId, results);
        await job.progress(100);

        logger.info(`Completed scan ${scanId} with GEO score: ${geoScore}`);
        return results;

      } catch (error) {
        logger.error(`Scan ${scanId} failed:`, error);
        await this.failScan(scanId, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });

    // Queue event handlers
    this.scanQueue.on('completed', (job, result) => {
      logger.info(`Scan job ${job.id} completed successfully`);
    });

    this.scanQueue.on('failed', (job, error) => {
      logger.error(`Scan job ${job.id} failed:`, error);
    });

    this.scanQueue.on('progress', (job, progress) => {
      logger.debug(`Scan job ${job.id} progress: ${progress}%`);
    });
  }

  async initiateScan(websiteId: string, scanType: string = SCAN_TYPES.STANDARD, userId?: string): Promise<string> {
    try {
      // Verify website exists
      const website = await Website.findByPk(websiteId);
      if (!website) {
        throw new Error('Website not found');
      }

      // Check if there's already a running scan for this website
      const existingScan = await Scan.findOne({
        where: {
          websiteId,
          status: [SCAN_STATUS.PENDING, SCAN_STATUS.RUNNING]
        }
      });

      if (existingScan) {
        throw new Error('There is already a scan in progress for this website');
      }

      // Create scan record
      const scan = await Scan.create({
        websiteId,
        scanType: scanType as any,
        status: SCAN_STATUS.PENDING,
        progress: 0
      });

      // Add job to queue
      await this.scanQueue.add('website-scan', {
        scanId: scan.id,
        websiteId,
        scanType,
        userId
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 10,
        removeOnFail: 5
      });

      // Update website last scan time
      await website.updateLastScan();

      logger.info(`Initiated scan ${scan.id} for website ${websiteId}`);
      return scan.id;

    } catch (error) {
      logger.error('Failed to initiate scan:', error);
      throw error;
    }
  }

  async getScanStatus(scanId: string): Promise<any> {
    const scan = await Scan.findByPk(scanId, {
      include: [{ model: Website, as: 'website' }]
    });

    if (!scan) {
      throw new Error('Scan not found');
    }

    return {
      scan: scan.toJSON(),
      estimatedTimeRemaining: this.estimateTimeRemaining(scan.progress, scan.startedAt)
    };
  }

  async getScanResults(scanId: string): Promise<ScanResults | null> {
    const scan = await Scan.findByPk(scanId);
    
    if (!scan || scan.status !== SCAN_STATUS.COMPLETED) {
      return null;
    }

    return scan.results as ScanResults;
  }

  private async getWebsiteUrl(websiteId: string): Promise<string> {
    const website = await Website.findByPk(websiteId);
    if (!website) {
      throw new Error('Website not found');
    }
    return website.url;
  }

  private async updateScanStatus(scanId: string, status: string, progress?: number): Promise<void> {
    const updateData: any = { status };
    
    if (status === SCAN_STATUS.RUNNING && !await this.getScanStartTime(scanId)) {
      updateData.startedAt = new Date();
    }
    
    if (progress !== undefined) {
      updateData.progress = progress;
    }

    await Scan.update(updateData, { where: { id: scanId } });
  }

  private async getScanStartTime(scanId: string): Promise<Date | null> {
    const scan = await Scan.findByPk(scanId, { attributes: ['startedAt'] });
    return scan?.startedAt || null;
  }

  private async analyzeContent(crawlData: CrawlResult[]): Promise<any> {
    const analysis = {
      totalPages: crawlData.length,
      avgWordCount: 0,
      avgLoadTime: 0,
      schemaMarkupPages: 0,
      missingMetaDescription: 0,
      missingTitles: 0,
      duplicateTitles: new Set(),
      h1Issues: 0,
      imagesMissingAlt: 0,
      internalLinks: 0,
      externalLinks: 0,
      contentDepth: 0,
      structureQuality: 0,
      schemaCompleteness: 0,
      freshness: 0,
      crawlability: 0,
      siteSpeed: 0,
      citations: 0,
      expertise: 0
    };

    if (crawlData.length === 0) return analysis;

    const titles = new Set();
    let totalWordCount = 0;
    let totalLoadTime = 0;

    crawlData.forEach(page => {
      // Basic metrics
      totalWordCount += page.wordCount;
      if (page.performance?.loadTime) {
        totalLoadTime += page.performance.loadTime;
      }

      // Schema markup
      if (page.technical.hasSchemaMarkup) {
        analysis.schemaMarkupPages++;
      }

      // Meta descriptions and titles
      if (!page.metaDescription?.trim()) {
        analysis.missingMetaDescription++;
      }
      if (!page.title?.trim()) {
        analysis.missingTitles++;
      } else {
        if (titles.has(page.title)) {
          analysis.duplicateTitles.add(page.title);
        }
        titles.add(page.title);
      }

      // H1 issues (missing or multiple H1s)
      if (page.headings.h1.length !== 1) {
        analysis.h1Issues++;
      }

      // Images without alt text
      analysis.imagesMissingAlt += page.images.filter(img => !img.alt?.trim()).length;

      // Links
      analysis.internalLinks += page.links.filter(link => link.type === 'internal').length;
      analysis.externalLinks += page.links.filter(link => link.type === 'external').length;
    });

    // Calculate averages
    analysis.avgWordCount = Math.round(totalWordCount / crawlData.length);
    analysis.avgLoadTime = Math.round(totalLoadTime / crawlData.length);

    // Calculate GEO scoring factors
    analysis.contentDepth = Math.min(100, (analysis.avgWordCount / 15) * 100); // Target: 1500+ words
    analysis.structureQuality = this.calculateStructureQuality(crawlData);
    analysis.schemaCompleteness = (analysis.schemaMarkupPages / analysis.totalPages) * 100;
    analysis.freshness = this.calculateFreshness(crawlData);
    analysis.crawlability = this.calculateCrawlability(crawlData);
    analysis.siteSpeed = Math.max(0, 100 - (analysis.avgLoadTime / 100)); // Faster = higher score
    analysis.citations = this.calculateCitations(crawlData);
    analysis.expertise = this.calculateExpertise(crawlData);

    return analysis;
  }

  private calculateGEOScore(analysis: any): number {
    const weights = GEO_SCORING_WEIGHTS;
    
    let score = 0;
    score += analysis.contentDepth * weights.CONTENT_DEPTH;
    score += analysis.structureQuality * weights.STRUCTURE_QUALITY;
    score += analysis.schemaCompleteness * weights.SCHEMA_COMPLETENESS;
    score += analysis.freshness * weights.FRESHNESS;
    score += analysis.crawlability * weights.CRAWLABILITY;
    score += analysis.siteSpeed * weights.SITE_SPEED;
    score += analysis.citations * weights.CITATIONS;
    score += analysis.expertise * weights.EXPERTISE;

    return Math.min(100, Math.round(score));
  }

  private calculateStructureQuality(crawlData: CrawlResult[]): number {
    let structureScore = 100;
    
    crawlData.forEach(page => {
      // Penalize missing H1 or multiple H1s
      if (page.headings.h1.length !== 1) {
        structureScore -= 10;
      }
      
      // Reward proper heading hierarchy
      const hasH2 = page.headings.h2.length > 0;
      const hasH3 = page.headings.h3.length > 0;
      if (hasH2 && hasH3) {
        structureScore += 5;
      }
    });

    return Math.max(0, Math.min(100, structureScore));
  }

  private calculateFreshness(crawlData: CrawlResult[]): number {
    // This would typically check last modified dates, publication dates, etc.
    // For now, return a default score
    return 75;
  }

  private calculateCrawlability(crawlData: CrawlResult[]): number {
    let score = 100;
    
    // Check if robots.txt blocks AI bots
    const robotsTxt = crawlData[0]?.robotsTxt;
    if (robotsTxt && !robotsTxt.allowsAIBots) {
      score -= 30;
    }

    // Check for HTTPS
    const httpsPages = crawlData.filter(page => page.technical.httpsEnabled).length;
    const httpsRatio = httpsPages / crawlData.length;
    score *= httpsRatio;

    return Math.max(0, score);
  }

  private calculateCitations(crawlData: CrawlResult[]): number {
    // This would analyze external authoritative links, references, etc.
    // For now, use external links as a proxy
    let totalExternalLinks = 0;
    crawlData.forEach(page => {
      totalExternalLinks += page.links.filter(link => 
        link.type === 'external' && 
        this.isAuthoritativeSource(link.href)
      ).length;
    });

    return Math.min(100, totalExternalLinks * 10);
  }

  private calculateExpertise(crawlData: CrawlResult[]): number {
    // This would analyze author credentials, expertise indicators, etc.
    // For now, use content depth and structure as proxies
    let expertiseScore = 0;
    
    crawlData.forEach(page => {
      if (page.wordCount >= 1500) expertiseScore += 20;
      if (page.technical.hasSchemaMarkup) expertiseScore += 15;
      if (page.headings.h2.length >= 3) expertiseScore += 10;
    });

    return Math.min(100, expertiseScore / crawlData.length);
  }

  private isAuthoritativeSource(url: string): boolean {
    const authoritativeDomains = [
      'wikipedia.org', 'gov', 'edu', 'nih.gov', 'cdc.gov',
      'who.int', 'nature.com', 'science.org', 'ieee.org'
    ];
    
    return authoritativeDomains.some(domain => url.includes(domain));
  }

  private async generateRecommendations(crawlData: CrawlResult[], analysis: any): Promise<any[]> {
    const recommendations = [];

    // Technical recommendations
    if (crawlData[0]?.robotsTxt && !crawlData[0].robotsTxt.allowsAIBots) {
      recommendations.push({
        priority: 'high',
        category: 'technical',
        issue: 'AI bots blocked in robots.txt',
        solution: 'Add User-agent entries for GPTBot, ChatGPT-User, PerplexityBot, and ClaudeBot',
        impact: 'High - Essential for AI search visibility'
      });
    }

    // Content recommendations
    if (analysis.avgWordCount < 1500) {
      recommendations.push({
        priority: 'medium',
        category: 'content',
        issue: 'Content depth insufficient',
        solution: `Increase average content length from ${analysis.avgWordCount} to 1500+ words`,
        impact: 'Medium - Better AI comprehension and ranking'
      });
    }

    // Schema markup recommendations
    if (analysis.schemaCompleteness < 50) {
      recommendations.push({
        priority: 'high',
        category: 'schema',
        issue: 'Missing structured data',
        solution: 'Implement FAQ, Article, and Organization schema markup',
        impact: 'High - Critical for AI search results'
      });
    }

    // Performance recommendations
    if (analysis.avgLoadTime > 3000) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        issue: 'Slow page load times',
        solution: `Optimize page speed from ${Math.round(analysis.avgLoadTime/1000)}s to under 3s`,
        impact: 'Medium - Affects user experience and crawlability'
      });
    }

    // SEO recommendations
    if (analysis.missingMetaDescription > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'seo',
        issue: `${analysis.missingMetaDescription} pages missing meta descriptions`,
        solution: 'Add compelling meta descriptions to all pages',
        impact: 'Medium - Important for search snippets'
      });
    }

    return recommendations;
  }

  private analyzeTechnicalIssues(crawlData: CrawlResult[]): any[] {
    const issues: any[] = [];

    crawlData.forEach((page, index) => {
      // Missing alt tags
      const missingAltImages = page.images.filter(img => !img.alt?.trim());
      if (missingAltImages.length > 0) {
        issues.push({
          page: page.url,
          type: 'accessibility',
          issue: `${missingAltImages.length} images missing alt text`,
          severity: 'medium'
        });
      }

      // Missing H1 or multiple H1s
      if (page.headings.h1.length === 0) {
        issues.push({
          page: page.url,
          type: 'seo',
          issue: 'Missing H1 heading',
          severity: 'high'
        });
      } else if (page.headings.h1.length > 1) {
        issues.push({
          page: page.url,
          type: 'seo',
          issue: 'Multiple H1 headings found',
          severity: 'medium'
        });
      }

      // Long page load times
      if (page.performance && page.performance.loadTime > 5000) {
        issues.push({
          page: page.url,
          type: 'performance',
          issue: `Slow load time: ${Math.round(page.performance.loadTime/1000)}s`,
          severity: 'high'
        });
      }
    });

    return issues;
  }

  private calculatePerformanceMetrics(crawlData: CrawlResult[]): any {
    const totalPages = crawlData.length;
    if (totalPages === 0) return {};

    const loadTimes = crawlData
      .filter(page => page.performance?.loadTime)
      .map(page => page.performance!.loadTime);

    return {
      avgLoadTime: loadTimes.length > 0 ? Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length) : 0,
      slowestPage: Math.max(...loadTimes),
      fastestPage: Math.min(...loadTimes),
      pagesAnalyzed: totalPages
    };
  }

  private async saveContentData(websiteId: string, crawlData: CrawlResult[], geoScore: number): Promise<void> {
    for (const page of crawlData) {
      try {
        // Check if content already exists
        let content = await Content.findOne({
          where: { websiteId, url: page.url }
        });

        const contentData = {
          websiteId,
          url: page.url,
          title: page.title || undefined,
          metaDescription: page.metaDescription || undefined,
          originalContent: page.content,
          geoScore: geoScore,
          wordCount: page.wordCount,
          readingTime: Math.ceil(page.wordCount / 200),
          hasSchema: page.technical.hasSchemaMarkup,
          schemaTypes: page.schema.map((s: any) => s['@type']).filter(Boolean),
          optimizationStatus: 'pending' as const
        };

        if (content) {
          await content.update(contentData);
        } else {
          await Content.create(contentData);
        }
      } catch (error) {
        logger.error(`Failed to save content for ${page.url}:`, error);
      }
    }
  }

  private async completeScan(scanId: string, results: ScanResults): Promise<void> {
    await Scan.update({
      status: SCAN_STATUS.COMPLETED,
      progress: 100,
      completedAt: new Date(),
      results: results
    }, { where: { id: scanId } });
  }

  private async failScan(scanId: string, errorMessage: string): Promise<void> {
    await Scan.update({
      status: SCAN_STATUS.FAILED,
      errorMessage
    }, { where: { id: scanId } });
  }

  private estimateTimeRemaining(progress: number, startedAt?: Date): number | null {
    if (!startedAt || progress <= 0) return null;
    
    const elapsed = Date.now() - startedAt.getTime();
    const estimatedTotal = (elapsed / progress) * 100;
    const remaining = estimatedTotal - elapsed;
    
    return Math.max(0, Math.round(remaining / 1000)); // seconds
  }

  async getQueueStatus(): Promise<any> {
    const waiting = await this.scanQueue.getWaiting();
    const active = await this.scanQueue.getActive();
    const completed = await this.scanQueue.getCompleted();
    const failed = await this.scanQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }

  async close(): Promise<void> {
    await this.scanQueue.close();
    await this.crawlerService.close();
  }
}