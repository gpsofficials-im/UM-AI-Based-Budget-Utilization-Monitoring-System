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
exports.generateReport = exports.seedInitialData = exports.setUserRole = exports.runAnomalyScan = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const anomalyEngine_1 = require("./anomaly/anomalyEngine");
const reportService_1 = require("./services/reportService");
const seedData_1 = require("./seed/seedData");
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
/**
 * Callable Function: Trigger Full Anomaly Detection Scan
 */
exports.runAnomalyScan = functions.https.onCall(async (data, context) => {
    // Support both v1 (context.auth) and v2 (data.auth)
    const authContext = context?.auth || data?.auth;
    if (!authContext) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to run anomaly detection.');
    }
    try {
        const result = await anomalyEngine_1.AnomalyEngine.runFullScan(db);
        return { success: true, data: result };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Callable Function: Assign Role & Custom Claims to User
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
    const authContext = context?.auth || data?.auth;
    if (!authContext) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const callerClaims = authContext.token || {};
    if (callerClaims.role !== 'ADMIN' && callerClaims.email !== 'admin@gov.in') {
        throw new functions.https.HttpsError('permission-denied', 'Only ADMIN can assign officer roles.');
    }
    const payload = data?.data ? data.data : data;
    const { targetUid, role, departmentId } = payload;
    if (!targetUid || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing targetUid or role.');
    }
    try {
        await auth.setCustomUserClaims(targetUid, { role, departmentId: departmentId || null });
        await db.collection('users').doc(targetUid).set({ role, departmentId: departmentId || null }, { merge: true });
        // Log to Audit Log
        await db.collection('auditLogs').add({
            userEmail: callerClaims.email || 'admin@gov.in',
            userRole: callerClaims.role || 'ADMIN',
            action: 'UPDATE_USER_ROLE',
            entityType: 'USER',
            entityId: targetUid,
            newValue: { role, departmentId },
            timestamp: new Date().toISOString(),
        });
        return { success: true, message: `Updated role for ${targetUid} to ${role}` };
    }
    catch (err) {
        throw new functions.https.HttpsError('internal', err.message);
    }
});
/**
 * Callable Function: Seed Initial Demonstration Datasets
 */
exports.seedInitialData = functions.https.onCall(async () => {
    try {
        const res = await (0, seedData_1.seedInitialFirestoreData)(db, auth);
        return res;
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * HTTP Function: Generate PDF / CSV Report
 */
exports.generateReport = functions.https.onRequest(async (req, res) => {
    try {
        const { reportType, format, departmentId, financialYear, category, severity } = req.query;
        const filters = { departmentId, financialYear, category, severity };
        if (format === 'csv') {
            const csvData = await reportService_1.ReportService.generateBudgetCSV(db, filters);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${reportType || 'budget'}-report.csv"`);
            res.status(200).send(csvData);
            return;
        }
        const pdfBuffer = await reportService_1.ReportService.generateBudgetPDFBuffer(db, filters);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType || 'budget'}-report.pdf"`);
        res.status(200).send(pdfBuffer);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//# sourceMappingURL=index.js.map