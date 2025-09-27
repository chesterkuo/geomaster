import { Job } from 'bull';
import {
  AITrackingJobData,
  TrackingJobResult,
  TrackingResult,
  QueryParams
} from '../services/platforms/aiPlatformInterface';
import { platformFactory } from '../services/platforms/platformFactory';
import AITrackingResult from '../models/AITrackingResult';
import Website from '../models/Website';
import Competitor from '../models/Competitor';
import { QueryGenerator } from '../services/aiTracking/queryGenerator';
import { ResultAnalyzer } from '../services/aiTracking/resultAnalyzer';
import { apiKeyManager } from '../services/apiKeyManagerService';

export class AITrackingJobProcessor {
  private queryGenerator: QueryGenerator;
  private resultAnalyzer: ResultAnalyzer;

  constructor() {
    this.queryGenerator = new QueryGenerator();
    this.resultAnalyzer = new ResultAnalyzer();
  }

  async processAITrackingJob(job: Job<AITrackingJobData>): Promise<TrackingJobResult> {
    const { websiteId, organizationId, platforms, keywords, competitors, trackingSettings } = job.data;
    const startTime = Date.now();

    console.log(`🔍 Starting AI tracking job for website ${websiteId}, platforms: ${platforms.join(', ')}`);

    try {
      // Update job progress
      await job.progress(10);

      // Fetch website and competitor data
      const website = await Website.findByPk(websiteId);
      if (!website) {
        throw new Error(`Website with ID ${websiteId} not found`);
      }

      const competitorData = await Competitor.findAll({
        where: { organizationId } as any
      });

      await job.progress(20);

      // Generate queries based on keywords and competitors
      const queries = this.queryGenerator.generateQueries({
        website: website.url,
        websiteName: website.name || website.url,
        keywords,
        competitors: competitorData.map(c => c.domain),
        trackingSettings
      });

      console.log(`📝 Generated ${queries.length} queries for tracking`);
      await job.progress(30);

      // Process each platform
      const allResults: TrackingResult[] = [];
      const errors: Array<{ query: string; error: string; code: string }> = [];
      
      let completedQueries = 0;
      const totalQueries = platforms.length * queries.length;

      for (const platformName of platforms) {
        try {
          console.log(`🤖 Processing platform: ${platformName}`);
          
          // Create platform instance using organization's API key configuration
          let platform;
          let apiKeyInfo: any = null;

          try {
            // Get API key configuration for this platform
            apiKeyInfo = await apiKeyManager.getApiKeyForPlatform(platformName, organizationId);

            if (!apiKeyInfo) {
              throw new Error(`No API key available for platform ${platformName}`);
            }

            platform = await platformFactory.createPlatformWithApiKeys(platformName, organizationId);

            console.log(`🔑 Using ${apiKeyInfo.source} API key for ${platformName} (User provided: ${apiKeyInfo.isUserProvided})`);

          } catch (error: any) {
            // Try fallback for any platform (prioritizing .env keys for free usage)
            console.warn(`⚠️ Primary API key failed for ${platformName}, attempting fallback: ${error.message}`);
            try {
              platform = await platformFactory.createPlatformWithFallback(platformName);
              console.log(`🔑 Fallback: Using .env API key for ${platformName} (organization ${organizationId})`);
            } catch (fallbackError: any) {
              console.error(`❌ Fallback also failed for ${platformName}: ${fallbackError.message}`);
              queries.forEach(query => {
                errors.push({
                  query: query.query,
                  error: `Platform ${platformName} not available (primary failed: ${error.message}, fallback failed: ${fallbackError.message})`,
                  code: 'PLATFORM_NOT_AVAILABLE'
                });
              });
              completedQueries += queries.length;
              continue;
            }
          }

          // Validate platform is available
          const isAvailable = await platform.isAvailable();
          if (!isAvailable) {
            console.warn(`⚠️ Platform ${platformName} is not available, skipping`);
            continue;
          }

          // Process queries for this platform
          for (const query of queries) {
            try {
              const queryParams: QueryParams = {
                query: query.query,
                website: website.url,
                keywords,
                competitors: competitorData.map(c => c.domain),
                context: query.context,
                maxResults: 10
              };

              const result = await platform.query(queryParams);
              allResults.push(result);

              // Save individual result to database
              await this.saveTrackingResult(result, websiteId, organizationId, query);

              completedQueries++;
              const progress = 30 + Math.floor((completedQueries / totalQueries) * 60);
              await job.progress(Math.min(progress, 90));

              console.log(`✅ Completed query "${query.query}" for ${platformName}`);

              // Rate limiting delay
              await this.delay(1000);

            } catch (queryError: any) {
              console.error(`❌ Query failed for ${platformName}:`, queryError.message);
              errors.push({
                query: query.query,
                error: queryError.message,
                code: queryError.code || 'UNKNOWN_ERROR'
              });
              completedQueries++;
            }
          }

        } catch (platformError: any) {
          console.error(`❌ Platform ${platformName} failed:`, platformError.message);
          
          // Mark all queries for this platform as failed
          queries.forEach(query => {
            errors.push({
              query: query.query,
              error: `Platform ${platformName} failed: ${platformError.message}`,
              code: platformError.code || 'PLATFORM_ERROR'
            });
          });
          
          completedQueries += queries.length;
        }
      }

      await job.progress(95);

      // Analyze results and generate summary
      const summary = this.resultAnalyzer.generateSummary(allResults, errors);

      await job.progress(100);

      const result: TrackingJobResult = {
        websiteId,
        organizationId,
        platform: platforms.join(',') as any,
        results: allResults,
        summary: {
          totalQueries: totalQueries,
          successfulQueries: allResults.length,
          failedQueries: errors.length,
          totalMentions: allResults.reduce((sum, r) => sum + r.mentions.length, 0),
          averageVisibilityScore: summary.averageVisibilityScore,
          overallSentiment: summary.overallSentiment
        },
        errors,
        executionTime: Date.now() - startTime,
        completedAt: new Date()
      };

      console.log(`✅ AI tracking job completed for website ${websiteId}. Results: ${allResults.length} successful, ${errors.length} failed`);

      return result;

    } catch (error: any) {
      console.error(`❌ AI tracking job failed for website ${websiteId}:`, error);
      
      const result: TrackingJobResult = {
        websiteId,
        organizationId,
        platform: platforms.join(',') as any,
        results: [],
        summary: {
          totalQueries: 0,
          successfulQueries: 0,
          failedQueries: 1,
          totalMentions: 0,
          averageVisibilityScore: 0,
          overallSentiment: 'neutral'
        },
        errors: [{
          query: 'Job execution',
          error: error.message,
          code: error.code || 'JOB_ERROR'
        }],
        executionTime: Date.now() - startTime,
        completedAt: new Date()
      };

      return result;
    }
  }

  private async saveTrackingResult(
    result: TrackingResult, 
    websiteId: string, 
    organizationId: string,
    query: any
  ): Promise<void> {
    try {
      await AITrackingResult.create({
        websiteId,
        platform: result.platform as any,
        query: result.query,
        isMentioned: result.mentions.length > 0,
        isCited: result.mentions.some(m => m.citationQuality === 'high'),
        citationPosition: result.mentions.length > 0 && result.mentions[0].position ? result.mentions[0].position : undefined,
        snippet: result.mentions.length > 0 ? result.mentions[0].content : undefined,
        fullResponse: result.response,
        competitorMentions: {
          count: result.competitors.length,
          details: result.competitors,
          mentions: result.mentions,
          metadata: {
            queryCategory: query.category,
            queryTemplate: query.template,
            organizationId, // Store in metadata since not in main model
            executionTime: result.metadata.executionTime,
            apiCost: result.metadata.apiCost || 0,
            tokensUsed: result.metadata.tokensUsed || 0,
            visibilityScore: this.calculateOverallVisibilityScore(result.mentions)
          }
        },
        trackedAt: result.timestamp
      });
    } catch (error) {
      console.error('Error saving tracking result:', error);
      // Don't throw here, just log the error
    }
  }

  private calculateOverallVisibilityScore(mentions: any[]): number {
    if (mentions.length === 0) return 0;
    
    const totalScore = mentions.reduce((sum, mention) => {
      let score = 10; // Base score
      if (mention.sentiment === 'positive') score += 5;
      else if (mention.sentiment === 'negative') score -= 3;
      if (mention.citationQuality === 'high') score += 3;
      else if (mention.citationQuality === 'low') score -= 1;
      return sum + (score * mention.confidence);
    }, 0);
    
    return Math.min(Math.max(totalScore / mentions.length, 0), 100);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Job processor function for Bull queue
export async function processAITrackingJob(job: Job<AITrackingJobData>): Promise<TrackingJobResult> {
  const processor = new AITrackingJobProcessor();
  return processor.processAITrackingJob(job);
}

// Competitor analysis job processor
export async function processCompetitorAnalysisJob(job: Job): Promise<any> {
  console.log('🔍 Processing competitor analysis job:', job.id);
  
  // Placeholder implementation
  return {
    jobId: job.id,
    status: 'completed',
    results: 'Competitor analysis completed'
  };
}

// Report generation job processor  
export async function processReportGenerationJob(job: Job): Promise<any> {
  console.log('📊 Processing report generation job:', job.id);
  
  // Placeholder implementation
  return {
    jobId: job.id,
    status: 'completed',
    results: 'Report generated'
  };
}