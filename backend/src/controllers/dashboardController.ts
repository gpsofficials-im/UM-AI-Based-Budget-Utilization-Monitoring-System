import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Budget } from '../models/Budget';
import { Expenditure } from '../models/Expenditure';
import { Department } from '../models/Department';
import { Alert } from '../models/Alert';
import { UtilizationService } from '../services/utilizationService';
import mongoose from 'mongoose';

export class DashboardController {
  public static async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { financialYear, departmentId } = req.query;

      const budgetFilter: any = { status: { $in: ['ALLOCATED', 'APPROVED', 'REVISED'] } };
      const expenseFilter: any = { status: { $in: ['RECORDED', 'VERIFIED'] } };
      const alertFilter: any = { status: 'OPEN' };

      // Scope to user's department if DEPARTMENT_HEAD
      if (req.user?.role === 'DEPARTMENT_HEAD' && req.user.department) {
        const userDeptId = (
          typeof req.user.department === 'object' && '_id' in req.user.department
            ? (req.user.department as any)._id
            : req.user.department
        );
        budgetFilter.department = userDeptId;
        expenseFilter.department = userDeptId;
        alertFilter.department = userDeptId;
      } else if (departmentId && departmentId !== 'ALL') {
        budgetFilter.department = new mongoose.Types.ObjectId(departmentId.toString());
        expenseFilter.department = new mongoose.Types.ObjectId(departmentId.toString());
        alertFilter.department = new mongoose.Types.ObjectId(departmentId.toString());
      }

      if (financialYear && financialYear !== 'ALL') {
        budgetFilter.financialYear = financialYear;
      }

      // 1. Fetch matching budgets
      const budgets = await Budget.find(budgetFilter);
      const budgetIds = budgets.map((b) => b._id);

      // If financialYear filtered, filter expenditures for those budgets
      if (financialYear && financialYear !== 'ALL') {
        expenseFilter.budget = { $in: budgetIds };
      }

      const expenditures = await Expenditure.find(expenseFilter);

      const totalAllocated = budgets.reduce((acc, curr) => acc + curr.allocatedAmount, 0);
      const totalApproved = budgets.reduce((acc, curr) => acc + curr.approvedAmount, 0);
      const totalSpent = expenditures.reduce((acc, curr) => acc + curr.amount, 0);

      const utilizationMetrics = UtilizationService.calculateUtilization(totalAllocated, totalApproved, totalSpent);

      const totalDepartments = await Department.countDocuments({ status: 'ACTIVE' });
      const activeAlertsCount = await Alert.countDocuments(alertFilter);
      const criticalAlertsCount = await Alert.countDocuments({ ...alertFilter, severity: 'CRITICAL' });
      const totalAnomaliesCount = await Alert.countDocuments(alertFilter);

      // Identify under-utilized & overspending budgets
      let underUtilizedBudgetsCount = 0;
      let overspendingBudgetsCount = 0;

      for (const b of budgets) {
        const bExpenses = expenditures.filter((e) => e.budget.toString() === b._id.toString());
        const bSpent = bExpenses.reduce((s, e) => s + e.amount, 0);
        const bUtil = UtilizationService.calculateUtilization(b.allocatedAmount, b.approvedAmount, bSpent);
        if (bUtil.band === 'LOW') underUtilizedBudgetsCount++;
        if (bUtil.band === 'OVERSPENDING') overspendingBudgetsCount++;
      }

      res.status(200).json({
        success: true,
        data: {
          totalBudget: totalAllocated,
          totalApproved,
          totalSpent,
          remainingBudget: utilizationMetrics.remainingAmount,
          utilizationPercentage: utilizationMetrics.utilizationPercentage,
          utilizationBand: utilizationMetrics.band,
          utilizationBandLabel: utilizationMetrics.bandLabel,
          totalDepartments,
          activeAlerts: activeAlertsCount,
          criticalAlerts: criticalAlertsCount,
          totalAnomalies: totalAnomaliesCount,
          underUtilizedCount: underUtilizedBudgetsCount,
          overspendingCount: overspendingBudgetsCount,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { financialYear, departmentId } = req.query;

      const expenseFilter: any = { status: { $in: ['RECORDED', 'VERIFIED'] } };

      if (req.user?.role === 'DEPARTMENT_HEAD' && req.user.department) {
        expenseFilter.department = (
          typeof req.user.department === 'object' && '_id' in req.user.department
            ? (req.user.department as any)._id
            : req.user.department
        );
      } else if (departmentId && departmentId !== 'ALL') {
        expenseFilter.department = new mongoose.Types.ObjectId(departmentId.toString());
      }

      if (financialYear && financialYear !== 'ALL') {
        const budgets = await Budget.find({ financialYear, ...(expenseFilter.department && { department: expenseFilter.department }) });
        expenseFilter.budget = { $in: budgets.map((b) => b._id) };
      }

      const expenditures = await Expenditure.find(expenseFilter).sort({ transactionDate: 1 });

      const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      const monthlyData: Record<string, number> = {};
      monthNames.forEach((m) => (monthlyData[m] = 0));

      const monthMap = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      for (const exp of expenditures) {
        const date = new Date(exp.transactionDate);
        const m = monthMap[date.getMonth()];
        if (monthlyData[m] !== undefined) {
          monthlyData[m] += exp.amount;
        }
      }

      res.status(200).json({
        success: true,
        data: {
          labels: monthNames,
          datasets: [
            {
              label: 'Monthly Expenditure (INR)',
              data: monthNames.map((m) => monthlyData[m]),
            },
          ],
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getDepartmentStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { financialYear } = req.query;

      let deptFilter: any = { status: 'ACTIVE' };
      if (req.user?.role === 'DEPARTMENT_HEAD' && req.user.department) {
        deptFilter._id = (
          typeof req.user.department === 'object' && '_id' in req.user.department
            ? (req.user.department as any)._id
            : req.user.department
        );
      }

      const departments = await Department.find(deptFilter);

      const stats = await Promise.all(
        departments.map(async (dept) => {
          const bFilter: any = { department: dept._id, status: { $in: ['ALLOCATED', 'APPROVED', 'REVISED'] } };
          if (financialYear && financialYear !== 'ALL') {
            bFilter.financialYear = financialYear;
          }

          const budgets = await Budget.find(bFilter);
          const allocated = budgets.reduce((acc, curr) => acc + curr.allocatedAmount, 0);
          const approved = budgets.reduce((acc, curr) => acc + curr.approvedAmount, 0);

          const expenditures = await Expenditure.find({
            department: dept._id,
            status: { $in: ['RECORDED', 'VERIFIED'] },
            ...(financialYear && financialYear !== 'ALL' ? { budget: { $in: budgets.map((b) => b._id) } } : {}),
          });
          const spent = expenditures.reduce((acc, curr) => acc + curr.amount, 0);

          const util = UtilizationService.calculateUtilization(allocated, approved, spent);
          const alertsCount = await Alert.countDocuments({ department: dept._id, status: 'OPEN' });

          return {
            departmentId: dept._id,
            departmentCode: dept.code,
            departmentName: dept.name,
            allocatedAmount: allocated,
            approvedAmount: approved,
            totalExpenditure: spent,
            remainingAmount: util.remainingAmount,
            utilizationPercentage: util.utilizationPercentage,
            band: util.band,
            bandLabel: util.bandLabel,
            activeAlerts: alertsCount,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getCategoryDistribution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { financialYear, departmentId } = req.query;

      const expenseFilter: any = { status: { $in: ['RECORDED', 'VERIFIED'] } };

      if (req.user?.role === 'DEPARTMENT_HEAD' && req.user.department) {
        expenseFilter.department = (
          typeof req.user.department === 'object' && '_id' in req.user.department
            ? (req.user.department as any)._id
            : req.user.department
        );
      } else if (departmentId && departmentId !== 'ALL') {
        expenseFilter.department = new mongoose.Types.ObjectId(departmentId.toString());
      }

      if (financialYear && financialYear !== 'ALL') {
        const budgets = await Budget.find({ financialYear, ...(expenseFilter.department && { department: expenseFilter.department }) });
        expenseFilter.budget = { $in: budgets.map((b) => b._id) };
      }

      const categories = [
        'CAPITAL',
        'OPERATIONAL',
        'PROCUREMENT',
        'SALARY',
        'INFRASTRUCTURE',
        'TRAINING',
        'MAINTENANCE',
        'OTHER',
      ];

      const expenses = await Expenditure.find(expenseFilter);
      const catSums: Record<string, number> = {};
      categories.forEach((c) => (catSums[c] = 0));

      for (const e of expenses) {
        if (catSums[e.category] !== undefined) {
          catSums[e.category] += e.amount;
        } else {
          catSums[e.category] = e.amount;
        }
      }

      res.status(200).json({
        success: true,
        data: {
          labels: categories,
          data: categories.map((c) => catSums[c]),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getAlertSeverityDistribution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const alertFilter: any = { status: 'OPEN' };

      if (req.user?.role === 'DEPARTMENT_HEAD' && req.user.department) {
        alertFilter.department = (
          typeof req.user.department === 'object' && '_id' in req.user.department
            ? (req.user.department as any)._id
            : req.user.department
        );
      }

      const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

      const alerts = await Alert.find(alertFilter);
      alerts.forEach((a) => {
        if (counts[a.severity] !== undefined) {
          counts[a.severity]++;
        }
      });

      res.status(200).json({
        success: true,
        data: {
          labels: severities,
          data: severities.map((s) => counts[s]),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
