import { Router } from 'express';
import {
  getExperiments,
  createExperiment,
  getExperimentById,
  updateExperiment,
  startExperiment,
  stopExperiment,
  getExperimentResults,
  getVariants,
  createVariant,
  getStatisticalAnalysis,
  getUserSegments,
  createUserSegment,
  getStrategyTemplates,
  createStrategyTemplate,
  getExperimentAnalytics
} from '../controllers/abTesting.controller';

const router = Router();

// A/B Testing Experiments Routes
router.get('/experiments', getExperiments);
router.post('/experiments', createExperiment);
router.get('/experiments/analytics', getExperimentAnalytics);
router.get('/experiments/:experimentId', getExperimentById);
router.put('/experiments/:experimentId', updateExperiment);
router.post('/experiments/:experimentId/start', startExperiment);
router.post('/experiments/:experimentId/stop', stopExperiment);
router.get('/experiments/:experimentId/results', getExperimentResults);
router.get('/experiments/:experimentId/analysis', getStatisticalAnalysis);
router.get('/experiments/:experimentId/variants', getVariants);
router.post('/variants', createVariant);

// User Segments Routes
router.get('/segments', getUserSegments);
router.post('/segments', createUserSegment);

// Strategy Templates Routes
router.get('/templates', getStrategyTemplates);
router.post('/templates', createStrategyTemplate);

export default router;