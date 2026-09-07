import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ReportService } from '../services/reportService';
import { Budget } from '../models/Budget';
import { Expenditure } from '../models/Expenditure';
import { Alert } from '../models/Alert';
import { UtilizationService } from '../services/utilizationService';
import mongoose from 'mongoose';

export class ReportController {
  public static async getBudgetReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { financialYear, departmentId, quarter, status, format = 'json' } = req.query;

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

      if (format === 'csv') {
        const csv = await ReportService.generateBudgetCSV(filter);
        res.header('Content-Type', 'text/csv');
        res.attachment(`budget-report-${Date.now()}.csv`);
        res.send(csv);
        return;
      }

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=budget-report-${Date.now()}.pdf`);
        await ReportService.generateBudgetPDF(filter, res);
        return;
      }

      // Default JSON format
      const budgets = await Budget.find(filter).populate('department').sort({ createdAt: -1 });
      const enriched = await Promise.all(
        budgets.map(async (b: any) => {
          const expenses = await Expenditure.find({ budget: b._id, status: { $in: ['RECORDED', 'VERIFIED'] } });
          const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
          const util = UtilizationService.calculateUtilization(b.allocatedAmount, b.approvedAmount, totalSpent);
          return {
            ...b.toObject(),
            totalSpent,
            remainingAmount: util.remainingAmount,
            utilizationPercentage: util.utilizationPercentage,
            band: util.band,
            bandLabel: util.bandLabel,
          };
        })
      );

      res.status(200).json({ success: true, count: enriched.length, data: enriched });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getExpenditureReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { departmentId, category, status, startDate, endDate, format = 'json' } = req.query;

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

      if (category && category !== 'ALL') filter.category = category;
      if (status && status !== 'ALL') filter.status = status;

      if (startDate || endDate) {
        filter.transactionDate = {};
        if (startDate) filter.transactionDate.$gte = new Date(startDate.toString());
        if (endDate) filter.transactionDate.$lte = new Date(endDate.toString());
      }

      if (format === 'csv') {
        const csv = await ReportService.generateExpenditureCSV(filter);
        res.header('Content-Type', 'text/csv');
        res.attachment(`expenditure-report-${Date.now()}.csv`);
        res.send(csv);
        return;
      }

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=expenditure-report-${Date.now()}.pdf`);
        await ReportService.generateExpenditurePDF(filter, res);
        return;
      }

      const expenses = await Expenditure.find(filter)
        .populate('department')
        .populate('budget')
        .sort({ transactionDate: -1 });

      res.status(200).json({ success: true, count: expenses.length, data: expenses });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getAnomalyReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { departmentId, alertType, severity, status, format = 'json' } = req.query;

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

      if (alertType && alertType !== 'ALL') filter.alertType = alertType;
      if (severity && severity !== 'ALL') filter.severity = severity;
      if (status && status !== 'ALL') filter.status = status;

      if (format === 'csv') {
        const csv = await ReportService.generateAnomalyCSV(filter);
        res.header('Content-Type', 'text/csv');
        res.attachment(`anomaly-report-${Date.now()}.csv`);
        res.send(csv);
        return;
      }

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=anomaly-report-${Date.now()}.pdf`);
        await ReportService.generateAnomalyPDF(filter, res);
        return;
      }

      const alerts = await Alert.find(filter)
        .populate('department')
        .populate('budget')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, count: alerts.length, data: alerts });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
