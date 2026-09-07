import { Router } from 'express';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import departmentRoutes from './departmentRoutes';
import budgetRoutes from './budgetRoutes';
import expenditureRoutes from './expenditureRoutes';
import alertRoutes from './alertRoutes';
import userRoutes from './userRoutes';
import reportRoutes from './reportRoutes';
import auditLogRoutes from './auditLogRoutes';
import configRoutes from './configRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'budget-monitoring-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/budgets', budgetRoutes);
router.use('/expenditures', expenditureRoutes);
router.use('/alerts', alertRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/config', configRoutes);

export default router;
