import { Router } from 'express';
import { ConfigController } from '../controllers/configController';
import { authenticateJWT } from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';

const router = Router();

router.use(authenticateJWT);

router.get('/', ConfigController.getConfig);
router.put('/', authorizeRoles('ADMIN'), ConfigController.updateConfig);

export default router;
