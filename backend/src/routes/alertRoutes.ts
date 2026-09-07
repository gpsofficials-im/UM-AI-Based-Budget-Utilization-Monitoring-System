import { Router } from 'express';
import { AlertController } from '../controllers/alertController';
import { authenticateJWT } from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';

const router = Router();

router.use(authenticateJWT);

router.get('/', AlertController.getAll);
router.get('/:id', AlertController.getById);

// All authenticated roles can acknowledge relevant alerts
router.put('/:id/acknowledge', AlertController.acknowledge);

// Finance Officers & Admins resolve alerts
router.put('/:id/resolve', authorizeRoles('ADMIN', 'FINANCE_OFFICER'), AlertController.resolve);

// Manual trigger for anomaly detection
router.post('/scan', authorizeRoles('ADMIN', 'FINANCE_OFFICER'), AlertController.triggerScan);

export default router;
