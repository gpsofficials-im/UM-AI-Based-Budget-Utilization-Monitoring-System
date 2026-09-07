import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Budget } from '../models/Budget';
import { Expenditure } from '../models/Expenditure';
import { UtilizationService } from '../services/utilizationService';
import { AnomalyEngine } from '../detection/anomalyEngine';
import { logAuditEvent } from '../middleware/audit';
import mongoose from 'mongoose';

export class BudgetController {
  public static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { financialYear, quarter, departmentId, status, search, page = 1, limit = 50 } = req.query;

      const filter: any = {};

      if (req.user?.role === 'DEPARTMENT_HEAD' && req.user.department) {
        filter.department = (
          typeof req.user.department === 'object' && '_id' in req.user.department
            ? (req.user.department as any)._id
            : req.user.department
        );
      } else if (departmentId && departmentId !== 'ALL') {
        filter.department = new mongoose.Types.ObjectId(departmentId.toString());
      }

      if (financialYear && financialYear !== 'ALL') filter.financialYear = financialYear;
      if (quarter && quarter !== 'ALL') filter.quarter = quarter;
      if (status && status !== 'ALL') filter.status = status;

      if (search) {
        filter.$or = [
          { budgetId: { $regex: search.toString(), $options: 'i' } },
          { projectScheme: { $regex: search.toString(), $options: 'i' } },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const total = await Budget.countDocuments(filter);
      const budgets = await Budget.find(filter)
        .populate('department')
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      // Calculate utilization for each budget
      const budgetsWithUtilization = await Promise.all(
        budgets.map(async (b: any) => {
          const expenses = await Expenditure.find({ budget: b._id, status: { $in: ['RECORDED', 'VERIFIED'] } });
          const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
          const util = UtilizationService.calculateUtilization(b.allocatedAmount, b.approvedAmount, totalSpent);

          return {
            ...b.toObject(),
            totalSpent,
            remainingAmount: util.remainingAmount,
            utilizationPercentage: util.utilizationPercentage,
            band: util.band,
            bandLabel: util.bandLabel,
            expensesCount: expenses.length,
          };
        })
      );

      res.status(200).json({
        success: true,
        count: total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: budgetsWithUtilization,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const budget = await Budget.findById(id).populate('department').populate('createdBy', 'name email');

      if (!budget) {
        res.status(404).json({ success: false, message: 'Budget not found' });
        return;
      }

      const expenses = await Expenditure.find({ budget: budget._id })
        .populate('recordedBy', 'name email')
        .sort({ transactionDate: -1 });

      const totalSpent = expenses
        .filter((e) => ['RECORDED', 'VERIFIED'].includes(e.status))
        .reduce((sum, e) => sum + e.amount, 0);

      const util = UtilizationService.calculateUtilization(budget.allocatedAmount, budget.approvedAmount, totalSpent);

      res.status(200).json({
        success: true,
        data: {
          ...budget.toObject(),
          totalSpent,
          remainingAmount: util.remainingAmount,
          utilizationPercentage: util.utilizationPercentage,
          band: util.band,
          bandLabel: util.bandLabel,
          expenses,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        financialYear,
        quarter,
        department,
        projectScheme,
        allocatedAmount,
        approvedAmount,
        allocationDate,
        status,
        description,
      } = req.body;

      if (!financialYear || !department || !projectScheme || allocatedAmount === undefined || approvedAmount === undefined) {
        res.status(400).json({ success: false, message: 'Required budget fields missing' });
        return;
      }

      if (Number(allocatedAmount) <= 0 || Number(approvedAmount) <= 0) {
        res.status(400).json({ success: false, message: 'Allocated and approved amounts must be greater than 0' });
        return;
      }

      const uniqueBudgetId = `BDG-${financialYear.replace('-', '')}-${(quarter || 'ANN').substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const budget = await Budget.create({
        budgetId: uniqueBudgetId,
        financialYear,
        quarter: quarter || 'ANNUAL',
        department,
        projectScheme: projectScheme.trim(),
        allocatedAmount: Number(allocatedAmount),
        approvedAmount: Number(approvedAmount),
        allocationDate: allocationDate ? new Date(allocationDate) : new Date(),
        status: status || 'ALLOCATED',
        description,
        createdBy: req.user!._id,
      });

      await logAuditEvent({
        req,
        action: 'BUDGET_CREATE',
        entityType: 'BUDGET',
        entityId: (budget._id as any).toString(),
        newValue: budget.toObject(),
      });

      // Trigger anomaly scan asynchronously
      AnomalyEngine.runFullScan().catch((err) => console.error('[AnomalyScan Error]', err));

      res.status(201).json({ success: true, message: 'Budget created and allocated successfully', data: budget });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const budget = await Budget.findById(id);

      if (!budget) {
        res.status(404).json({ success: false, message: 'Budget not found' });
        return;
      }

      const prev = budget.toObject();

      const {
        financialYear,
        quarter,
        department,
        projectScheme,
        allocatedAmount,
        approvedAmount,
        allocationDate,
        status,
        description,
      } = req.body;

      if (financialYear) budget.financialYear = financialYear;
      if (quarter) budget.quarter = quarter;
      if (department) budget.department = department;
      if (projectScheme) budget.projectScheme = projectScheme.trim();
      if (allocatedAmount !== undefined) budget.allocatedAmount = Number(allocatedAmount);
      if (approvedAmount !== undefined) budget.approvedAmount = Number(approvedAmount);
      if (allocationDate) budget.allocationDate = new Date(allocationDate);
      if (status) budget.status = status;
      if (description !== undefined) budget.description = description;

      await budget.save();

      await logAuditEvent({
        req,
        action: 'BUDGET_UPDATE',
        entityType: 'BUDGET',
        entityId: (budget._id as any).toString(),
        previousValue: prev,
        newValue: budget.toObject(),
      });

      AnomalyEngine.runFullScan().catch((err) => console.error('[AnomalyScan Error]', err));

      res.status(200).json({ success: true, message: 'Budget updated successfully', data: budget });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const budget = await Budget.findById(id);

      if (!budget) {
        res.status(404).json({ success: false, message: 'Budget not found' });
        return;
      }

      const linkedExpenses = await Expenditure.countDocuments({ budget: id });
      if (linkedExpenses > 0) {
        budget.status = 'CLOSED';
        await budget.save();

        await logAuditEvent({
          req,
          action: 'BUDGET_CLOSE',
          entityType: 'BUDGET',
          entityId: (budget._id as any).toString(),
        });

        res.status(200).json({
          success: true,
          message: 'Budget has recorded expenditures and was marked CLOSED instead of deleted to protect audit trail.',
          data: budget,
        });
        return;
      }

      await Budget.findByIdAndDelete(id);

      await logAuditEvent({
        req,
        action: 'BUDGET_DELETE',
        entityType: 'BUDGET',
        entityId: id as string,
        previousValue: budget.toObject(),
      });

      res.status(200).json({ success: true, message: 'Budget deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
