import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from '../middleware/audit';

export class UserController {
  public static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role, departmentId, status, search } = req.query;

      const filter: any = {};
      if (role && role !== 'ALL') filter.role = role;
      if (departmentId && departmentId !== 'ALL') filter.department = departmentId;
      if (status && status !== 'ALL') filter.status = status;

      if (search) {
        filter.$or = [
          { name: { $regex: search.toString(), $options: 'i' } },
          { email: { $regex: search.toString(), $options: 'i' } },
        ];
      }

      const users = await User.find(filter)
        .select('-passwordHash')
        .populate('department')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select('-passwordHash').populate('department');

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, role, department, status } = req.body;

      if (!name || !email || !password || !role) {
        res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
        return;
      }

      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        res.status(409).json({ success: false, message: 'A user with this email address already exists' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        department: department || null,
        status: status || 'ACTIVE',
      });

      await logAuditEvent({
        req,
        action: 'USER_CREATE',
        entityType: 'USER',
        entityId: (user._id as any).toString(),
        newValue: { name: user.name, email: user.email, role: user.role, department: user.department },
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const prev = { name: user.name, role: user.role, department: user.department, status: user.status };

      const { name, role, department, status, password } = req.body;
      if (name) user.name = name.trim();
      if (role && ['ADMIN', 'FINANCE_OFFICER', 'DEPARTMENT_HEAD'].includes(role)) user.role = role;
      if (department !== undefined) user.department = department || null;
      if (status && ['ACTIVE', 'INACTIVE'].includes(status)) user.status = status;

      if (password && password.trim().length >= 6) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password.trim(), salt);
      }

      await user.save();

      await logAuditEvent({
        req,
        action: 'USER_UPDATE',
        entityType: 'USER',
        entityId: (user._id as any).toString(),
        previousValue: prev,
        newValue: { name: user.name, role: user.role, department: user.department, status: user.status },
      });

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (req.user!._id.toString() === id) {
        res.status(400).json({ success: false, message: 'Administrators cannot delete their own active account' });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      await User.findByIdAndDelete(id);

      await logAuditEvent({
        req,
        action: 'USER_DELETE',
        entityType: 'USER',
        entityId: id as string,
        previousValue: { email: user.email, role: user.role },
      });

      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
