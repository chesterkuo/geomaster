import { Router } from 'express';
import authRoutes from './auth.routes';
import websiteRoutes from './website.routes';
import scanRoutes from './scan.routes';
import contentRoutes from './content.routes';
import trackingRoutes from './tracking.routes';
import trackingConfigRoutes from './trackingConfig.routes';
import competitionRoutes from './competition.routes';
import keywordRoutes from './keyword.routes';
import dashboardRoutes from './dashboard.routes';
import teamRoutes from './team.routes';
import settingsRoutes from './settings.routes';
import alertRoutes from './alert.routes';
import alertsRoutes from './alerts.routes';
import analyticsRoutes from './analytics.routes';
import reportsRoutes from './reports.routes';
import mlOptimizationRoutes from './mlOptimization.routes';
import integrationsRoutes from './integrations.routes';
import abTestingRoutes from './abTesting.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/websites', websiteRoutes);
router.use('/scans', scanRoutes);
router.use('/content', contentRoutes);
router.use('/tracking', trackingRoutes);
router.use('/tracking', trackingConfigRoutes);
router.use('/tracking', competitionRoutes);
router.use('/keywords', keywordRoutes);
router.use('/tracking/keywords', keywordRoutes);
router.use('/tracking/keyword-types', keywordRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/team', teamRoutes);
router.use('/settings', settingsRoutes);
router.use('/alerts', alertRoutes);
router.use('/alerts', alertsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportsRoutes);

// Phase 3 Routes - Advanced Features
router.use('/ml-optimization', mlOptimizationRoutes);
router.use('/integrations', integrationsRoutes);
router.use('/ab-testing', abTestingRoutes);

// API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'GEO Platform API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to GEO Platform API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      auth: '/api/v1/auth',
      websites: '/api/v1/websites',
      scans: '/api/v1/scans',
      content: '/api/v1/content',
      tracking: '/api/v1/tracking',
      keywords: '/api/v1/keywords',
      team: '/api/v1/team',
      settings: '/api/v1/settings',
      alerts: '/api/v1/alerts',
      analytics: '/api/v1/analytics',
      reports: '/api/v1/reports',
      'ml-optimization': '/api/v1/ml-optimization',
      integrations: '/api/v1/integrations',
      'ab-testing': '/api/v1/ab-testing'
    }
  });
});

export default router;