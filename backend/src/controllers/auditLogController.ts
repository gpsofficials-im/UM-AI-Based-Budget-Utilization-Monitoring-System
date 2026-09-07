import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditLog } from '../models/AuditLog';

export class AuditLogController {
  public static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entityType, userEmail, action, startDate, endDate, page = 1, limit = 50 } = req.query;

      const filter: any = {};
      if (entityType && entityType !== 'ALL') filter.entityType = entityType;
      if (userEmail) filter.userEmail = { $regex: userEmail.toString(), $options: 'i' };
      if (action) filter.action = { $regex: action.toString(), $options: 'i' };

      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate.toString());
        if (endDate) filter.timestamp.$lte = new Date(endDate.toString());
      }

      const skip = (Number(page) - 1) * Number(limit);
      const total = await AuditLog.countDocuments(filter);
      const logs = await AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit));

      res.status(200).json({
        success: true,
        count: total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: logs,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
