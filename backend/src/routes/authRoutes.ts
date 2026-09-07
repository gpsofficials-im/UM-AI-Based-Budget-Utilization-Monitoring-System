import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/login', AuthController.login);
router.post('/logout', authenticateJWT, AuthController.logout);
router.get('/me', authenticateJWT, AuthController.getProfile);

export default router;
