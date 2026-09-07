import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Alert } from '../models/Alert';
import { AnomalyEngine } from '../detection/anomalyEngine';
import { logAuditEvent } from '../middleware/audit';
import mongoose from 'mongoose';

export class AlertController {
  public static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { departmentId, alertType, severity, status, page = 1, limit = 50 } = req.query;

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

      const skip = (Number(page) - 1) * Number(limit);
      const total = await Alert.countDocuments(filter);
      const alerts = await Alert.find(filter)
        .populate('department')
        .populate('budget')
        .populate('acknowledgedBy', 'name email role')
        .populate('resolvedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      res.status(200).json({
        success: true,
        count: total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: alerts,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alert = await Alert.findById(id)
        .populate('department')
        .populate('budget')
        .populate('acknowledgedBy', 'name email')
        .populate('resolvedBy', 'name email');

      if (!alert) {
        res.status(404).json({ success: false, message: 'Alert not found' });
        return;
      }

      res.status(200).json({ success: true, data: alert });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async acknowledge(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alert = await Alert.findById(id);

      if (!alert) {
        res.status(404).json({ success: false, message: 'Alert not found' });
        return;
      }

      const prev = alert.toObject();

      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedBy = req.user!._id;
      alert.acknowledgedAt = new Date();

      await alert.save();

      await logAuditEvent({
        req,
        action: 'ALERT_ACKNOWLEDGE',
        entityType: 'ALERT',
        entityId: (alert._id as any).toString(),
        previousValue: prev,
        newValue: alert.toObject(),
      });

      res.status(200).json({ success: true, message: 'Alert acknowledged successfully', data: alert });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async resolve(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { resolutionNotes } = req.body;

      const alert = await Alert.findById(id);

      if (!alert) {
        res.status(404).json({ success: false, message: 'Alert not found' });
        return;
      }

      const prev = alert.toObject();

      alert.status = 'RESOLVED';
      alert.resolvedBy = req.user!._id;
      alert.resolvedAt = new Date();
      if (resolutionNotes) alert.resolutionNotes = resolutionNotes.trim();

      await alert.save();

      await logAuditEvent({
        req,
        action: 'ALERT_RESOLVE',
        entityType: 'ALERT',
        entityId: (alert._id as any).toString(),
        previousValue: prev,
        newValue: alert.toObject(),
      });

      res.status(200).json({ success: true, message: 'Alert resolved and marked closed', data: alert });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async triggerScan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const scanResult = await AnomalyEngine.runFullScan();

      await logAuditEvent({
        req,
        action: 'ANOMALY_SCAN_MANUAL_TRIGGER',
        entityType: 'SYSTEM',
        newValue: scanResult,
      });

      res.status(200).json({
        success: true,
        message: 'Anomaly detection scan completed successfully',
        data: scanResult,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
