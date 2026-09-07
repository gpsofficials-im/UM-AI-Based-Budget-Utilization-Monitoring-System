import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Expenditure, ISupportingDocument } from '../models/Expenditure';
import { Budget } from '../models/Budget';
import { AnomalyEngine } from '../detection/anomalyEngine';
import { logAuditEvent } from '../middleware/audit';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

export class ExpenditureController {
  public static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        departmentId,
        budgetId,
        category,
        status,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 50,
      } = req.query;

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

      if (budgetId && budgetId !== 'ALL') filter.budget = new mongoose.Types.ObjectId(budgetId.toString());
      if (category && category !== 'ALL') filter.category = category;
      if (status && status !== 'ALL') filter.status = status;

      if (startDate || endDate) {
        filter.transactionDate = {};
        if (startDate) filter.transactionDate.$gte = new Date(startDate.toString());
        if (endDate) filter.transactionDate.$lte = new Date(endDate.toString());
      }

      if (search) {
        filter.$or = [
          { transactionId: { $regex: search.toString(), $options: 'i' } },
          { vendorPayee: { $regex: search.toString(), $options: 'i' } },
          { description: { $regex: search.toString(), $options: 'i' } },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const total = await Expenditure.countDocuments(filter);
      const expenditures = await Expenditure.find(filter)
        .populate('department')
        .populate('budget')
        .populate('recordedBy', 'name email role')
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(Number(limit));

      res.status(200).json({
        success: true,
        count: total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: expenditures,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const expenditure = await Expenditure.findById(id)
        .populate('department')
        .populate('budget')
        .populate('recordedBy', 'name email');

      if (!expenditure) {
        res.status(404).json({ success: false, message: 'Expenditure transaction not found' });
        return;
      }

      res.status(200).json({ success: true, data: expenditure });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { budget, department, amount, category, transactionDate, vendorPayee, description } = req.body;

      if (!budget || !department || !amount || !vendorPayee || !description) {
        res.status(400).json({ success: false, message: 'Missing required expenditure fields' });
        return;
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ success: false, message: 'Expenditure amount must be greater than 0' });
        return;
      }

      // Verify budget exists
      const targetBudget = await Budget.findById(budget);
      if (!targetBudget) {
        res.status(404).json({ success: false, message: 'Referenced budget not found' });
        return;
      }

      // Supporting document handling if uploaded via multer
      let supportingDoc: ISupportingDocument | undefined = undefined;
      if (req.file) {
        supportingDoc = {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          mimeType: req.file.mimetype,
          size: req.file.size,
        };
      }

      const uniqueTxId = `TXN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const expenditure = await Expenditure.create({
        transactionId: uniqueTxId,
        budget,
        department,
        amount: numAmount,
        category: category || 'OPERATIONAL',
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        vendorPayee: vendorPayee.trim(),
        description: description.trim(),
        supportingDocument: supportingDoc,
        status: 'RECORDED',
        recordedBy: req.user!._id,
      });

      await logAuditEvent({
        req,
        action: 'EXPENDITURE_CREATE',
        entityType: 'EXPENDITURE',
        entityId: (expenditure._id as any).toString(),
        newValue: expenditure.toObject(),
      });

      // Run Anomaly Detection Scan
      AnomalyEngine.runFullScan().catch((err) => console.error('[AnomalyScan Error]', err));

      res.status(201).json({
        success: true,
        message: 'Expenditure transaction recorded successfully',
        data: expenditure,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const expenditure = await Expenditure.findById(id);

      if (!expenditure) {
        res.status(404).json({ success: false, message: 'Expenditure transaction not found' });
        return;
      }

      const prev = expenditure.toObject();

      const { amount, category, transactionDate, vendorPayee, description, status } = req.body;
      if (amount !== undefined && Number(amount) > 0) expenditure.amount = Number(amount);
      if (category) expenditure.category = category;
      if (transactionDate) expenditure.transactionDate = new Date(transactionDate);
      if (vendorPayee) expenditure.vendorPayee = vendorPayee.trim();
      if (description) expenditure.description = description.trim();
      if (status && ['RECORDED', 'VERIFIED', 'FLAGGED', 'CANCELLED'].includes(status)) {
        expenditure.status = status;
      }

      if (req.file) {
        expenditure.supportingDocument = {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          mimeType: req.file.mimetype,
          size: req.file.size,
        };
      }

      await expenditure.save();

      await logAuditEvent({
        req,
        action: 'EXPENDITURE_UPDATE',
        entityType: 'EXPENDITURE',
        entityId: (expenditure._id as any).toString(),
        previousValue: prev,
        newValue: expenditure.toObject(),
      });

      AnomalyEngine.runFullScan().catch((err) => console.error('[AnomalyScan Error]', err));

      res.status(200).json({
        success: true,
        message: 'Expenditure transaction updated successfully',
        data: expenditure,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const expenditure = await Expenditure.findById(id);

      if (!expenditure) {
        res.status(404).json({ success: false, message: 'Expenditure transaction not found' });
        return;
      }

      await Expenditure.findByIdAndDelete(id);

      await logAuditEvent({
        req,
        action: 'EXPENDITURE_DELETE',
        entityType: 'EXPENDITURE',
        entityId: id as string,
        previousValue: expenditure.toObject(),
      });

      AnomalyEngine.runFullScan().catch((err) => console.error('[AnomalyScan Error]', err));

      res.status(200).json({ success: true, message: 'Expenditure deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async downloadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const exp = await Expenditure.findById(id);

      if (!exp || !exp.supportingDocument || !exp.supportingDocument.path) {
        res.status(404).json({ success: false, message: 'Supporting document not found' });
        return;
      }

      const filePath = path.resolve(exp.supportingDocument.path);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'File is missing on server storage' });
        return;
      }

      res.download(filePath, exp.supportingDocument.originalName);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
