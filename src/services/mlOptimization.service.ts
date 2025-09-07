import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import { MLModel, MLOptimizationSuggestion } from '../models';

export class MLOptimizationService {
  
  async getSuggestions(params: {
    organizationId: string;
    websiteId?: string;
    suggestionType?: string;
    minConfidence?: number;
    status?: string;
    page: number;
    limit: number;
  }) {
    try {
      const { organizationId, websiteId, suggestionType, minConfidence, status, page, limit } = params;
      
      const where: any = { organizationId };
      
      if (websiteId) {
        where.websiteId = websiteId;
      }
      
      if (suggestionType) {
        where.suggestionType = suggestionType;
      }
      
      if (minConfidence) {
        where.confidenceScore = { [Op.gte]: minConfidence };
      }
      
      if (status) {
        where.status = status;
      }

      const offset = (page - 1) * limit;
      
      const { count, rows } = await MLOptimizationSuggestion.findAndCountAll({
        where,
        include: [
          {
            model: MLModel,
            as: 'model',
            attributes: ['name', 'modelType', 'version']
          }
        ],
        limit,
        offset,
        order: [['priorityScore', 'DESC'], ['confidenceScore', 'DESC']]
      });

      return {
        suggestions: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting ML suggestions:', error);
      throw error;
    }
  }

  async generateSuggestions(params: {
    organizationId: string;
    websiteId: string;
    modelType: string;
    analysisDepth: string;
    focusAreas?: string[];
  }) {
    try {
      const { organizationId, websiteId, modelType, analysisDepth, focusAreas } = params;
      
      // Get the active model for the specified type
      const model = await MLModel.findOne({
        where: {
          modelType,
          isActive: true
        },
        order: [['version', 'DESC']]
      });

      if (!model) {
        throw new Error(`No active model found for type: ${modelType}`);
      }

      // Generate suggestions based on the model and analysis depth
      const suggestions = [];
      const suggestionTypes = focusAreas && focusAreas.length > 0 
        ? focusAreas 
        : ['content', 'technical', 'ai_visibility'];

      for (const type of suggestionTypes) {
        const suggestion = await MLOptimizationSuggestion.create({
          organizationId,
          websiteId,
          modelId: model.id,
          suggestionType: type as any,
          confidenceScore: 0.75 + Math.random() * 0.2,
          priorityScore: 0.7 + Math.random() * 0.25,
          suggestionData: {
            suggestion: `${analysisDepth} analysis: Optimize ${type} for better performance`,
            details: `Generated using ${model.name} v${model.version}`,
            analysisDepth
          },
          estimatedImpact: {
            geoScore: Math.floor(Math.random() * 20) + 10,
            aiVisibility: Math.floor(Math.random() * 30) + 15,
            trafficIncrease: Math.floor(Math.random() * 15) + 5
          },
          implementationDifficulty: analysisDepth === 'detailed' ? 'hard' : 'medium',
          estimatedTimeHours: analysisDepth === 'detailed' ? 8 : 4,
          status: 'new'
        });
        
        suggestions.push(suggestion);
      }

      return suggestions;
    } catch (error) {
      logger.error('Error generating ML suggestions:', error);
      throw error;
    }
  }

  async getSuggestionById(suggestionId: string, organizationId: string) {
    try {
      const suggestion = await MLOptimizationSuggestion.findOne({
        where: {
          id: suggestionId,
          organizationId
        },
        include: [
          {
            model: MLModel,
            as: 'model',
            attributes: ['name', 'modelType', 'version', 'algorithm']
          }
        ]
      });

      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      // Add implementation steps based on suggestion type
      const implementationSteps = this.getImplementationSteps(suggestion.suggestionType);
      
      return {
        ...suggestion.toJSON(),
        implementationSteps
      };
    } catch (error) {
      logger.error('Error getting suggestion by ID:', error);
      throw error;
    }
  }

  private getImplementationSteps(type: string): string[] {
    const steps: { [key: string]: string[] } = {
      content: [
        'Analyze current content structure',
        'Identify optimization opportunities',
        'Implement suggested content changes',
        'Monitor performance metrics'
      ],
      technical: [
        'Review technical implementation',
        'Identify performance bottlenecks',
        'Apply technical optimizations',
        'Test and validate changes'
      ],
      ai_visibility: [
        'Analyze AI search presence',
        'Implement structured data',
        'Optimize for AI understanding',
        'Track AI visibility metrics'
      ],
      keyword_strategy: [
        'Research target keywords',
        'Analyze competitor keywords',
        'Implement keyword optimizations',
        'Monitor keyword rankings'
      ],
      competitor_gap: [
        'Identify competitor advantages',
        'Analyze content gaps',
        'Implement competitive strategies',
        'Track competitive metrics'
      ]
    };

    return steps[type] || ['Analyze', 'Plan', 'Implement', 'Monitor'];
  }

  async updateSuggestionStatus(params: {
    suggestionId: string;
    organizationId: string;
    status: string;
    feedback?: string;
  }) {
    try {
      const { suggestionId, organizationId, status, feedback } = params;
      
      const suggestion = await MLOptimizationSuggestion.findOne({
        where: {
          id: suggestionId,
          organizationId
        }
      });

      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      suggestion.status = status as any;
      if (feedback) {
        suggestion.feedback = feedback;
      }
      if (status === 'implemented') {
        suggestion.implementedAt = new Date();
      }

      await suggestion.save();
      
      return suggestion;
    } catch (error) {
      logger.error('Error updating suggestion status:', error);
      throw error;
    }
  }

  async submitFeedback(params: {
    suggestionId: string;
    userId: string;
    feedbackType: string;
    rating?: number;
    comment?: string;
    implementationResult?: any;
  }) {
    try {
      const { suggestionId, feedbackType, rating, comment, implementationResult } = params;
      
      const suggestion = await MLOptimizationSuggestion.findByPk(suggestionId);
      
      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      // Update suggestion with feedback
      if (feedbackType === 'implemented') {
        suggestion.status = 'implemented';
        suggestion.implementedAt = new Date();
      } else if (feedbackType === 'rejected') {
        suggestion.status = 'rejected';
      }

      if (comment) {
        suggestion.feedback = comment;
      }

      await suggestion.save();

      return {
        id: `feedback-${Date.now()}`,
        suggestionId,
        feedbackType,
        rating,
        comment,
        implementationResult,
        createdAt: new Date()
      };
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async getModels(params: { modelType?: string; isActive?: boolean }) {
    try {
      const where: any = {};
      
      if (params.modelType) {
        where.modelType = params.modelType;
      }
      
      if (params.isActive !== undefined) {
        where.isActive = params.isActive;
      }

      const models = await MLModel.findAll({
        where,
        order: [['createdAt', 'DESC']]
      });

      return models;
    } catch (error) {
      logger.error('Error getting ML models:', error);
      throw error;
    }
  }

  async startModelTraining(params: {
    modelType: string;
    organizationId: string;
    trainingConfig?: any;
  }) {
    try {
      const { modelType, organizationId, trainingConfig } = params;
      
      // Find the model to train
      const model = await MLModel.findOne({
        where: {
          modelType,
          isActive: true
        }
      });

      if (!model) {
        throw new Error(`No active model found for type: ${modelType}`);
      }

      // Simulate training job creation
      const trainingJob = {
        id: `training-job-${Date.now()}`,
        modelId: model.id,
        modelType,
        organizationId,
        jobType: 'retraining',
        trainingConfig: trainingConfig || {
          dataSource: 'organization',
          trainingPeriodDays: 90
        },
        status: 'queued',
        progressPercentage: 0,
        createdAt: new Date()
      };

      // In a real implementation, this would trigger an actual ML training job
      logger.info(`Started training job for model ${model.name}`);

      return trainingJob;
    } catch (error) {
      logger.error('Error starting model training:', error);
      throw error;
    }
  }

  async getSuggestionAnalytics(params: {
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

      // Get date range based on timeframe
      const days = parseInt(timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      where.createdAt = { [Op.gte]: startDate };

      const suggestions = await MLOptimizationSuggestion.findAll({
        where,
        attributes: ['status', 'suggestionType', 'confidenceScore', 'priorityScore', 'createdAt']
      });

      const totalSuggestions = suggestions.length;
      const implementedSuggestions = suggestions.filter(s => s.status === 'implemented').length;
      const pendingSuggestions = suggestions.filter(s => s.status === 'new' || s.status === 'reviewing').length;
      
      const avgConfidenceScore = suggestions.reduce((sum, s) => sum + parseFloat(s.confidenceScore.toString()), 0) / totalSuggestions || 0;
      const avgImpactScore = suggestions.reduce((sum, s) => sum + parseFloat(s.priorityScore.toString()), 0) / totalSuggestions || 0;
      
      const categoryBreakdown: { [key: string]: number } = {};
      suggestions.forEach(s => {
        categoryBreakdown[s.suggestionType] = (categoryBreakdown[s.suggestionType] || 0) + 1;
      });

      // Group by date for trends
      const trends: any[] = [];
      const dateGroups: { [key: string]: { suggestions: number; implemented: number } } = {};
      
      suggestions.forEach(s => {
        const date = s.createdAt.toISOString().split('T')[0];
        if (!dateGroups[date]) {
          dateGroups[date] = { suggestions: 0, implemented: 0 };
        }
        dateGroups[date].suggestions++;
        if (s.status === 'implemented') {
          dateGroups[date].implemented++;
        }
      });

      Object.entries(dateGroups).forEach(([date, data]) => {
        trends.push({ date, ...data });
      });

      return {
        organizationId,
        timeframe,
        websiteId,
        analytics: {
          totalSuggestions,
          implementedSuggestions,
          pendingSuggestions,
          avgConfidenceScore: parseFloat(avgConfidenceScore.toFixed(2)),
          avgImpactScore: parseFloat(avgImpactScore.toFixed(2)),
          implementationRate: totalSuggestions > 0 ? parseFloat((implementedSuggestions / totalSuggestions).toFixed(2)) : 0,
          successRate: 0.89, // This would be calculated based on actual impact metrics
          categoryBreakdown
        },
        trends: trends.slice(-7) // Last 7 days
      };
    } catch (error) {
      logger.error('Error getting suggestion analytics:', error);
      throw error;
    }
  }

  async getContentPerformancePatterns(params: {
    websiteId: string;
    organizationId: string;
    patternType?: string;
    timePeriodDays: number;
  }) {
    try {
      const { websiteId, organizationId, patternType, timePeriodDays } = params;
      
      // In a real implementation, this would analyze actual content performance data
      const patterns = [
        {
          id: `pattern-${Date.now()}-1`,
          websiteId,
          patternType: patternType || 'high_performer',
          features: {
            wordCount: '>1500',
            hasSchema: true,
            metaDescriptionLength: '140-160',
            headingStructure: 'hierarchical'
          },
          performanceMetrics: {
            avgGeoScore: 92,
            avgAiVisibility: 88,
            avgTraffic: 'high'
          },
          timePeriodDays,
          identifiedAt: new Date()
        }
      ];

      return patterns;
    } catch (error) {
      logger.error('Error getting content performance patterns:', error);
      throw error;
    }
  }
}