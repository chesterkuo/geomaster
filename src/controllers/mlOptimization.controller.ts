import { Request, Response } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization, AuthRequest } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { MLOptimizationService } from '../services/mlOptimization.service';
import { logger } from '../utils/logger';


// Request validation schemas
const getSuggestionsSchema = {
  query: Joi.object({
    websiteId: Joi.string().uuid().optional(),
    suggestionType: Joi.string().valid('content', 'technical', 'ai_visibility', 'keyword_strategy', 'competitor_gap').optional(),
    minConfidence: Joi.number().min(0).max(1).default(0.5),
    status: Joi.string().valid('new', 'reviewing', 'accepted', 'implemented', 'rejected').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

const generateSuggestionsSchema = {
  body: Joi.object({
    websiteId: Joi.string().uuid().required(),
    modelType: Joi.string().valid('content_optimization', 'competitor_analysis', 'keyword_prediction', 'trend_forecast').default('content_optimization'),
    analysisDepth: Joi.string().valid('basic', 'detailed', 'comprehensive').default('detailed'),
    focusAreas: Joi.array().items(Joi.string().valid('content', 'technical', 'ai_visibility', 'keyword_strategy', 'competitor_gap')).optional()
  })
};

const feedbackSchema = {
  params: Joi.object({
    suggestionId: Joi.string().uuid().required()
  }),
  body: Joi.object({
    feedbackType: Joi.string().valid('helpful', 'not_helpful', 'implemented', 'rejected').required(),
    rating: Joi.number().integer().min(1).max(5).optional(),
    comment: Joi.string().max(1000).optional(),
    implementationResult: Joi.object({
      successRate: Joi.number().min(0).max(1).optional(),
      impactMetrics: Joi.object().optional(),
      timeSpent: Joi.number().positive().optional()
    }).optional()
  })
};

const trainModelSchema = {
  body: Joi.object({
    modelType: Joi.string().valid('content_optimization', 'competitor_analysis', 'keyword_prediction', 'trend_forecast').required(),
    trainingConfig: Joi.object({
      dataSource: Joi.string().valid('organization', 'global', 'mixed').default('organization'),
      trainingPeriodDays: Joi.number().integer().min(30).max(365).default(90),
      algorithm: Joi.string().optional(),
      hyperparameters: Joi.object().optional()
    }).optional()
  })
};

export class MLOptimizationController {
  private mlOptimizationService: MLOptimizationService;

  constructor() {
    this.mlOptimizationService = new MLOptimizationService();
  }

  /**
   * Get ML-driven optimization suggestions
   */
  getSuggestions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { websiteId, suggestionType, minConfidence, status, page, limit } = req.query as any;
      const organizationId = req.organization!.id;

      const result = await this.mlOptimizationService.getSuggestions({
        organizationId,
        websiteId,
        suggestionType,
        minConfidence,
        status,
        page,
        limit
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting ML suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve optimization suggestions'
      });
    }
  });

  /**
   * Generate new ML optimization suggestions for a website
   */
  generateSuggestions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { websiteId, modelType, analysisDepth, focusAreas } = req.body;
      const organizationId = req.organization!.id;

      const suggestions = await this.mlOptimizationService.generateSuggestions({
        organizationId,
        websiteId,
        modelType,
        analysisDepth,
        focusAreas
      });

      res.json({
        success: true,
        data: {
          generatedCount: suggestions.length,
          suggestions: suggestions.slice(0, 10), // Return first 10 for preview
          message: `Generated ${suggestions.length} new optimization suggestions`
        }
      });
    } catch (error) {
      logger.error('Error generating ML suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate optimization suggestions'
      });
    }
  });

  /**
   * Get detailed suggestion by ID
   */
  getSuggestionById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { suggestionId } = req.params;
      const organizationId = req.organization!.id;

      const suggestion = await this.mlOptimizationService.getSuggestionById(
        suggestionId,
        organizationId
      );

      if (!suggestion) {
        res.status(404).json({
          success: false,
          error: 'Optimization suggestion not found'
        });
        return;
      }

      res.json({
        success: true,
        data: suggestion
      });
    } catch (error) {
      logger.error('Error getting suggestion by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve suggestion details'
      });
    }
  });

  /**
   * Update suggestion status
   */
  updateSuggestionStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { suggestionId } = req.params;
      const { status, feedback } = req.body;
      const organizationId = req.organization!.id;

      const updated = await this.mlOptimizationService.updateSuggestionStatus({
        suggestionId,
        organizationId,
        status,
        feedback
      });

      res.json({
        success: true,
        data: updated,
        message: `Suggestion status updated to ${status}`
      });
    } catch (error) {
      logger.error('Error updating suggestion status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update suggestion status'
      });
    }
  });

  /**
   * Submit feedback for ML suggestion
   */
  submitFeedback = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { suggestionId } = req.params;
      const { feedbackType, rating, comment, implementationResult } = req.body;
      const userId = req.user!.id;

      const feedback = await this.mlOptimizationService.submitFeedback({
        suggestionId,
        userId,
        feedbackType,
        rating,
        comment,
        implementationResult
      });

      res.json({
        success: true,
        data: feedback,
        message: 'Feedback submitted successfully'
      });
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit feedback'
      });
    }
  });

  /**
   * Get ML models information
   */
  getModels = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { modelType, isActive } = req.query;

      const models = await this.mlOptimizationService.getModels({
        modelType: modelType as string,
        isActive: isActive === 'true'
      });

      res.json({
        success: true,
        data: models
      });
    } catch (error) {
      logger.error('Error getting ML models:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve ML models'
      });
    }
  });

  /**
   * Trigger model training
   */
  trainModel = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { modelType, trainingConfig } = req.body;
      const organizationId = req.organization!.id;

      const trainingJob = await this.mlOptimizationService.startModelTraining({
        modelType,
        organizationId,
        trainingConfig
      });

      res.json({
        success: true,
        data: trainingJob,
        message: 'Model training started successfully'
      });
    } catch (error) {
      logger.error('Error starting model training:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start model training'
      });
    }
  });

  /**
   * Get suggestion analytics and performance metrics
   */
  getSuggestionAnalytics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organization!.id;
      const { timeframe = '30d', websiteId } = req.query;

      const analytics = await this.mlOptimizationService.getSuggestionAnalytics({
        organizationId,
        timeframe: timeframe as string,
        websiteId: websiteId as string
      });

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error getting suggestion analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve suggestion analytics'
      });
    }
  });

  /**
   * Get content performance patterns
   */
  getContentPatterns = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { websiteId } = req.params;
      const organizationId = req.organization!.id;
      const { patternType, timePeriodDays = 30 } = req.query;

      const patterns = await this.mlOptimizationService.getContentPerformancePatterns({
        websiteId,
        organizationId,
        patternType: patternType as string,
        timePeriodDays: Number(timePeriodDays)
      });

      res.json({
        success: true,
        data: patterns
      });
    } catch (error) {
      logger.error('Error getting content patterns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve content performance patterns'
      });
    }
  });
}

// Route handlers with validation
export const mlOptimizationController = new MLOptimizationController();

export const getSuggestions = [
  authenticateToken,
  requireOrganization,
  validateRequest(getSuggestionsSchema),
  mlOptimizationController.getSuggestions
];

export const generateSuggestions = [
  authenticateToken,
  requireOrganization,
  validateRequest(generateSuggestionsSchema),
  mlOptimizationController.generateSuggestions
];

export const getSuggestionById = [
  authenticateToken,
  requireOrganization,
  mlOptimizationController.getSuggestionById
];

export const updateSuggestionStatus = [
  authenticateToken,
  requireOrganization,
  mlOptimizationController.updateSuggestionStatus
];

export const submitFeedback = [
  authenticateToken,
  requireOrganization,
  validateRequest(feedbackSchema),
  mlOptimizationController.submitFeedback
];

export const getModels = [
  authenticateToken,
  requireOrganization,
  mlOptimizationController.getModels
];

export const trainModel = [
  authenticateToken,
  requireOrganization,
  validateRequest(trainModelSchema),
  mlOptimizationController.trainModel
];

export const getSuggestionAnalytics = [
  authenticateToken,
  requireOrganization,
  mlOptimizationController.getSuggestionAnalytics
];

export const getContentPatterns = [
  authenticateToken,
  requireOrganization,
  mlOptimizationController.getContentPatterns
];