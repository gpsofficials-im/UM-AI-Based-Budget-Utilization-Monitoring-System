"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyEngine = void 0;
const admin = __importStar(require("firebase-admin"));
const utilizationService_1 = require("../services/utilizationService");
class AnomalyEngine {
    static async getSystemConfig(db) {
        const configDoc = await db.collection('config').doc('system').get();
        if (configDoc.exists) {
            return configDoc.data();
        }
        const defaultConfig = {
            underUtilizationThresholdPercent: 40,
            underUtilizationTimeElapsedThresholdPercent: 70,
            overspendingThresholdPercent: 100,
            spendingSpikeMultiplier: 1.5,
            budgetDeviationThresholdPercent: 15,
            autoRunDetectionOnExpenditure: true,
            alertNotificationEmail: 'finance-alerts@gov.in',
        };
        await db.collection('config').doc('system').set(defaultConfig);
        return defaultConfig;
    }
    static async runFullScan(db) {
        const config = await this.getSystemConfig(db);
        const budgetsSnapshot = await db.collection('budgets')
            .where('status', 'in', ['ALLOCATED', 'APPROVED', 'REVISED'])
            .get();
        let alertsGenerated = 0;
        let alertsUpdated = 0;
        const details = [];
        const scannedDepts = new Set();
        for (const budgetDoc of budgetsSnapshot.docs) {
            const budget = budgetDoc.data();
            const budgetId = budgetDoc.id;
            const deptId = budget.departmentId;
            const deptName = budget.department?.name || budget.departmentName || 'Department';
            if (deptId)
                scannedDepts.add(deptId);
            // Fetch expenditures for this budget
            const expensesSnapshot = await db.collection('expenditures')
                .where('budgetId', '==', budgetId)
                .where('status', 'in', ['RECORDED', 'VERIFIED'])
                .get();
            const expenditures = expensesSnapshot.docs.map(d => d.data());
            const totalSpent = expenditures.reduce((acc, curr) => acc + (curr.amount || 0), 0);
            const utilization = utilizationService_1.UtilizationService.calculateUtilization(budget.allocatedAmount || 0, budget.approvedAmount || 0, totalSpent, config.underUtilizationThresholdPercent, 80, config.overspendingThresholdPercent);
            const timeElapsedPercent = utilizationService_1.UtilizationService.calculateTimeElapsedPercentage(budget.financialYear || '2025-26', budget.quarter || 'ANNUAL');
            // --- RULE 1: OVERSPENDING DETECTION ---
            if (totalSpent > (budget.approvedAmount || 0)) {
                const overspentAmount = totalSpent - (budget.approvedAmount || 0);
                const overspentRatio = utilizationService_1.UtilizationService.roundCurrency((totalSpent / (budget.approvedAmount || 1)) * 100);
                const alertRes = await this.createOrUpdateAlert(db, {
                    departmentId: deptId,
                    department: budget.department || { id: deptId, name: deptName },
                    budgetId,
                    budget: { id: budgetId, projectScheme: budget.projectScheme, financialYear: budget.financialYear },
                    alertType: 'OVERSPENDING',
                    severity: 'CRITICAL',
                    title: `Overspending Detected: ${deptName} (${budget.projectScheme})`,
                    description: `Total expenditure (Rs. ${totalSpent.toLocaleString('en-IN')}) has exceeded approved budget limit of Rs. ${(budget.approvedAmount || 0).toLocaleString('en-IN')} by Rs. ${overspentAmount.toLocaleString('en-IN')} (${overspentRatio}% of approved budget).`,
                    detectedValue: overspentRatio,
                    threshold: config.overspendingThresholdPercent,
                });
                if (alertRes.isNew)
                    alertsGenerated++;
                else
                    alertsUpdated++;
                details.push(`[Overspending] Alert for ${deptName} - Scheme: ${budget.projectScheme}`);
            }
            // --- RULE 2: UNDER-UTILIZATION DETECTION ---
            if (timeElapsedPercent >= config.underUtilizationTimeElapsedThresholdPercent &&
                utilization.utilizationPercentage < config.underUtilizationThresholdPercent) {
                let severity = 'MEDIUM';
                if (timeElapsedPercent >= 85 && utilization.utilizationPercentage < 20) {
                    severity = 'HIGH';
                }
                const alertRes = await this.createOrUpdateAlert(db, {
                    departmentId: deptId,
                    department: budget.department || { id: deptId, name: deptName },
                    budgetId,
                    budget: { id: budgetId, projectScheme: budget.projectScheme, financialYear: budget.financialYear },
                    alertType: 'UNDER_UTILIZATION',
                    severity,
                    title: `Under-Utilization Risk: ${deptName} (${budget.projectScheme})`,
                    description: `${timeElapsedPercent.toFixed(1)}% of the financial period (${budget.financialYear} ${budget.quarter}) has elapsed, but only ${utilization.utilizationPercentage.toFixed(1)}% of allocated funds (Rs. ${totalSpent.toLocaleString('en-IN')} / Rs. ${(budget.allocatedAmount || 0).toLocaleString('en-IN')}) have been deployed.`,
                    detectedValue: utilization.utilizationPercentage,
                    threshold: config.underUtilizationThresholdPercent,
                });
                if (alertRes.isNew)
                    alertsGenerated++;
                else
                    alertsUpdated++;
                details.push(`[Under-Utilization] Alert for ${deptName} - Scheme: ${budget.projectScheme}`);
            }
            // --- RULE 3: BUDGET DEVIATION DETECTION ---
            const deviationBuffer = (budget.allocatedAmount || 0) * (config.budgetDeviationThresholdPercent / 100);
            if (totalSpent > (budget.allocatedAmount || 0) + deviationBuffer &&
                utilization.utilizationPercentage > (100 + config.budgetDeviationThresholdPercent)) {
                const alertRes = await this.createOrUpdateAlert(db, {
                    departmentId: deptId,
                    department: budget.department || { id: deptId, name: deptName },
                    budgetId,
                    budget: { id: budgetId, projectScheme: budget.projectScheme, financialYear: budget.financialYear },
                    alertType: 'BUDGET_DEVIATION',
                    severity: 'HIGH',
                    title: `Budget Deviation Warning: ${deptName} (${budget.projectScheme})`,
                    description: `Expenditure has deviated beyond allowed ${config.budgetDeviationThresholdPercent}% buffer of allocated budget. Current utilization is ${utilization.utilizationPercentage}%.`,
                    detectedValue: utilization.utilizationPercentage,
                    threshold: 100 + config.budgetDeviationThresholdPercent,
                });
                if (alertRes.isNew)
                    alertsGenerated++;
                else
                    alertsUpdated++;
                details.push(`[Budget-Deviation] Alert for ${deptName}`);
            }
            // --- RULE 4: SPENDING SPIKE DETECTION ---
            if (expenditures.length >= 3) {
                const amounts = expenditures.map((e) => e.amount || 0);
                const avgSpending = amounts.reduce((a, b) => a + b, 0) / amounts.length;
                const spikeThreshold = avgSpending * config.spendingSpikeMultiplier;
                const recentExpenses = expenditures.slice(-2);
                for (const recent of recentExpenses) {
                    if (recent.amount > spikeThreshold && recent.amount > 50000) {
                        const multiplierDetected = utilizationService_1.UtilizationService.roundCurrency(recent.amount / avgSpending);
                        const alertRes = await this.createOrUpdateAlert(db, {
                            departmentId: deptId,
                            department: budget.department || { id: deptId, name: deptName },
                            budgetId,
                            budget: { id: budgetId, projectScheme: budget.projectScheme, financialYear: budget.financialYear },
                            alertType: 'SPENDING_SPIKE',
                            severity: multiplierDetected >= 2.5 ? 'HIGH' : 'MEDIUM',
                            title: `Unusual Spending Spike: ${deptName} (${recent.vendorPayee})`,
                            description: `Transaction ${recent.transactionId} of Rs. ${recent.amount.toLocaleString('en-IN')} for "${recent.description}" is ${multiplierDetected}x higher than historical average (Rs. ${Math.round(avgSpending).toLocaleString('en-IN')}).`,
                            detectedValue: multiplierDetected,
                            threshold: config.spendingSpikeMultiplier,
                        });
                        if (alertRes.isNew)
                            alertsGenerated++;
                        else
                            alertsUpdated++;
                        details.push(`[Spending-Spike] Alert for ${deptName} - TX: ${recent.transactionId}`);
                        break;
                    }
                }
            }
        }
        return {
            alertsGenerated,
            alertsUpdated,
            scannedBudgets: budgetsSnapshot.docs.length,
            scannedDepartments: scannedDepts.size,
            details,
        };
    }
    static async createOrUpdateAlert(db, params) {
        const existing = await db.collection('alerts')
            .where('budgetId', '==', params.budgetId)
            .where('alertType', '==', params.alertType)
            .where('status', '==', 'OPEN')
            .limit(1)
            .get();
        if (!existing.empty) {
            const docRef = existing.docs[0].ref;
            await docRef.update({
                severity: params.severity,
                title: params.title,
                description: params.description,
                detectedValue: params.detectedValue,
                threshold: params.threshold,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { id: docRef.id, isNew: false };
        }
        const uniqueAlertId = `ALT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const newDocRef = await db.collection('alerts').add({
            alertId: uniqueAlertId,
            departmentId: params.departmentId,
            department: params.department,
            budgetId: params.budgetId,
            budget: params.budget,
            alertType: params.alertType,
            severity: params.severity,
            title: params.title,
            description: params.description,
            detectedValue: params.detectedValue,
            threshold: params.threshold,
            status: 'OPEN',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { id: newDocRef.id, isNew: true };
    }
}
exports.AnomalyEngine = AnomalyEngine;
//# sourceMappingURL=anomalyEngine.js.map