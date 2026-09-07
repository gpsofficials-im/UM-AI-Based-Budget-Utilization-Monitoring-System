import { Router } from 'express';
import { DepartmentController } from '../controllers/departmentController';
import { authenticateJWT } from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';

const router = Router();

router.use(authenticateJWT);

router.get('/', DepartmentController.getAll);
router.get('/:id', DepartmentController.getById);

// Admin-only mutations
router.post('/', authorizeRoles('ADMIN'), DepartmentController.create);
router.put('/:id', authorizeRoles('ADMIN'), DepartmentController.update);
router.delete('/:id', authorizeRoles('ADMIN'), DepartmentController.delete);

export default router;
