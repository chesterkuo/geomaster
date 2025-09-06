import { Router } from 'express';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import {
  getAnalyticsDashboard,
  getAnalyticsTrends,
  getPlatformPerformance,
  generateSnapshot,
  getPerformanceInsights,
  getCompetitorAnalysis,
  getCompetitorSummary,
  getCompetitorTrends,
  getCompetitorKeywords,
  bulkGenerateSnapshots
} from '../controllers/analytics.controller';

const router = Router();

// Apply authentication and organization middleware
router.use(authenticateToken);
router.use(requireOrganization);

// Analytics endpoints
router.get('/dashboard/:websiteId', getAnalyticsDashboard);
router.get('/trends/:websiteId', getAnalyticsTrends);
router.get('/platforms/:websiteId', getPlatformPerformance);
router.post('/snapshot/:websiteId', generateSnapshot);
router.get('/insights/:websiteId', getPerformanceInsights);

// Competitor analysis endpoints
router.post('/competitors/analyze/:websiteId', getCompetitorAnalysis);
router.get('/competitors/summary', getCompetitorSummary);
router.get('/competitors/:competitorId/trends', getCompetitorTrends);
router.get('/competitors/:competitorId/keywords', getCompetitorKeywords);

// Admin/system endpoints
router.post('/snapshots/bulk', bulkGenerateSnapshots);

export default router;