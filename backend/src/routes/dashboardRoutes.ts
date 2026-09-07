import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/summary', DashboardController.getSummary);
router.get('/trends', DashboardController.getTrends);
router.get('/departments', DashboardController.getDepartmentStats);
router.get('/categories', DashboardController.getCategoryDistribution);
router.get('/alerts-distribution', DashboardController.getAlertSeverityDistribution);

export default router;
