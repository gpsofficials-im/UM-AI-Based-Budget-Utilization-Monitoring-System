import { Router } from 'express';
import { BudgetController } from '../controllers/budgetController';
import { authenticateJWT } from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';

const router = Router();

router.use(authenticateJWT);

router.get('/', BudgetController.getAll);
router.get('/:id', BudgetController.getById);

// Admin & Finance Officer can create, update, delete budgets
router.post('/', authorizeRoles('ADMIN', 'FINANCE_OFFICER'), BudgetController.create);
router.put('/:id', authorizeRoles('ADMIN', 'FINANCE_OFFICER'), BudgetController.update);
router.delete('/:id', authorizeRoles('ADMIN'), BudgetController.delete);

export default router;
