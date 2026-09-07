import { Router } from 'express';
import { ExpenditureController } from '../controllers/expenditureController';
import { authenticateJWT } from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';
import { enforceDepartmentScope } from '../middleware/departmentScope';
import { upload } from '../config/multer';

const router = Router();

router.use(authenticateJWT);

router.get('/', ExpenditureController.getAll);
router.get('/:id', ExpenditureController.getById);
router.get('/:id/document', ExpenditureController.downloadDocument);

router.post(
  '/',
  authorizeRoles('ADMIN', 'FINANCE_OFFICER', 'DEPARTMENT_HEAD'),
  enforceDepartmentScope(),
  upload.single('document'),
  ExpenditureController.create
);

router.put(
  '/:id',
  authorizeRoles('ADMIN', 'FINANCE_OFFICER'),
  upload.single('document'),
  ExpenditureController.update
);

router.delete('/:id', authorizeRoles('ADMIN'), ExpenditureController.delete);

export default router;
