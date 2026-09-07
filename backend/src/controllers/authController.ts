import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export class AuthController {
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('department');

      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      if (user.status !== 'ACTIVE') {
        res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact an administrator.' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_for_budget_monitoring_system_2026_secure';
      const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        secret,
        { expiresIn: expiresIn as any }
      );

      await logAuditEvent({
        req,
        action: 'USER_LOGIN',
        entityType: 'AUTH',
        entityId: (user._id as any).toString(),
        newValue: { email: user.email, role: user.role },
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            lastLogin: user.lastLogin,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Internal server error during login' });
    }
  }

  public static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          department: req.user.department,
          status: req.user.status,
          lastLogin: req.user.lastLogin,
          createdAt: req.user.createdAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (req.user) {
        await logAuditEvent({
          req,
          action: 'USER_LOGOUT',
          entityType: 'AUTH',
          entityId: (req.user._id as any).toString(),
        });
      }
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
