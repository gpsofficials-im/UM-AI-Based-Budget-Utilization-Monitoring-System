import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export const enforceDepartmentScope = (departmentIdExtractor?: (req: AuthenticatedRequest) => string | undefined) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Admins and Finance Officers have global view across all departments
    if (req.user.role === 'ADMIN' || req.user.role === 'FINANCE_OFFICER') {
      next();
      return;
    }

    // Department Heads must have an assigned department
    if (req.user.role === 'DEPARTMENT_HEAD') {
      if (!req.user.department) {
        res.status(403).json({
          success: false,
          message: 'Department Head is not assigned to any department',
        });
        return;
      }

      const assignedDeptId = (
        typeof req.user.department === 'object' && '_id' in req.user.department
          ? (req.user.department as any)._id
          : req.user.department
      ).toString();

      // Check extracted or body or param or query department ID
      const targetDeptId =
        (departmentIdExtractor ? departmentIdExtractor(req) : null) ||
        req.params.departmentId ||
        req.query.departmentId?.toString() ||
        req.body.departmentId ||
        req.body.department;

      if (targetDeptId && targetDeptId.toString() !== assignedDeptId) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are only authorized to view and manage your assigned department data.',
        });
        return;
      }
    }

    next();
  };
};
