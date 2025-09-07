import { Router } from 'express';
import {
  getSuggestions,
  generateSuggestions,
  getSuggestionById,
  updateSuggestionStatus,
  submitFeedback,
  getModels,
  trainModel,
  getSuggestionAnalytics,
  getContentPatterns
} from '../controllers/mlOptimization.controller';

const router = Router();

// ML Optimization Suggestions Routes
router.get('/suggestions', getSuggestions);
router.post('/suggestions/generate', generateSuggestions);
router.get('/suggestions/analytics', getSuggestionAnalytics);
router.get('/suggestions/:suggestionId', getSuggestionById);
router.put('/suggestions/:suggestionId/status', updateSuggestionStatus);
router.post('/suggestions/:suggestionId/feedback', submitFeedback);

// ML Models Routes
router.get('/models', getModels);
router.post('/models/train', trainModel);

// Content Performance Patterns Routes
router.get('/patterns/:websiteId', getContentPatterns);

export default router;