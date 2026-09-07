import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { SystemConfiguration } from '../models/SystemConfiguration';
import { logAuditEvent } from '../middleware/audit';

export class ConfigController {
  public static async getConfig(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let config = await SystemConfiguration.findOne();
      if (!config) {
        config = await SystemConfiguration.create({
          underUtilizationThresholdPercent: 40,
          underUtilizationTimeElapsedThresholdPercent: 70,
          overspendingThresholdPercent: 100,
          spendingSpikeMultiplier: 1.5,
          budgetDeviationThresholdPercent: 15,
          autoRunDetectionOnExpenditure: true,
          alertNotificationEmail: 'finance-alerts@gov.in',
        });
      }

      res.status(200).json({ success: true, data: config });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let config = await SystemConfiguration.findOne();
      if (!config) {
        config = new SystemConfiguration();
      }

      const prev = config.toObject();

      const {
        underUtilizationThresholdPercent,
        underUtilizationTimeElapsedThresholdPercent,
        overspendingThresholdPercent,
        spendingSpikeMultiplier,
        budgetDeviationThresholdPercent,
        autoRunDetectionOnExpenditure,
        alertNotificationEmail,
      } = req.body;

      if (underUtilizationThresholdPercent !== undefined) {
        config.underUtilizationThresholdPercent = Number(underUtilizationThresholdPercent);
      }
      if (underUtilizationTimeElapsedThresholdPercent !== undefined) {
        config.underUtilizationTimeElapsedThresholdPercent = Number(underUtilizationTimeElapsedThresholdPercent);
      }
      if (overspendingThresholdPercent !== undefined) {
        config.overspendingThresholdPercent = Number(overspendingThresholdPercent);
      }
      if (spendingSpikeMultiplier !== undefined) {
        config.spendingSpikeMultiplier = Number(spendingSpikeMultiplier);
      }
      if (budgetDeviationThresholdPercent !== undefined) {
        config.budgetDeviationThresholdPercent = Number(budgetDeviationThresholdPercent);
      }
      if (autoRunDetectionOnExpenditure !== undefined) {
        config.autoRunDetectionOnExpenditure = Boolean(autoRunDetectionOnExpenditure);
      }
      if (alertNotificationEmail) {
        config.alertNotificationEmail = alertNotificationEmail.trim();
      }

      config.updatedBy = req.user!._id;
      await config.save();

      await logAuditEvent({
        req,
        action: 'SYSTEM_CONFIG_UPDATE',
        entityType: 'CONFIG',
        entityId: (config._id as any).toString(),
        previousValue: prev,
        newValue: config.toObject(),
      });

      res.status(200).json({
        success: true,
        message: 'System configuration updated successfully',
        data: config,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
