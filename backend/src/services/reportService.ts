import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { Budget } from '../models/Budget';
import { Expenditure } from '../models/Expenditure';
import { Alert } from '../models/Alert';
import { UtilizationService } from './utilizationService';

export class ReportService {
  /**
   * Generates a Budget Summary Report in CSV format.
   */
  public static async generateBudgetCSV(query: any): Promise<string> {
    const budgets = await Budget.find(query).populate('department').sort({ createdAt: -1 });

    const data = await Promise.all(
      budgets.map(async (b: any) => {
        const expenses = await Expenditure.find({ budget: b._id, status: { $in: ['RECORDED', 'VERIFIED'] } });
        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const util = UtilizationService.calculateUtilization(b.allocatedAmount, b.approvedAmount, totalSpent);

        return {
          'Budget ID': b.budgetId,
          'Financial Year': b.financialYear,
          'Quarter': b.quarter,
          'Department Code': b.department?.code || 'N/A',
          'Department Name': b.department?.name || 'N/A',
          'Project / Scheme': b.projectScheme,
          'Allocated Amount (INR)': b.allocatedAmount,
          'Approved Amount (INR)': b.approvedAmount,
          'Expenditure (INR)': totalSpent,
          'Remaining (INR)': util.remainingAmount,
          'Utilization (%)': util.utilizationPercentage,
          'Band': util.band,
          'Status': b.status,
        };
      })
    );

    const parser = new Parser({ fields: Object.keys(data[0] || {}) });
    return parser.parse(data);
  }

  /**
   * Generates a Budget Summary Report in formatted PDF.
   */
  public static async generateBudgetPDF(query: any, res: Response): Promise<void> {
    const budgets = await Budget.find(query).populate('department').sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    // Title & Header
    doc.fontSize(18).fillColor('#1e3a8a').text('Government Budget Utilization Monitoring System', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#4b5563').text('Official Budget Allocation & Utilization Report', { align: 'center' });
    doc.fontSize(9).fillColor('#6b7280').text(`Generated on: ${new Date().toLocaleString('en-IN')} | Scope: Official`, { align: 'center' });
    doc.moveDown(1);

    // Divider
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
    doc.moveDown(0.8);

    // Summary Statistics
    let totalAllocated = 0;
    let totalSpentSum = 0;

    for (const b of budgets) {
      totalAllocated += b.allocatedAmount;
      const expenses = await Expenditure.find({ budget: b._id, status: { $in: ['RECORDED', 'VERIFIED'] } });
      totalSpentSum += expenses.reduce((sum, e) => sum + e.amount, 0);
    }
    const overallUtil = totalAllocated > 0 ? ((totalSpentSum / totalAllocated) * 100).toFixed(2) : '0';

    doc.fontSize(10).fillColor('#0f172a').text(
      `Total Budgets: ${budgets.length}   |   Total Allocated: Rs. ${totalAllocated.toLocaleString('en-IN')}   |   Total Spent: Rs. ${totalSpentSum.toLocaleString('en-IN')} (${overallUtil}%)`
    );
    doc.moveDown(0.8);

    // List Budgets
    for (const b of budgets as any[]) {
      const expenses = await Expenditure.find({ budget: b._id, status: { $in: ['RECORDED', 'VERIFIED'] } });
      const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
      const util = UtilizationService.calculateUtilization(b.allocatedAmount, b.approvedAmount, totalSpent);

      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(10).fillColor('#1e40af').text(`[${b.budgetId}] ${b.projectScheme} (${b.financialYear} - ${b.quarter})`);
      doc.fontSize(9).fillColor('#334155').text(`Department: ${b.department?.name || 'N/A'} [Code: ${b.department?.code || 'N/A'}] | Status: ${b.status}`);
      doc.fontSize(9).fillColor('#475569').text(
        `Allocated: Rs. ${b.allocatedAmount.toLocaleString('en-IN')}  |  Spent: Rs. ${totalSpent.toLocaleString('en-IN')}  |  Remaining: Rs. ${util.remainingAmount.toLocaleString('en-IN')}  |  Utilization: ${util.utilizationPercentage}% (${util.band})`
      );
      doc.moveDown(0.5);
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
      doc.moveDown(0.5);
    }

    doc.end();
  }

  /**
   * Generates Expenditure Transactions in CSV.
   */
  public static async generateExpenditureCSV(query: any): Promise<string> {
    const expenses = await Expenditure.find(query)
      .populate('department')
      .populate('budget')
      .sort({ transactionDate: -1 });

    const data = expenses.map((e: any) => ({
      'Transaction ID': e.transactionId,
      'Date': new Date(e.transactionDate).toISOString().split('T')[0],
      'Department': e.department?.name || 'N/A',
      'Budget Scheme': e.budget?.projectScheme || 'N/A',
      'Category': e.category,
      'Vendor / Payee': e.vendorPayee,
      'Amount (INR)': e.amount,
      'Status': e.status,
      'Description': e.description,
    }));

    const parser = new Parser({ fields: Object.keys(data[0] || {}) });
    return parser.parse(data);
  }

  /**
   * Generates Expenditure Transactions in PDF.
   */
  public static async generateExpenditurePDF(query: any, res: Response): Promise<void> {
    const expenses = await Expenditure.find(query)
      .populate('department')
      .populate('budget')
      .sort({ transactionDate: -1 });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(18).fillColor('#065f46').text('Expenditure Audit & Transaction Report', { align: 'center' });
    doc.fontSize(9).fillColor('#6b7280').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);

    let totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
    doc.fontSize(10).fillColor('#0f172a').text(`Total Transactions: ${expenses.length}   |   Cumulative Expenditure: Rs. ${totalAmount.toLocaleString('en-IN')}`);
    doc.moveDown(0.5);

    for (const e of expenses as any[]) {
      if (doc.y > 720) {
        doc.addPage();
      }
      doc.fontSize(9).fillColor('#047857').text(`TX ID: ${e.transactionId} | Date: ${new Date(e.transactionDate).toLocaleDateString('en-IN')} | Category: ${e.category} | Amount: Rs. ${e.amount.toLocaleString('en-IN')}`);
      doc.fontSize(8.5).fillColor('#334155').text(`Dept: ${e.department?.name || 'N/A'} | Vendor: ${e.vendorPayee} | Scheme: ${e.budget?.projectScheme || 'N/A'}`);
      doc.fontSize(8).fillColor('#64748b').text(`Description: ${e.description}`);
      doc.moveDown(0.4);
      doc.strokeColor('#f1f5f9').lineWidth(0.5).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
      doc.moveDown(0.4);
    }

    doc.end();
  }

  /**
   * Generates Anomaly & Alerts Report in CSV.
   */
  public static async generateAnomalyCSV(query: any): Promise<string> {
    const alerts = await Alert.find(query).populate('department').populate('budget').sort({ createdAt: -1 });

    const data = alerts.map((a: any) => ({
      'Alert ID': a.alertId,
      'Alert Type': a.alertType,
      'Severity': a.severity,
      'Status': a.status,
      'Department': a.department?.name || 'N/A',
      'Scheme': a.budget?.projectScheme || 'N/A',
      'Title': a.title,
      'Description': a.description,
      'Detected Value': a.detectedValue,
      'Threshold': a.threshold,
      'Generated At': new Date(a.createdAt).toISOString(),
    }));

    const parser = new Parser({ fields: Object.keys(data[0] || {}) });
    return parser.parse(data);
  }

  /**
   * Generates Anomaly & Alerts Report in PDF.
   */
  public static async generateAnomalyPDF(query: any, res: Response): Promise<void> {
    const alerts = await Alert.find(query).populate('department').populate('budget').sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(18).fillColor('#991b1b').text('Financial Irregularities & Anomaly Audit Report', { align: 'center' });
    doc.fontSize(9).fillColor('#6b7280').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#0f172a').text(`Total Anomalies Detected: ${alerts.length}`);
    doc.moveDown(0.5);

    for (const a of alerts as any[]) {
      if (doc.y > 700) {
        doc.addPage();
      }
      doc.fontSize(9.5).fillColor(a.severity === 'CRITICAL' ? '#b91c1c' : '#c2410c').text(`[${a.severity}] [${a.alertType}] - ${a.title}`);
      doc.fontSize(8.5).fillColor('#334155').text(`Department: ${a.department?.name || 'N/A'} | Status: ${a.status} | Date: ${new Date(a.createdAt).toLocaleDateString('en-IN')}`);
      doc.fontSize(8).fillColor('#475569').text(`Details: ${a.description}`);
      if (a.resolutionNotes) {
        doc.fontSize(8).fillColor('#047857').text(`Resolution Notes: ${a.resolutionNotes}`);
      }
      doc.moveDown(0.4);
      doc.strokeColor('#fee2e2').lineWidth(0.5).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
      doc.moveDown(0.4);
    }

    doc.end();
  }
}
