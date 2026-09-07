import { UtilizationService } from '../services/utilizationService';

describe('Budget Utilization Engine Tests', () => {
  test('accurately calculates utilization percentage and remaining budget', () => {
    const allocated = 10000000; // 1 Cr
    const approved = 10000000;
    const spent = 6500000; // 65 Lakhs

    const result = UtilizationService.calculateUtilization(allocated, approved, spent);

    expect(result.allocatedAmount).toBe(10000000);
    expect(result.totalExpenditure).toBe(6500000);
    expect(result.remainingAmount).toBe(3500000);
    expect(result.utilizationPercentage).toBe(65.0);
    expect(result.band).toBe('NORMAL');
  });

  test('identifies LOW utilization (<40%)', () => {
    const allocated = 5000000;
    const approved = 5000000;
    const spent = 1500000; // 30%

    const result = UtilizationService.calculateUtilization(allocated, approved, spent);

    expect(result.utilizationPercentage).toBe(30.0);
    expect(result.band).toBe('LOW');
  });

  test('identifies HIGH utilization (80% - 99%)', () => {
    const allocated = 5000000;
    const approved = 5000000;
    const spent = 4500000; // 90%

    const result = UtilizationService.calculateUtilization(allocated, approved, spent);

    expect(result.utilizationPercentage).toBe(90.0);
    expect(result.band).toBe('HIGH');
  });

  test('identifies OVERSPENDING (>=100%)', () => {
    const allocated = 5000000;
    const approved = 5000000;
    const spent = 5500000; // 110%

    const result = UtilizationService.calculateUtilization(allocated, approved, spent);

    expect(result.utilizationPercentage).toBe(110.0);
    expect(result.remainingAmount).toBe(-500000);
    expect(result.band).toBe('OVERSPENDING');
  });

  test('handles zero allocation edge cases gracefully without division by zero errors', () => {
    const result = UtilizationService.calculateUtilization(0, 0, 0);

    expect(result.utilizationPercentage).toBe(0);
    expect(result.remainingAmount).toBe(0);
    expect(result.band).toBe('LOW');
  });

  test('correctly computes financial year time elapsed percentage', () => {
    // FY 2025-26 starts 2025-04-01, ends 2026-03-31
    const midYear = new Date('2025-10-01T00:00:00Z');
    const elapsed = UtilizationService.calculateTimeElapsedPercentage('2025-26', 'ANNUAL', midYear);

    expect(elapsed).toBeGreaterThan(45);
    expect(elapsed).toBeLessThan(55);
  });
});
