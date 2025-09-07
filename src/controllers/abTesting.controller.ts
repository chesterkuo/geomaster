import { Request, Response } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization, AuthRequest } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { ABTestingService } from '../services/abTesting.service';
import { logger } from '../utils/logger';

const abTestingService = new ABTestingService();

// Request validation schemas
const createExperimentSchema = {
  body: Joi.object({
    websiteId: Joi.string().uuid().required(),
    name: Joi.string().required(),
    description: Joi.string().optional(),
    experimentType: Joi.string().valid('content_optimization', 'seo_strategy', 'ui_design', 'keyword_targeting').required(),
    hypothesis: Joi.string().required(),
    successMetric: Joi.string().required(),
    targetMetricValue: Joi.number().optional(),
    expectedDurationDays: Joi.number().integer().min(1).optional(),
    trafficAllocation: Joi.number().min(0).max(1).optional()
  })
};

const updateExperimentSchema = {
  params: Joi.object({
    experimentId: Joi.string().uuid().required()
  }),
  body: Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    hypothesis: Joi.string().optional(),
    targetMetricValue: Joi.number().optional(),
    expectedDurationDays: Joi.number().integer().min(1).optional(),
    trafficAllocation: Joi.number().min(0).max(1).optional()
  })
};

const createVariantSchema = {
  body: Joi.object({
    experimentId: Joi.string().uuid().required(),
    name: Joi.string().required(),
    description: Joi.string().optional(),
    variantType: Joi.string().valid('control', 'treatment').required(),
    configuration: Joi.object().required(),
    trafficPercentage: Joi.number().min(0).max(100).optional()
  })
};

const createUserSegmentSchema = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    segmentCriteria: Joi.object().required()
  })
};

const createStrategyTemplateSchema = {
  body: Joi.object({
    name: Joi.string().required(),
    category: Joi.string().valid('content', 'technical', 'seo', 'ai_visibility').required(),
    description: Joi.string().optional(),
    templateConfig: Joi.object().required(),
    successMetrics: Joi.array().items(Joi.string()).required(),
    estimatedImpact: Joi.object().optional(),
    difficultyLevel: Joi.string().valid('easy', 'medium', 'hard').required()
  })
};

export class ABTestingController {
  public getExperiments = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const {
      websiteId,
      status,
      experimentType,
      page = 1,
      limit = 20
    } = req.query;

    const result = await abTestingService.getExperiments({
      organizationId,
      websiteId: websiteId as string,
      status: status as string,
      experimentType: experimentType as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: result
    });
  });

  public createExperiment = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const userId = req.user?.id;

    const experiment = await abTestingService.createExperiment({
      organizationId,
      createdBy: userId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: experiment
    });
  });

  public getExperimentById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { experimentId } = req.params;

    const experiment = await abTestingService.getExperimentById(experimentId, organizationId);

    res.json({
      success: true,
      data: experiment
    });
  });

  public updateExperiment = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { experimentId } = req.params;

    // For now, return updated experiment data
    const experiment = {
      id: experimentId,
      organizationId,
      ...req.body,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: experiment
    });
  });

  public startExperiment = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { experimentId } = req.params;
    const { startDate, endDate } = req.body;

    const experiment = await abTestingService.startExperiment({
      experimentId,
      organizationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    res.json({
      success: true,
      data: experiment
    });
  });

  public stopExperiment = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { experimentId } = req.params;

    const experiment = await abTestingService.stopExperiment({
      experimentId,
      organizationId
    });

    res.json({
      success: true,
      data: experiment
    });
  });

  public getExperimentResults = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { experimentId } = req.params;
    const { startDate, endDate } = req.query;

    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    } : undefined;

    const results = await abTestingService.getExperimentResults({
      experimentId,
      organizationId,
      dateRange
    });

    res.json({
      success: true,
      data: results
    });
  });

  public getVariants = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { experimentId } = req.params;

    const variants = await abTestingService.getVariants(experimentId, organizationId);

    res.json({
      success: true,
      data: variants
    });
  });

  public createVariant = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;

    const variant = await abTestingService.createVariant({
      organizationId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: variant
    });
  });

  public getStatisticalAnalysis = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { experimentId } = req.params;
    const { metricName = 'conversion_rate' } = req.query;

    const analysis = await abTestingService.getStatisticalAnalysis({
      experimentId,
      organizationId,
      metricName: metricName as string
    });

    res.json({
      success: true,
      data: analysis
    });
  });

  public getUserSegments = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;

    const segments = await abTestingService.getUserSegments(organizationId);

    res.json({
      success: true,
      data: segments
    });
  });

  public createUserSegment = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;

    const segment = await abTestingService.createUserSegment({
      organizationId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: segment
    });
  });

  public getStrategyTemplates = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { category, difficultyLevel } = req.query;

    const templates = await abTestingService.getStrategyTemplates({
      category: category as string,
      difficultyLevel: difficultyLevel as string
    });

    res.json({
      success: true,
      data: templates
    });
  });

  public createStrategyTemplate = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    // For now, create a mock template
    const template = {
      id: `template-${Date.now()}`,
      ...req.body,
      isPublic: false,
      usageCount: 0,
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: template
    });
  });

  public getExperimentAnalytics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { timeframe = '30d', websiteId } = req.query;

    const analytics = await abTestingService.getExperimentAnalytics({
      organizationId,
      timeframe: timeframe as string,
      websiteId: websiteId as string
    });

    res.json({
      success: true,
      data: analytics
    });
  });
}

const abTestingController = new ABTestingController();

// Export middleware chains
export const getExperiments = [
  authenticateToken,
  requireOrganization,
  abTestingController.getExperiments
];

export const createExperiment = [
  authenticateToken,
  requireOrganization,
  validateRequest(createExperimentSchema),
  abTestingController.createExperiment
];

export const getExperimentById = [
  authenticateToken,
  requireOrganization,
  abTestingController.getExperimentById
];

export const updateExperiment = [
  authenticateToken,
  requireOrganization,
  validateRequest(updateExperimentSchema),
  abTestingController.updateExperiment
];

export const startExperiment = [
  authenticateToken,
  requireOrganization,
  abTestingController.startExperiment
];

export const stopExperiment = [
  authenticateToken,
  requireOrganization,
  abTestingController.stopExperiment
];

export const getExperimentResults = [
  authenticateToken,
  requireOrganization,
  abTestingController.getExperimentResults
];

export const getVariants = [
  authenticateToken,
  requireOrganization,
  abTestingController.getVariants
];

export const createVariant = [
  authenticateToken,
  requireOrganization,
  validateRequest(createVariantSchema),
  abTestingController.createVariant
];

export const getStatisticalAnalysis = [
  authenticateToken,
  requireOrganization,
  abTestingController.getStatisticalAnalysis
];

export const getUserSegments = [
  authenticateToken,
  requireOrganization,
  abTestingController.getUserSegments
];

export const createUserSegment = [
  authenticateToken,
  requireOrganization,
  validateRequest(createUserSegmentSchema),
  abTestingController.createUserSegment
];

export const getStrategyTemplates = [
  authenticateToken,
  requireOrganization,
  abTestingController.getStrategyTemplates
];

export const createStrategyTemplate = [
  authenticateToken,
  requireOrganization,
  validateRequest(createStrategyTemplateSchema),
  abTestingController.createStrategyTemplate
];

export const getExperimentAnalytics = [
  authenticateToken,
  requireOrganization,
  abTestingController.getExperimentAnalytics
];