import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { ContentAnalyzerService } from '../services/contentAnalyzer.service';
import { AIOptimizerService, AIProvider } from '../services/aiOptimizer.service';
import { Page } from '../models';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class ContentController {
  private contentAnalyzer: ContentAnalyzerService;
  private aiOptimizer: AIOptimizerService;

  constructor() {
    this.contentAnalyzer = new ContentAnalyzerService();
    this.aiOptimizer = new AIOptimizerService();
  }

  public getOptimizationSuggestions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { url, content, provider = 'openai' } = req.body;
    
    try {
      console.log(`🔍 Starting real optimization analysis for: ${url} using provider: ${provider}`);
      
      // Validate provider parameter
      if (!['openai', 'gemini'].includes(provider)) {
        res.status(400).json({
          success: false,
          message: 'Invalid provider. Supported providers are: openai, gemini'
        });
        return;
      }
      
      // Step 1: Scrape and analyze the website
      const websiteContent = await this.contentAnalyzer.scrapeWebsite(url);
      console.log(`📊 Website scraped successfully: ${websiteContent.title}`);
      
      // Step 2: Perform comprehensive content analysis
      const analysisResult = await this.contentAnalyzer.analyzeContent(websiteContent);
      console.log(`🎯 Analysis completed - Overall Score: ${analysisResult.overallScore}/100`);
      
      // Step 3: Generate AI-powered optimization suggestions
      const optimizationResult = await this.aiOptimizer.generateOptimizations(
        websiteContent,
        analysisResult,
        provider as AIProvider
      );
      console.log(`✅ Generated ${optimizationResult.suggestions.length} optimization suggestions using ${optimizationResult.provider}`);

      // Step 4: Format response for frontend
      const response = {
        suggestions: optimizationResult.suggestions.map(suggestion => ({
          type: suggestion.type,
          current: suggestion.current,
          suggested: suggestion.suggested,
          reason: suggestion.reason,
          priority: suggestion.priority,
          implementation: suggestion.implementation
        })),
        geoScore: optimizationResult.geoScore,
        improvements: optimizationResult.improvements,
        executionPlan: optimizationResult.executionPlan,
        provider: optimizationResult.provider,
        analysisDetails: {
          technicalHealth: analysisResult.technicalHealth.score,
          contentQuality: analysisResult.contentQuality.score,
          aiVisibility: analysisResult.aiVisibility.score,
          overallScore: analysisResult.overallScore
        },
        websiteInfo: {
          title: websiteContent.title,
          description: websiteContent.description,
          wordCount: websiteContent.wordCount,
          imagesCount: websiteContent.images.length,
          structuredDataCount: websiteContent.structuredData.length,
          isHttps: websiteContent.isHttps,
          robotsTxtExists: websiteContent.robotsTxtExists,
          responseTime: websiteContent.responseTime
        }
      };

      console.log(`🚀 Optimization analysis completed successfully for ${url}`);

      res.json({
        success: true,
        data: response
      });

    } catch (error: any) {
      console.error('Optimization analysis failed:', error.message);
      
      // Fallback to basic suggestions on error
      const fallbackSuggestions = {
        suggestions: [
          {
            type: 'meta_title',
            current: 'Unable to analyze current title',
            suggested: 'Optimize your page title for AI search engines (30-60 characters)',
            reason: 'Well-optimized titles improve visibility in AI search results',
            priority: 'high',
            implementation: [
              'Review current page title',
              'Include primary keywords',
              'Keep between 30-60 characters',
              'Make it descriptive and compelling'
            ]
          },
          {
            type: 'schema',
            current: 'Unable to analyze structured data',
            suggested: 'Add Schema.org structured data to help AI understand your content',
            reason: 'Structured data provides context that AI search engines can interpret',
            priority: 'high',
            implementation: [
              'Add JSON-LD structured data',
              'Include relevant Schema.org types',
              'Validate with testing tools',
              'Update as content changes'
            ]
          },
          {
            type: 'faq',
            current: 'Unable to analyze FAQ content',
            suggested: 'Create an FAQ section with common questions and answers',
            reason: 'FAQ content is highly valuable for AI search engines',
            priority: 'medium',
            implementation: [
              'Research common questions',
              'Create question and answer pairs',
              'Add FAQPage structured data',
              'Update regularly'
            ]
          }
        ],
        geoScore: 50,
        improvements: {
          current: 50,
          potential: 75
        },
        executionPlan: [
          {
            phase: 'Phase 1: Basic Setup',
            duration: '1-2 weeks',
            actions: ['Add structured data', 'Optimize meta tags'],
            expectedResults: 'Improved AI discoverability'
          }
        ],
        error: 'Analysis failed, showing general recommendations'
      };

      res.json({
        success: true,
        data: fallbackSuggestions,
        warning: `Unable to fully analyze ${url}: ${error.message}`
      });
    }
  });

  
  public getPages = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    
    if (!organizationId) {
      res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
      return;
    }

    try {
      const pages = await Page.findAll({
        where: { organizationId },
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: pages
      });
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pages',
        error: error.message
      });
    }
  });

  public addPage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { title, url, type, traffic } = req.body;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
      return;
    }

    if (!title || !url) {
      res.status(400).json({
        success: false,
        message: 'Title and URL are required'
      });
      return;
    }

    try {
      // Validate URL format
      new URL(url);
    } catch {
      res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
      return;
    }

    try {
      // Check if page with same URL already exists for this organization
      const existingPage = await Page.findOne({
        where: { organizationId, url }
      });

      if (existingPage) {
        res.status(409).json({
          success: false,
          message: 'A page with this URL already exists'
        });
        return;
      }

      const page = await Page.create({
        organizationId,
        title,
        url,
        type: type || 'other',
        traffic: traffic || 'medium',
        analysisStatus: 'pending'
      });

      res.status(201).json({
        success: true,
        data: page
      });
    } catch (error: any) {
      console.error('Error adding page:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add page',
        error: error.message
      });
    }
  });

  public updatePage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { pageId } = req.params;
    const { title, url, type, traffic } = req.body;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
      return;
    }

    try {
      const page = await Page.findOne({
        where: { id: pageId, organizationId }
      });

      if (!page) {
        res.status(404).json({
          success: false,
          message: 'Page not found'
        });
        return;
      }

      // Validate URL format if provided
      if (url) {
        try {
          new URL(url);
        } catch {
          res.status(400).json({
            success: false,
            message: 'Invalid URL format'
          });
          return;
        }
      }

      // Update page
      await page.update({
        ...(title && { title }),
        ...(url && { url }),
        ...(type && { type }),
        ...(traffic && { traffic })
      });

      res.json({
        success: true,
        data: page
      });
    } catch (error: any) {
      console.error('Error updating page:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update page',
        error: error.message
      });
    }
  });

  public deletePage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { pageId } = req.params;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
      return;
    }

    try {
      const page = await Page.findOne({
        where: { id: pageId, organizationId }
      });

      if (!page) {
        res.status(404).json({
          success: false,
          message: 'Page not found'
        });
        return;
      }

      await page.destroy();

      res.json({
        success: true,
        message: 'Page deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting page:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete page',
        error: error.message
      });
    }
  });

  public analyzePage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { pageId } = req.params;
    const { provider = 'openai' } = req.body;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
      return;
    }

    try {
      const page = await Page.findOne({
        where: { id: pageId, organizationId }
      });

      if (!page) {
        res.status(404).json({
          success: false,
          message: 'Page not found'
        });
        return;
      }

      // Update status to analyzing
      await page.update({ analysisStatus: 'analyzing' });

      try {
        console.log(`🔍 Starting page analysis for: ${page.url} using provider: ${provider}`);
        
        // Validate provider parameter
        if (!['openai', 'gemini'].includes(provider)) {
          res.status(400).json({
            success: false,
            message: 'Invalid provider. Supported providers are: openai, gemini'
          });
          return;
        }
        
        // Step 1: Scrape and analyze the website
        const websiteContent = await this.contentAnalyzer.scrapeWebsite(page.url);
        console.log(`📊 Website scraped successfully: ${websiteContent.title}`);
        
        // Step 2: Perform comprehensive content analysis
        const analysisResult = await this.contentAnalyzer.analyzeContent(websiteContent);
        console.log(`🎯 Analysis completed - Overall Score: ${analysisResult.overallScore}/100`);
        
        // Step 3: Generate AI-powered optimization suggestions
        const optimizationResult = await this.aiOptimizer.generateOptimizations(
          websiteContent,
          analysisResult,
          provider as AIProvider
        );
        console.log(`✅ Generated ${optimizationResult.suggestions.length} optimization suggestions using ${optimizationResult.provider}`);

        // Update page with analysis results
        await page.update({
          geoScore: optimizationResult.geoScore,
          lastAnalyzedAt: new Date(),
          analysisStatus: 'completed',
          estimatedImprovement: optimizationResult.improvements.potential - optimizationResult.improvements.current
        });

        const response = {
          page: page.toJSON(),
          suggestions: optimizationResult.suggestions,
          geoScore: optimizationResult.geoScore,
          improvements: optimizationResult.improvements,
          executionPlan: optimizationResult.executionPlan,
          provider: optimizationResult.provider,
          analysisDetails: {
            technicalHealth: analysisResult.technicalHealth.score,
            contentQuality: analysisResult.contentQuality.score,
            aiVisibility: analysisResult.aiVisibility.score,
            overallScore: analysisResult.overallScore
          },
          websiteInfo: {
            title: websiteContent.title,
            description: websiteContent.description,
            wordCount: websiteContent.wordCount,
            imagesCount: websiteContent.images.length,
            structuredDataCount: websiteContent.structuredData.length,
            isHttps: websiteContent.isHttps,
            robotsTxtExists: websiteContent.robotsTxtExists,
            responseTime: websiteContent.responseTime
          }
        };

        console.log(`🚀 Page analysis completed successfully for ${page.url}`);

        res.json({
          success: true,
          data: response
        });
      } catch (analysisError: any) {
        console.error('Analysis failed:', analysisError.message);
        
        // Update page status to failed
        await page.update({ 
          analysisStatus: 'failed',
          issues: [analysisError.message]
        });

        res.status(500).json({
          success: false,
          message: 'Page analysis failed',
          error: analysisError.message
        });
      }
    } catch (error: any) {
      console.error('Error analyzing page:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze page',
        error: error.message
      });
    }
  });

  public batchAnalyzePages = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { pageIds, provider = 'openai' } = req.body;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
      return;
    }

    if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Page IDs array is required'
      });
      return;
    }

    try {
      // Validate provider parameter
      if (!['openai', 'gemini'].includes(provider)) {
        res.status(400).json({
          success: false,
          message: 'Invalid provider. Supported providers are: openai, gemini'
        });
        return;
      }

      // Find all pages belonging to this organization
      const pages = await Page.findAll({
        where: { 
          id: pageIds,
          organizationId 
        }
      });

      if (pages.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No pages found'
        });
        return;
      }

      console.log(`🔍 Starting batch analysis for ${pages.length} pages using provider: ${provider}`);

      // Update all pages to analyzing status
      await Page.update(
        { analysisStatus: 'analyzing' },
        { where: { id: pageIds, organizationId } }
      );

      // Start analysis for each page (this could be made parallel for better performance)
      const results = [];
      for (const page of pages) {
        try {
          console.log(`📊 Analyzing page: ${page.url}`);
          
          const websiteContent = await this.contentAnalyzer.scrapeWebsite(page.url);
          const analysisResult = await this.contentAnalyzer.analyzeContent(websiteContent);
          const optimizationResult = await this.aiOptimizer.generateOptimizations(
            websiteContent,
            analysisResult,
            provider as AIProvider
          );

          await page.update({
            geoScore: optimizationResult.geoScore,
            lastAnalyzedAt: new Date(),
            analysisStatus: 'completed',
            estimatedImprovement: optimizationResult.improvements.potential - optimizationResult.improvements.current
          });

          results.push({
            pageId: page.id,
            status: 'completed',
            geoScore: optimizationResult.geoScore,
            suggestionsCount: optimizationResult.suggestions.length
          });
        } catch (error: any) {
          console.error(`Analysis failed for page ${page.url}:`, error.message);
          
          await page.update({ 
            analysisStatus: 'failed',
            issues: [error.message]
          });

          results.push({
            pageId: page.id,
            status: 'failed',
            error: error.message
          });
        }
      }

      const completedCount = results.filter(r => r.status === 'completed').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      console.log(`✅ Batch analysis completed: ${completedCount} successful, ${failedCount} failed`);

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: pages.length,
            completed: completedCount,
            failed: failedCount
          }
        }
      });
    } catch (error: any) {
      console.error('Error in batch analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Batch analysis failed',
        error: error.message
      });
    }
  });
}