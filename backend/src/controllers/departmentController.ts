import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Department } from '../models/Department';
import { Budget } from '../models/Budget';
import { Expenditure } from '../models/Expenditure';
import { Alert } from '../models/Alert';
import { UtilizationService } from '../services/utilizationService';
import { logAuditEvent } from '../middleware/audit';

export class DepartmentController {
  public static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let filter: any = {};
      if (req.user?.role === 'DEPARTMENT_HEAD' && req.user.department) {
        filter._id = (
          typeof req.user.department === 'object' && '_id' in req.user.department
            ? (req.user.department as any)._id
            : req.user.department
        );
      }

      const departments = await Department.find(filter).sort({ name: 1 });
      res.status(200).json({ success: true, count: departments.length, data: departments });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dept = await Department.findById(id);

      if (!dept) {
        res.status(404).json({ success: false, message: 'Department not found' });
        return;
      }

      // Department summary calculation
      const budgets = await Budget.find({ department: dept._id });
      const allocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
      const approved = budgets.reduce((sum, b) => sum + b.approvedAmount, 0);

      const expenses = await Expenditure.find({ department: dept._id, status: { $in: ['RECORDED', 'VERIFIED'] } });
      const spent = expenses.reduce((sum, e) => sum + e.amount, 0);

      const util = UtilizationService.calculateUtilization(allocated, approved, spent);
      const alerts = await Alert.find({ department: dept._id, status: 'OPEN' }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: {
          ...dept.toObject(),
          financialSummary: {
            totalBudgetsCount: budgets.length,
            allocatedAmount: allocated,
            approvedAmount: approved,
            totalExpenditure: spent,
            remainingAmount: util.remainingAmount,
            utilizationPercentage: util.utilizationPercentage,
            band: util.band,
            bandLabel: util.bandLabel,
            activeAlertsCount: alerts.length,
            activeAlerts: alerts,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code, name, description, headOfDepartment, contactEmail, contactPhone } = req.body;

      if (!code || !name) {
        res.status(400).json({ success: false, message: 'Department code and name are required' });
        return;
      }

      const existing = await Department.findOne({ code: code.toUpperCase().trim() });
      if (existing) {
        res.status(409).json({ success: false, message: `Department code '${code}' already exists` });
        return;
      }

      const department = await Department.create({
        code: code.toUpperCase().trim(),
        name: name.trim(),
        description,
        headOfDepartment,
        contactEmail,
        contactPhone,
        status: 'ACTIVE',
      });

      await logAuditEvent({
        req,
        action: 'DEPARTMENT_CREATE',
        entityType: 'DEPARTMENT',
        entityId: (department._id as any).toString(),
        newValue: department.toObject(),
      });

      res.status(201).json({ success: true, message: 'Department created successfully', data: department });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dept = await Department.findById(id);

      if (!dept) {
        res.status(404).json({ success: false, message: 'Department not found' });
        return;
      }

      const prev = dept.toObject();

      const { name, description, headOfDepartment, contactEmail, contactPhone, status } = req.body;
      if (name) dept.name = name.trim();
      if (description !== undefined) dept.description = description;
      if (headOfDepartment !== undefined) dept.headOfDepartment = headOfDepartment;
      if (contactEmail !== undefined) dept.contactEmail = contactEmail;
      if (contactPhone !== undefined) dept.contactPhone = contactPhone;
      if (status && ['ACTIVE', 'INACTIVE'].includes(status)) dept.status = status;

      await dept.save();

      await logAuditEvent({
        req,
        action: 'DEPARTMENT_UPDATE',
        entityType: 'DEPARTMENT',
        entityId: (dept._id as any).toString(),
        previousValue: prev,
        newValue: dept.toObject(),
      });

      res.status(200).json({ success: true, message: 'Department updated successfully', data: dept });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dept = await Department.findById(id);

      if (!dept) {
        res.status(404).json({ success: false, message: 'Department not found' });
        return;
      }

      // Check if linked to budgets or expenses
      const linkedBudgets = await Budget.countDocuments({ department: id });
      if (linkedBudgets > 0) {
        // Soft delete / deactivate to preserve historical integrity
        dept.status = 'INACTIVE';
        await dept.save();

        await logAuditEvent({
          req,
          action: 'DEPARTMENT_DEACTIVATE',
          entityType: 'DEPARTMENT',
          entityId: (dept._id as any).toString(),
        });

        res.status(200).json({
          success: true,
          message: 'Department has associated budgets and was deactivated instead of deleted to protect audit history.',
          data: dept,
        });
        return;
      }

      await Department.findByIdAndDelete(id);

      await logAuditEvent({
        req,
        action: 'DEPARTMENT_DELETE',
        entityType: 'DEPARTMENT',
        entityId: id as string,
        previousValue: dept.toObject(),
      });

      res.status(200).json({ success: true, message: 'Department deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
