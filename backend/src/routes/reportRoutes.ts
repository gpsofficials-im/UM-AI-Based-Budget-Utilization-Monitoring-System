import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/budget', ReportController.getBudgetReport);
router.get('/expenditure', ReportController.getExpenditureReport);
router.get('/anomalies', ReportController.getAnomalyReport);

export default router;
