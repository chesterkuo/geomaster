import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

// Apply authentication and organization middleware
router.use(authenticateToken);
router.use(requireOrganization);

// Dashboard routes
router.get('/stats', dashboardController.getStats);

export default router;