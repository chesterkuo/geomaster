import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
      return;
    }

    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  uuid: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required(),
  url: Joi.string().uri().required(),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }
};

// Authentication validation schemas
export const authSchemas = {
  register: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    fullName: Joi.string().min(2).max(100).required(),
    company: Joi.string().max(100).optional()
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: commonSchemas.password
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password
  })
};

// Website validation schemas
export const websiteSchemas = {
  create: Joi.object({
    url: commonSchemas.url,
    name: Joi.string().min(2).max(255).required(),
    description: Joi.string().max(1000).optional(),
    scanFrequency: Joi.string().valid('daily', 'weekly', 'monthly').default('weekly')
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    description: Joi.string().max(1000).optional(),
    scanFrequency: Joi.string().valid('daily', 'weekly', 'monthly').optional(),
    isActive: Joi.boolean().optional()
  }),

  list: Joi.object({
    page: commonSchemas.pagination.page,
    limit: commonSchemas.pagination.limit,
    search: Joi.string().max(255).optional(),
    isActive: Joi.boolean().optional()
  })
};

// Scan validation schemas
export const scanSchemas = {
  create: Joi.object({
    websiteId: Joi.string().uuid().optional(),
    scanType: Joi.string().valid('quick', 'standard', 'comprehensive').default('standard'),
    url: Joi.string().uri().optional()
  }).or('websiteId', 'url')
};

// Content validation schemas
export const contentSchemas = {
  analyze: Joi.object({
    content: Joi.string().required(),
    targetKeywords: Joi.array().items(Joi.string().max(255)).optional()
  }),

  optimize: Joi.object({
    contentId: commonSchemas.uuid,
    applyOptimizations: Joi.array().items(Joi.string()).optional()
  })
};