import { Request } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from './auth';

export interface CreateAuditLogParams {
  req: Request | AuthenticatedRequest;
  action: string;
  entityType: 'BUDGET' | 'EXPENDITURE' | 'DEPARTMENT' | 'USER' | 'ALERT' | 'CONFIG' | 'AUTH' | 'SYSTEM';
  entityId?: string;
  previousValue?: any;
  newValue?: any;
}

export const logAuditEvent = async ({
  req,
  action,
  entityType,
  entityId,
  previousValue,
  newValue,
}: CreateAuditLogParams): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    const userEmail = user ? user.email : (req.body?.email || 'SYSTEM_GUEST');
    const userRole = user ? user.role : 'GUEST';

    const ipAddress =
      req.headers['x-forwarded-for']?.toString() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const userAgent = req.headers['user-agent'] || 'Unknown Agent';

    await AuditLog.create({
      user: user ? user._id : null,
      userEmail,
      userRole,
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log entry:', err);
  }
};
