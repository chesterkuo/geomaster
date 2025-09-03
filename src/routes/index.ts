import { Router } from 'express';
import authRoutes from './auth.routes';
import websiteRoutes from './website.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/websites', websiteRoutes);

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
      reports: '/api/v1/reports'
    }
  });
});

export default router;