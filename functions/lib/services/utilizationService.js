"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilizationService = void 0;
class UtilizationService {
    static roundCurrency(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }
    static calculateUtilization(allocatedAmount, approvedAmount, totalExpenditure, lowThreshold = 40, highThreshold = 80, overspendingThreshold = 100) {
        const allocated = this.roundCurrency(Math.max(0, allocatedAmount));
        const approved = this.roundCurrency(Math.max(0, approvedAmount));
        const expenditure = this.roundCurrency(Math.max(0, totalExpenditure));
        const remaining = this.roundCurrency(allocated - expenditure);
        let utilizationPercentage = 0;
        if (allocated > 0) {
            utilizationPercentage = this.roundCurrency((expenditure / allocated) * 100);
        }
        else if (expenditure > 0) {
            utilizationPercentage = 100.0;
        }
        let band = 'NORMAL';
        let bandLabel = 'Normal Utilization (40% - 79%)';
        if (utilizationPercentage < lowThreshold) {
            band = 'LOW';
            bandLabel = `Low Utilization (< ${lowThreshold}%)`;
        }
        else if (utilizationPercentage < highThreshold) {
            band = 'NORMAL';
            bandLabel = `Normal Utilization (${lowThreshold}% - ${highThreshold - 1}%)`;
        }
        else if (utilizationPercentage < overspendingThreshold) {
            band = 'HIGH';
            bandLabel = `High Utilization (${highThreshold}% - ${overspendingThreshold - 1}%)`;
        }
        else {
            band = 'OVERSPENDING';
            bandLabel = `Overspending (>= ${overspendingThreshold}%)`;
        }
        return {
            allocatedAmount: allocated,
            approvedAmount: approved,
            totalExpenditure: expenditure,
            remainingAmount: remaining,
            utilizationPercentage,
            band,
            bandLabel,
        };
    }
    static calculateTimeElapsedPercentage(financialYear, quarter = 'ANNUAL', currentDate = new Date()) {
        const parts = financialYear.split('-');
        if (parts.length !== 2)
            return 50;
        const startYear = parseInt(parts[0], 10);
        if (isNaN(startYear))
            return 50;
        let periodStart;
        let periodEnd;
        if (quarter === 'Q1') {
            periodStart = new Date(startYear, 3, 1);
            periodEnd = new Date(startYear, 5, 30, 23, 59, 59);
        }
        else if (quarter === 'Q2') {
            periodStart = new Date(startYear, 6, 1);
            periodEnd = new Date(startYear, 8, 30, 23, 59, 59);
        }
        else if (quarter === 'Q3') {
            periodStart = new Date(startYear, 9, 1);
            periodEnd = new Date(startYear, 11, 31, 23, 59, 59);
        }
        else if (quarter === 'Q4') {
            periodStart = new Date(startYear + 1, 0, 1);
            periodEnd = new Date(startYear + 1, 2, 31, 23, 59, 59);
        }
        else {
            periodStart = new Date(startYear, 3, 1);
            periodEnd = new Date(startYear + 1, 2, 31, 23, 59, 59);
        }
        const totalDuration = periodEnd.getTime() - periodStart.getTime();
        const elapsedDuration = currentDate.getTime() - periodStart.getTime();
        if (elapsedDuration <= 0)
            return 0;
        if (elapsedDuration >= totalDuration)
            return 100;
        return this.roundCurrency((elapsedDuration / totalDuration) * 100);
    }
}
exports.UtilizationService = UtilizationService;
//# sourceMappingURL=utilizationService.js.map