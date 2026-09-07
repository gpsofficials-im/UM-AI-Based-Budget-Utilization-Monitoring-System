import mongoose from 'mongoose';
import { Budget, IBudget } from '../models/Budget';
import { Expenditure } from '../models/Expenditure';
import { Alert, IAlert, AlertType, AlertSeverity } from '../models/Alert';
import { SystemConfiguration, ISystemConfiguration } from '../models/SystemConfiguration';
import { UtilizationService } from '../services/utilizationService';

export interface DetectionScanResult {
  alertsGenerated: number;
  alertsUpdated: number;
  scannedBudgets: number;
  scannedDepartments: number;
  details: string[];
}

export class AnomalyEngine {
  /**
   * Fetch current system configuration or create default if not yet initialized.
   */
  public static async getSystemConfig(): Promise<ISystemConfiguration> {
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
    return config;
  }

  /**
   * Run full anomaly detection scan across all active budgets and expenditures.
   */
  public static async runFullScan(): Promise<DetectionScanResult> {
    const config = await this.getSystemConfig();
    const budgets = await Budget.find({ status: { $in: ['ALLOCATED', 'APPROVED', 'REVISED'] } }).populate('department');

    let alertsGenerated = 0;
    let alertsUpdated = 0;
    const details: string[] = [];
    const scannedDepts = new Set<string>();

    for (const budget of budgets) {
      if (!budget.department) continue;
      const deptId = (budget.department as any)._id;
      const deptName = (budget.department as any).name;
      scannedDepts.add(deptId.toString());

      // 1. Calculate expenditures for this budget
      const expenditures = await Expenditure.find({
        budget: budget._id,
        status: { $in: ['RECORDED', 'VERIFIED'] },
      }).sort({ transactionDate: 1 });

      const totalSpent = expenditures.reduce((acc, curr) => acc + curr.amount, 0);
      const utilization = UtilizationService.calculateUtilization(
        budget.allocatedAmount,
        budget.approvedAmount,
        totalSpent,
        config.underUtilizationThresholdPercent,
        80,
        config.overspendingThresholdPercent
      );

      const timeElapsedPercent = UtilizationService.calculateTimeElapsedPercentage(
        budget.financialYear,
        budget.quarter
      );

      // --- RULE 1: OVERSPENDING DETECTION ---
      if (totalSpent > budget.approvedAmount) {
        const overspentAmount = totalSpent - budget.approvedAmount;
        const overspentRatio = UtilizationService.roundCurrency((totalSpent / budget.approvedAmount) * 100);

        const alertRes = await this.createOrUpdateAlert({
          department: deptId,
          budget: budget._id,
          alertType: 'OVERSPENDING',
          severity: 'CRITICAL',
          title: `Overspending Detected: ${deptName} (${budget.projectScheme})`,
          description: `Total expenditure (₹${totalSpent.toLocaleString('en-IN')}) has exceeded the approved budget limit of ₹${budget.approvedAmount.toLocaleString('en-IN')} by ₹${overspentAmount.toLocaleString('en-IN')} (${overspentRatio}% of approved budget).`,
          detectedValue: overspentRatio,
          threshold: config.overspendingThresholdPercent,
        });

        if (alertRes.isNew) alertsGenerated++;
        else alertsUpdated++;
        details.push(`[Overspending] Generated/Updated alert for ${deptName} - Scheme: ${budget.projectScheme}`);
      }

      // --- RULE 2: UNDER-UTILIZATION DETECTION ---
      if (
        timeElapsedPercent >= config.underUtilizationTimeElapsedThresholdPercent &&
        utilization.utilizationPercentage < config.underUtilizationThresholdPercent
      ) {
        let severity: AlertSeverity = 'MEDIUM';
        if (timeElapsedPercent >= 85 && utilization.utilizationPercentage < 20) {
          severity = 'HIGH';
        }

        const alertRes = await this.createOrUpdateAlert({
          department: deptId,
          budget: budget._id,
          alertType: 'UNDER_UTILIZATION',
          severity,
          title: `Under-Utilization Risk: ${deptName} (${budget.projectScheme})`,
          description: `${timeElapsedPercent.toFixed(1)}% of the financial period (${budget.financialYear} ${budget.quarter}) has elapsed, but only ${utilization.utilizationPercentage.toFixed(1)}% of allocated funds (₹${totalSpent.toLocaleString('en-IN')} / ₹${budget.allocatedAmount.toLocaleString('en-IN')}) have been utilized.`,
          detectedValue: utilization.utilizationPercentage,
          threshold: config.underUtilizationThresholdPercent,
        });

        if (alertRes.isNew) alertsGenerated++;
        else alertsUpdated++;
        details.push(`[Under-Utilization] Generated/Updated alert for ${deptName} - Scheme: ${budget.projectScheme}`);
      }

      // --- RULE 3: BUDGET DEVIATION DETECTION ---
      const deviationThresholdAmount = budget.allocatedAmount * (config.budgetDeviationThresholdPercent / 100);
      if (
        totalSpent > budget.allocatedAmount + deviationThresholdAmount &&
        utilization.utilizationPercentage > (100 + config.budgetDeviationThresholdPercent)
      ) {
        const alertRes = await this.createOrUpdateAlert({
          department: deptId,
          budget: budget._id,
          alertType: 'BUDGET_DEVIATION',
          severity: 'HIGH',
          title: `Budget Deviation Warning: ${deptName} (${budget.projectScheme})`,
          description: `Expenditure has deviated significantly beyond the allowed ${config.budgetDeviationThresholdPercent}% buffer of the allocated budget. Current utilization is ${utilization.utilizationPercentage}%.`,
          detectedValue: utilization.utilizationPercentage,
          threshold: 100 + config.budgetDeviationThresholdPercent,
        });

        if (alertRes.isNew) alertsGenerated++;
        else alertsUpdated++;
        details.push(`[Budget-Deviation] Generated/Updated alert for ${deptName}`);
      }

      // --- RULE 4: SPENDING SPIKE DETECTION ---
      if (expenditures.length >= 3) {
        const amounts = expenditures.map((e) => e.amount);
        const avgSpending = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const spikeThreshold = avgSpending * config.spendingSpikeMultiplier;

        // Check the most recent 2 transactions for spending spike
        const recentExpenses = expenditures.slice(-2);
        for (const recent of recentExpenses) {
          if (recent.amount > spikeThreshold && recent.amount > 50000) {
            const multiplierDetected = UtilizationService.roundCurrency(recent.amount / avgSpending);
            const alertRes = await this.createOrUpdateAlert({
              department: deptId,
              budget: budget._id,
              alertType: 'SPENDING_SPIKE',
              severity: multiplierDetected >= 2.5 ? 'HIGH' : 'MEDIUM',
              title: `Unusual Spending Spike: ${deptName} (${recent.vendorPayee})`,
              description: `Transaction ${recent.transactionId} of ₹${recent.amount.toLocaleString('en-IN')} for "${recent.description}" is ${multiplierDetected}x higher than the historical average expenditure (₹${Math.round(avgSpending).toLocaleString('en-IN')}) for this budget.`,
              detectedValue: multiplierDetected,
              threshold: config.spendingSpikeMultiplier,
            });

            if (alertRes.isNew) alertsGenerated++;
            else alertsUpdated++;
            details.push(`[Spending-Spike] Generated/Updated alert for ${deptName} - TX: ${recent.transactionId}`);
            break;
          }
        }
      }
    }

    return {
      alertsGenerated,
      alertsUpdated,
      scannedBudgets: budgets.length,
      scannedDepartments: scannedDepts.size,
      details,
    };
  }

  /**
   * Helper method to create a new alert or refresh an existing OPEN alert without duplicates.
   */
  private static async createOrUpdateAlert(params: {
    department: mongoose.Types.ObjectId;
    budget?: mongoose.Types.ObjectId;
    alertType: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    detectedValue: number;
    threshold: number;
  }): Promise<{ alert: IAlert; isNew: boolean }> {
    // Check if an OPEN alert for this budget & alertType already exists
    let existingAlert = await Alert.findOne({
      department: params.department,
      budget: params.budget,
      alertType: params.alertType,
      status: 'OPEN',
    });

    if (existingAlert) {
      existingAlert.severity = params.severity;
      existingAlert.title = params.title;
      existingAlert.description = params.description;
      existingAlert.detectedValue = params.detectedValue;
      existingAlert.threshold = params.threshold;
      await existingAlert.save();
      return { alert: existingAlert, isNew: false };
    }

    const uniqueAlertId = `ALT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newAlert = await Alert.create({
      alertId: uniqueAlertId,
      department: params.department,
      budget: params.budget,
      alertType: params.alertType,
      severity: params.severity,
      title: params.title,
      description: params.description,
      detectedValue: params.detectedValue,
      threshold: params.threshold,
      status: 'OPEN',
    });

    return { alert: newAlert, isNew: true };
  }
}
