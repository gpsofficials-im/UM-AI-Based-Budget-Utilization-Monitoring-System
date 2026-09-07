import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLogController';
import { authenticateJWT } from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';

const router = Router();

router.use(authenticateJWT);
router.use(authorizeRoles('ADMIN')); // Audit logs are protected and readable only by ADMIN

router.get('/', AuditLogController.getAll);

export default router;
