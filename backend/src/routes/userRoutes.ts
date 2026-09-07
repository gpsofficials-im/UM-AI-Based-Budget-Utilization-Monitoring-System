import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateJWT } from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';

const router = Router();

router.use(authenticateJWT);
router.use(authorizeRoles('ADMIN')); // All user management endpoints are restricted to ADMIN

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', UserController.create);
router.put('/:id', UserController.update);
router.delete('/:id', UserController.delete);

export default router;
