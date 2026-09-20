export type UtilizationBand = 'LOW' | 'NORMAL' | 'HIGH' | 'OVERSPENDING';

export interface UtilizationResult {
  allocatedAmount: number;
  approvedAmount: number;
  totalExpenditure: number;
  remainingAmount: number;
  utilizationPercentage: number;
  band: UtilizationBand;
  bandLabel: string;
}

export class UtilizationService {
  public static roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  public static calculateUtilization(
    allocatedAmount: number,
    approvedAmount: number,
    totalExpenditure: number,
    lowThreshold = 40,
    highThreshold = 80,
    overspendingThreshold = 100
  ): UtilizationResult {
    const allocated = this.roundCurrency(Math.max(0, allocatedAmount));
    const approved = this.roundCurrency(Math.max(0, approvedAmount));
    const expenditure = this.roundCurrency(Math.max(0, totalExpenditure));
    const remaining = this.roundCurrency(allocated - expenditure);

    let utilizationPercentage = 0;
    if (allocated > 0) {
      utilizationPercentage = this.roundCurrency((expenditure / allocated) * 100);
    } else if (expenditure > 0) {
      utilizationPercentage = 100.0;
    }

    let band: UtilizationBand = 'NORMAL';
    let bandLabel = 'Normal Utilization (40% - 79%)';

    if (utilizationPercentage < lowThreshold) {
      band = 'LOW';
      bandLabel = `Low Utilization (< ${lowThreshold}%)`;
    } else if (utilizationPercentage < highThreshold) {
      band = 'NORMAL';
      bandLabel = `Normal Utilization (${lowThreshold}% - ${highThreshold - 1}%)`;
    } else if (utilizationPercentage < overspendingThreshold) {
      band = 'HIGH';
      bandLabel = `High Utilization (${highThreshold}% - ${overspendingThreshold - 1}%)`;
    } else {
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

  public static calculateTimeElapsedPercentage(
    financialYear: string,
    quarter: string = 'ANNUAL',
    currentDate: Date = new Date()
  ): number {
    const parts = financialYear.split('-');
    if (parts.length !== 2) return 50;

    const startYear = parseInt(parts[0], 10);
    if (isNaN(startYear)) return 50;

    let periodStart: Date;
    let periodEnd: Date;

    if (quarter === 'Q1') {
      periodStart = new Date(startYear, 3, 1);
      periodEnd = new Date(startYear, 5, 30, 23, 59, 59);
    } else if (quarter === 'Q2') {
      periodStart = new Date(startYear, 6, 1);
      periodEnd = new Date(startYear, 8, 30, 23, 59, 59);
    } else if (quarter === 'Q3') {
      periodStart = new Date(startYear, 9, 1);
      periodEnd = new Date(startYear, 11, 31, 23, 59, 59);
    } else if (quarter === 'Q4') {
      periodStart = new Date(startYear + 1, 0, 1);
      periodEnd = new Date(startYear + 1, 2, 31, 23, 59, 59);
    } else {
      periodStart = new Date(startYear, 3, 1);
      periodEnd = new Date(startYear + 1, 2, 31, 23, 59, 59);
    }

    const totalDuration = periodEnd.getTime() - periodStart.getTime();
    const elapsedDuration = currentDate.getTime() - periodStart.getTime();

    if (elapsedDuration <= 0) return 0;
    if (elapsedDuration >= totalDuration) return 100;

    return this.roundCurrency((elapsedDuration / totalDuration) * 100);
  }
}
