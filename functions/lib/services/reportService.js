"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const json2csv_1 = require("json2csv");
const pdfkit_1 = __importDefault(require("pdfkit"));
const utilizationService_1 = require("./utilizationService");
class ReportService {
    static async generateBudgetCSV(db, filters = {}) {
        let query = db.collection('budgets');
        if (filters.departmentId && filters.departmentId !== 'ALL') {
            query = query.where('departmentId', '==', filters.departmentId);
        }
        if (filters.financialYear && filters.financialYear !== 'ALL') {
            query = query.where('financialYear', '==', filters.financialYear);
        }
        const snapshot = await query.get();
        const data = await Promise.all(snapshot.docs.map(async (doc) => {
            const b = doc.data();
            const expensesSnap = await db.collection('expenditures')
                .where('budgetId', '==', doc.id)
                .where('status', 'in', ['RECORDED', 'VERIFIED'])
                .get();
            const totalSpent = expensesSnap.docs.reduce((sum, e) => sum + (e.data().amount || 0), 0);
            const util = utilizationService_1.UtilizationService.calculateUtilization(b.allocatedAmount || 0, b.approvedAmount || 0, totalSpent);
            return {
                'Budget ID': b.budgetId || doc.id,
                'Financial Year': b.financialYear,
                'Quarter': b.quarter,
                'Department Code': b.department?.code || b.departmentCode || 'N/A',
                'Department Name': b.department?.name || b.departmentName || 'N/A',
                'Project / Scheme': b.projectScheme,
                'Allocated Amount (INR)': b.allocatedAmount,
                'Approved Amount (INR)': b.approvedAmount,
                'Expenditure (INR)': totalSpent,
                'Remaining (INR)': util.remainingAmount,
                'Utilization (%)': util.utilizationPercentage,
                'Band': util.band,
                'Status': b.status,
            };
        }));
        const parser = new json2csv_1.Parser({ fields: Object.keys(data[0] || {}) });
        return parser.parse(data);
    }
    static async generateBudgetPDFBuffer(db, filters = {}) {
        let query = db.collection('budgets');
        if (filters.departmentId && filters.departmentId !== 'ALL') {
            query = query.where('departmentId', '==', filters.departmentId);
        }
        if (filters.financialYear && filters.financialYear !== 'ALL') {
            query = query.where('financialYear', '==', filters.financialYear);
        }
        const snapshot = await query.get();
        return new Promise(async (resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 30, size: 'A4' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
            doc.fontSize(18).fillColor('#1e3a8a').text('Government Budget Utilization Monitoring System', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(12).fillColor('#4b5563').text('Official Budget Allocation & Utilization Report', { align: 'center' });
            doc.fontSize(9).fillColor('#6b7280').text(`Generated on: ${new Date().toLocaleString('en-IN')} | Verified Cloud Firestore`, { align: 'center' });
            doc.moveDown(1);
            doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
            doc.moveDown(0.8);
            let totalAllocated = 0;
            let totalSpentSum = 0;
            for (const bDoc of snapshot.docs) {
                const b = bDoc.data();
                totalAllocated += (b.allocatedAmount || 0);
                const expSnap = await db.collection('expenditures')
                    .where('budgetId', '==', bDoc.id)
                    .where('status', 'in', ['RECORDED', 'VERIFIED'])
                    .get();
                totalSpentSum += expSnap.docs.reduce((sum, e) => sum + (e.data().amount || 0), 0);
            }
            const overallUtil = totalAllocated > 0 ? ((totalSpentSum / totalAllocated) * 100).toFixed(2) : '0';
            doc.fontSize(10).fillColor('#0f172a').text(`Total Budgets: ${snapshot.docs.length}   |   Total Allocated: Rs. ${totalAllocated.toLocaleString('en-IN')}   |   Total Spent: Rs. ${totalSpentSum.toLocaleString('en-IN')} (${overallUtil}%)`);
            doc.moveDown(0.8);
            for (const bDoc of snapshot.docs) {
                const b = bDoc.data();
                const expSnap = await db.collection('expenditures')
                    .where('budgetId', '==', bDoc.id)
                    .where('status', 'in', ['RECORDED', 'VERIFIED'])
                    .get();
                const totalSpent = expSnap.docs.reduce((sum, e) => sum + (e.data().amount || 0), 0);
                const util = utilizationService_1.UtilizationService.calculateUtilization(b.allocatedAmount || 0, b.approvedAmount || 0, totalSpent);
                if (doc.y > 700) {
                    doc.addPage();
                }
                doc.fontSize(10).fillColor('#1e40af').text(`[${b.budgetId || bDoc.id}] ${b.projectScheme} (${b.financialYear} - ${b.quarter})`);
                doc.fontSize(9).fillColor('#334155').text(`Department: ${b.department?.name || b.departmentName || 'N/A'} | Status: ${b.status}`);
                doc.fontSize(9).fillColor('#475569').text(`Allocated: Rs. ${(b.allocatedAmount || 0).toLocaleString('en-IN')}  |  Spent: Rs. ${totalSpent.toLocaleString('en-IN')}  |  Remaining: Rs. ${util.remainingAmount.toLocaleString('en-IN')}  |  Utilization: ${util.utilizationPercentage}% (${util.band})`);
                doc.moveDown(0.5);
                doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
                doc.moveDown(0.5);
            }
            doc.end();
        });
    }
}
exports.ReportService = ReportService;
//# sourceMappingURL=reportService.js.map