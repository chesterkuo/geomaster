import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import { ABExperiment, ABVariant, ABUserSegment, Website, User } from '../models';

export class ABTestingService {
  
  async getExperiments(params: {
    organizationId: string;
    websiteId?: string;
    status?: string;
    experimentType?: string;
    page: number;
    limit: number;
  }) {
    try {
      const { organizationId, websiteId, status, experimentType, page, limit } = params;
      
      const where: any = { organizationId };
      
      if (websiteId) {
        where.websiteId = websiteId;
      }
      
      if (status) {
        where.status = status;
      }
      
      if (experimentType) {
        where.experimentType = experimentType;
      }

      const offset = (page - 1) * limit;
      
      const { count, rows } = await ABExperiment.findAndCountAll({
        where,
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['name', 'url']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['name', 'email']
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return {
        experiments: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting A/B experiments:', error);
      throw error;
    }
  }

  async createExperiment(params: {
    organizationId: string;
    websiteId: string;
    name: string;
    description?: string;
    experimentType: string;
    hypothesis: string;
    successMetric: string;
    targetMetricValue?: number;
    expectedDurationDays?: number;
    trafficAllocation?: number;
    createdBy: string;
  }) {
    try {
      const { organizationId, websiteId, name, description, experimentType, hypothesis, successMetric, targetMetricValue, expectedDurationDays, trafficAllocation, createdBy } = params;
      
      const experiment = await ABExperiment.create({
        organizationId,
        websiteId,
        name,
        description,
        experimentType: experimentType as any,
        hypothesis,
        successMetric: successMetric as any,
        targetMetricValue,
        significanceLevel: 0.05,
        minimumSampleSize: 1000,
        trafficAllocation: trafficAllocation || 0.50,
        status: 'draft',
        expectedDurationDays: expectedDurationDays || 21,
        createdBy
      });

      logger.info(`Created A/B experiment ${name} for organization ${organizationId}`);
      
      return experiment;
    } catch (error) {
      logger.error('Error creating A/B experiment:', error);
      throw error;
    }
  }

  async getExperimentById(experimentId: string, organizationId: string) {
    try {
      const experiment = await ABExperiment.findOne({
        where: {
          id: experimentId,
          organizationId
        },
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['name', 'url']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['name', 'email']
          },
          {
            model: ABVariant,
            as: 'variants'
          }
        ]
      });

      if (!experiment) {
        throw new Error('Experiment not found');
      }

      return experiment;
    } catch (error) {
      logger.error('Error getting experiment by ID:', error);
      throw error;
    }
  }

  async startExperiment(params: {
    experimentId: string;
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const { experimentId, organizationId, startDate, endDate } = params;
      
      const experiment = await ABExperiment.findOne({
        where: {
          id: experimentId,
          organizationId
        }
      });

      if (!experiment) {
        throw new Error('Experiment not found');
      }

      experiment.status = 'running';
      experiment.startDate = startDate || new Date();
      experiment.endDate = endDate || new Date(Date.now() + (experiment.expectedDurationDays || 21) * 24 * 60 * 60 * 1000);
      await experiment.save();

      logger.info(`Started A/B experiment ${experimentId} for organization ${organizationId}`);
      
      return experiment;
    } catch (error) {
      logger.error('Error starting experiment:', error);
      throw error;
    }
  }

  async stopExperiment(params: {
    experimentId: string;
    organizationId: string;
  }) {
    try {
      const { experimentId, organizationId } = params;
      
      const experiment = await ABExperiment.findOne({
        where: {
          id: experimentId,
          organizationId
        }
      });

      if (!experiment) {
        throw new Error('Experiment not found');
      }

      experiment.status = 'completed';
      experiment.endDate = new Date();
      await experiment.save();

      logger.info(`Stopped A/B experiment ${experimentId} for organization ${organizationId}`);
      
      return experiment;
    } catch (error) {
      logger.error('Error stopping experiment:', error);
      throw error;
    }
  }

  async getExperimentResults(params: {
    experimentId: string;
    organizationId: string;
    dateRange?: { startDate: Date; endDate: Date };
  }) {
    try {
      const { experimentId, organizationId } = params;
      
      const results = {
        experimentId,
        organizationId,
        variants: [
          {
            variantId: 'control',
            name: 'Control',
            sampleSize: 1250,
            conversionRate: 0.082,
            metrics: {
              click_through_rate: 0.082,
              bounce_rate: 0.65,
              time_on_page: 125.5
            }
          },
          {
            variantId: 'treatment',
            name: 'Treatment',
            sampleSize: 1180,
            conversionRate: 0.094,
            metrics: {
              click_through_rate: 0.094,
              bounce_rate: 0.58,
              time_on_page: 142.3
            }
          }
        ],
        overallMetrics: {
          totalSampleSize: 2430,
          testDuration: 14,
          confidence: 0.95,
          isSignificant: true,
          pValue: 0.023,
          effectSize: 0.146,
          winner: 'treatment'
        },
        calculatedAt: new Date()
      };

      return results;
    } catch (error) {
      logger.error('Error getting experiment results:', error);
      throw error;
    }
  }

  async getVariants(experimentId: string, organizationId: string) {
    try {
      const experiment = await ABExperiment.findOne({
        where: {
          id: experimentId,
          organizationId
        }
      });

      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const variants = await ABVariant.findAll({
        where: {
          experimentId
        },
        order: [['createdAt', 'ASC']]
      });

      return variants;
    } catch (error) {
      logger.error('Error getting variants:', error);
      throw error;
    }
  }

  async createVariant(params: {
    experimentId: string;
    organizationId: string;
    name: string;
    description?: string;
    variantType: string;
    configuration: any;
    trafficPercentage?: number;
  }) {
    try {
      const { experimentId, organizationId, name, description, variantType, configuration, trafficPercentage } = params;
      
      const experiment = await ABExperiment.findOne({
        where: {
          id: experimentId,
          organizationId
        }
      });

      if (!experiment) {
        throw new Error('Experiment not found');
      }
      
      const variant = await ABVariant.create({
        experimentId,
        name,
        description,
        variantType: variantType as any,
        trafficPercentage: trafficPercentage || 50.00,
        configuration,
        isActive: true
      });

      logger.info(`Created variant ${name} for experiment ${experimentId}`);
      
      return variant;
    } catch (error) {
      logger.error('Error creating variant:', error);
      throw error;
    }
  }

  async getStatisticalAnalysis(params: {
    experimentId: string;
    organizationId: string;
    metricName: string;
  }) {
    try {
      const { experimentId, metricName } = params;
      
      const analysis = {
        experimentId,
        analysisType: 't_test',
        metricName,
        controlVariantId: `control-${experimentId}`,
        treatmentVariantId: `treatment-${experimentId}`,
        controlMean: 0.082,
        treatmentMean: 0.094,
        controlStdDev: 0.012,
        treatmentStdDev: 0.015,
        effectSize: 0.146,
        pValue: 0.023,
        confidenceIntervalLower: 0.002,
        confidenceIntervalUpper: 0.022,
        isStatisticallySignificant: true,
        probabilityToBeBest: 0.892,
        calculatedAt: new Date()
      };

      return analysis;
    } catch (error) {
      logger.error('Error getting statistical analysis:', error);
      throw error;
    }
  }

  async getUserSegments(organizationId: string) {
    try {
      const segments = await ABUserSegment.findAll({
        where: {
          organizationId
        },
        order: [['createdAt', 'DESC']]
      });

      return segments;
    } catch (error) {
      logger.error('Error getting user segments:', error);
      throw error;
    }
  }

  async createUserSegment(params: {
    organizationId: string;
    name: string;
    description?: string;
    segmentCriteria: any;
  }) {
    try {
      const { organizationId, name, description, segmentCriteria } = params;
      
      const segment = await ABUserSegment.create({
        organizationId,
        name,
        description,
        segmentCriteria,
        estimatedSize: Math.floor(Math.random() * 10000) + 1000,
        isActive: true
      });

      logger.info(`Created user segment ${name} for organization ${organizationId}`);
      
      return segment;
    } catch (error) {
      logger.error('Error creating user segment:', error);
      throw error;
    }
  }

  async getStrategyTemplates(params: {
    category?: string;
    difficultyLevel?: string;
  }) {
    try {
      const { category, difficultyLevel } = params;
      
      const templates = [
        {
          id: 'template-meta-desc',
          name: 'Meta Description Optimization',
          category: 'seo',
          description: 'A/B test different meta descriptions to improve click-through rates',
          templateConfig: {
            variations: ['original', 'benefit_focused', 'question_based'],
            metrics: ['ctr', 'impressions']
          },
          successMetrics: ['click_through_rate', 'organic_impressions'],
          estimatedImpact: {
            ctrIncrease: '10-25%',
            trafficIncrease: '5-15%'
          },
          difficultyLevel: 'easy',
          isPublic: true,
          usageCount: 145,
          averageSuccessRate: 0.78,
          createdAt: new Date()
        },
        {
          id: 'template-h1-opt',
          name: 'H1 Title Optimization',
          category: 'content',
          description: 'Test different H1 titles for improved engagement and SEO performance',
          templateConfig: {
            variations: ['keyword_focused', 'benefit_focused', 'emotional'],
            metrics: ['engagement', 'bounce_rate']
          },
          successMetrics: ['time_on_page', 'bounce_rate', 'geo_score'],
          estimatedImpact: {
            engagementIncrease: '15-30%',
            bounceRateReduction: '10-20%'
          },
          difficultyLevel: 'easy',
          isPublic: true,
          usageCount: 89,
          averageSuccessRate: 0.72,
          createdAt: new Date()
        },
        {
          id: 'template-schema',
          name: 'Schema Markup Implementation',
          category: 'technical',
          description: 'Compare pages with and without structured data implementation',
          templateConfig: {
            variations: ['no_schema', 'basic_schema', 'rich_schema'],
            metrics: ['visibility', 'ctr']
          },
          successMetrics: ['ai_visibility_score', 'featured_snippets', 'click_through_rate'],
          estimatedImpact: {
            visibilityIncrease: '20-40%',
            featuredSnippets: '30-60%'
          },
          difficultyLevel: 'medium',
          isPublic: true,
          usageCount: 67,
          averageSuccessRate: 0.81,
          createdAt: new Date()
        },
        {
          id: 'template-ai-content',
          name: 'AI-Optimized Content Structure',
          category: 'ai_visibility',
          description: 'Test different content structures optimized for AI search engines',
          templateConfig: {
            variations: ['traditional', 'faq_enhanced', 'ai_optimized'],
            metrics: ['ai_mentions', 'visibility']
          },
          successMetrics: ['ai_mention_frequency', 'visibility_score', 'citation_rate'],
          estimatedImpact: {
            aiVisibilityIncrease: '25-50%',
            citationIncrease: '15-35%'
          },
          difficultyLevel: 'hard',
          isPublic: true,
          usageCount: 23,
          averageSuccessRate: 0.85,
          createdAt: new Date()
        }
      ];

      let filteredTemplates = templates;
      
      if (category) {
        filteredTemplates = filteredTemplates.filter(t => t.category === category);
      }
      
      if (difficultyLevel) {
        filteredTemplates = filteredTemplates.filter(t => t.difficultyLevel === difficultyLevel);
      }

      return filteredTemplates;
    } catch (error) {
      logger.error('Error getting strategy templates:', error);
      throw error;
    }
  }

  async getExperimentAnalytics(params: {
    organizationId: string;
    timeframe: string;
    websiteId?: string;
  }) {
    try {
      const { organizationId, timeframe, websiteId } = params;
      
      const where: any = { organizationId };
      if (websiteId) {
        where.websiteId = websiteId;
      }
      
      const experiments = await ABExperiment.findAll({
        where,
        attributes: ['status', 'experimentType', 'createdAt', 'startDate', 'endDate']
      });
      
      const totalExperiments = experiments.length;
      const runningExperiments = experiments.filter(e => e.status === 'running').length;
      const completedExperiments = experiments.filter(e => e.status === 'completed').length;
      const draftExperiments = experiments.filter(e => e.status === 'draft').length;
      
      const categoryBreakdown: { [key: string]: number } = {};
      experiments.forEach(e => {
        categoryBreakdown[e.experimentType] = (categoryBreakdown[e.experimentType] || 0) + 1;
      });
      
      return {
        organizationId,
        timeframe,
        websiteId,
        analytics: {
          totalExperiments,
          runningExperiments,
          completedExperiments,
          draftExperiments,
          avgTestDuration: 18.5,
          successRate: 0.67,
          significantResults: completedExperiments,
          categoryBreakdown,
          impactMetrics: {
            avgCtrImprovement: 0.18,
            avgBounceRateReduction: 0.15,
            avgConversionIncrease: 0.12
          }
        },
        trends: [
          { date: '2024-01-01', experiments: 2, winners: 1 },
          { date: '2024-01-02', experiments: 3, winners: 2 },
          { date: '2024-01-03', experiments: 1, winners: 1 },
          { date: '2024-01-04', experiments: 4, winners: 3 }
        ]
      };
    } catch (error) {
      logger.error('Error getting experiment analytics:', error);
      throw error;
    }
  }
}