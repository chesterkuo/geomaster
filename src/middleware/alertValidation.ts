import { body, param, query } from 'express-validator';
import { ALERT_TYPES, NOTIFICATION_CHANNELS } from '../models/AlertConfiguration';

// Alert condition validation
const alertConditionSchema = {
  metric: {
    in: ['body'],
    isIn: {
      options: [['mention_count', 'sentiment_score', 'visibility_percentage', 'geo_score']],
      errorMessage: 'Invalid metric type'
    }
  },
  operator: {
    in: ['body'],
    isIn: {
      options: [['greater_than', 'less_than', 'equals', 'percentage_change']],
      errorMessage: 'Invalid operator'
    }
  },
  value: {
    in: ['body'],
    isNumeric: {
      errorMessage: 'Value must be a number'
    },
    toFloat: true
  },
  timeframe: {
    in: ['body'],
    isIn: {
      options: [['1h', '1d', '7d', '30d']],
      errorMessage: 'Invalid timeframe'
    }
  }
};

/**
 * Validation for creating alert configuration
 */
export const validateCreateAlert = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('alertType')
    .isIn(Object.values(ALERT_TYPES))
    .withMessage('Invalid alert type'),

  body('websiteId')
    .optional()
    .isUUID()
    .withMessage('Website ID must be a valid UUID'),

  body('conditions')
    .isArray({ min: 1 })
    .withMessage('At least one condition is required')
    .custom((conditions) => {
      // Validate each condition object
      for (const condition of conditions) {
        if (!condition.metric || !condition.operator || condition.value === undefined || !condition.timeframe) {
          throw new Error('Each condition must have metric, operator, value, and timeframe');
        }

        if (!['mention_count', 'sentiment_score', 'visibility_percentage', 'geo_score'].includes(condition.metric)) {
          throw new Error('Invalid metric type in conditions');
        }

        if (!['greater_than', 'less_than', 'equals', 'percentage_change'].includes(condition.operator)) {
          throw new Error('Invalid operator in conditions');
        }

        if (typeof condition.value !== 'number') {
          throw new Error('Condition value must be a number');
        }

        if (!['1h', '1d', '7d', '30d'].includes(condition.timeframe)) {
          throw new Error('Invalid timeframe in conditions');
        }
      }
      return true;
    }),

  body('notificationChannels')
    .optional()
    .isArray()
    .withMessage('Notification channels must be an array')
    .custom((channels) => {
      const validChannels = Object.values(NOTIFICATION_CHANNELS);
      for (const channel of channels) {
        if (!validChannels.includes(channel)) {
          throw new Error(`Invalid notification channel: ${channel}`);
        }
      }
      return true;
    }),

  body('cooldownMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Cooldown must be between 1 and 1440 minutes')
    .toInt()
];

/**
 * Validation for updating alert configuration
 */
export const validateUpdateAlert = [
  param('id')
    .isUUID()
    .withMessage('Alert ID must be a valid UUID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('conditions')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one condition is required')
    .custom((conditions) => {
      if (!conditions) return true; // Optional field
      
      for (const condition of conditions) {
        if (!condition.metric || !condition.operator || condition.value === undefined || !condition.timeframe) {
          throw new Error('Each condition must have metric, operator, value, and timeframe');
        }

        if (!['mention_count', 'sentiment_score', 'visibility_percentage', 'geo_score'].includes(condition.metric)) {
          throw new Error('Invalid metric type in conditions');
        }

        if (!['greater_than', 'less_than', 'equals', 'percentage_change'].includes(condition.operator)) {
          throw new Error('Invalid operator in conditions');
        }

        if (typeof condition.value !== 'number') {
          throw new Error('Condition value must be a number');
        }

        if (!['1h', '1d', '7d', '30d'].includes(condition.timeframe)) {
          throw new Error('Invalid timeframe in conditions');
        }
      }
      return true;
    }),

  body('notificationChannels')
    .optional()
    .isArray()
    .withMessage('Notification channels must be an array')
    .custom((channels) => {
      if (!channels) return true; // Optional field
      
      const validChannels = Object.values(NOTIFICATION_CHANNELS);
      for (const channel of channels) {
        if (!validChannels.includes(channel)) {
          throw new Error(`Invalid notification channel: ${channel}`);
        }
      }
      return true;
    }),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean(),

  body('cooldownMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Cooldown must be between 1 and 1440 minutes')
    .toInt()
];

/**
 * Validation for alert ID parameter
 */
export const validateAlertId = [
  param('id')
    .isUUID()
    .withMessage('Alert ID must be a valid UUID')
];

/**
 * Validation for getting alerts with query parameters
 */
export const validateGetAlerts = [
  query('websiteId')
    .optional()
    .isUUID()
    .withMessage('Website ID must be a valid UUID'),

  query('alertType')
    .optional()
    .isIn(Object.values(ALERT_TYPES))
    .withMessage('Invalid alert type'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean(),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

/**
 * Validation for alert history query parameters
 */
export const validateGetAlertHistory = [
  query('alertConfigId')
    .optional()
    .isUUID()
    .withMessage('Alert config ID must be a valid UUID'),

  query('websiteId')
    .optional()
    .isUUID()
    .withMessage('Website ID must be a valid UUID'),

  query('alertType')
    .optional()
    .isIn(Object.values(ALERT_TYPES))
    .withMessage('Invalid alert type'),

  query('notificationStatus')
    .optional()
    .isIn(['pending', 'sent', 'failed'])
    .withMessage('Invalid notification status'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

/**
 * Validation for manual trigger requests
 */
export const validateManualTrigger = [
  body('websiteId')
    .optional()
    .isUUID()
    .withMessage('Website ID must be a valid UUID'),

  body('alertType')
    .optional()
    .isIn(Object.values(ALERT_TYPES))
    .withMessage('Invalid alert type'),

  body('platform')
    .optional()
    .isIn(['chatgpt', 'gemini', 'perplexity', 'claude', 'all'])
    .withMessage('Invalid platform')
];

/**
 * Validation for metrics snapshots query
 */
export const validateGetMetricsSnapshots = [
  query('websiteId')
    .isUUID()
    .withMessage('Website ID must be a valid UUID'),

  query('metricType')
    .isIn(['mention_count', 'sentiment_score', 'visibility_percentage', 'geo_score', 'competitor_rank'])
    .withMessage('Invalid metric type'),

  query('platform')
    .optional()
    .isIn(['chatgpt', 'gemini', 'perplexity', 'claude', 'all'])
    .withMessage('Invalid platform'),

  query('timeWindow')
    .optional()
    .isIn(['1h', '1d', '7d', '30d'])
    .withMessage('Invalid time window'),

  query('days')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Days must be between 1 and 30')
    .toInt()
];