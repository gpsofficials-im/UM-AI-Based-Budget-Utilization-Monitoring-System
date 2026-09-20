import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AnomalyEngine } from './anomaly/anomalyEngine';
import { ReportService } from './services/reportService';
import { seedInitialFirestoreData } from './seed/seedData';

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

/**
 * Callable Function: Trigger Full Anomaly Detection Scan
 */
export const runAnomalyScan = functions.https.onCall(async (data: any, context: any) => {
  // Support both v1 (context.auth) and v2 (data.auth)
  const authContext = context?.auth || (data as any)?.auth;
  if (!authContext) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to run anomaly detection.');
  }
  try {
    const result = await AnomalyEngine.runFullScan(db);
    return { success: true, data: result };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Callable Function: Assign Role & Custom Claims to User
 */
export const setUserRole = functions.https.onCall(async (data: any, context: any) => {
  const authContext = context?.auth || (data as any)?.auth;
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
  } catch (err: any) {
    throw new functions.https.HttpsError('internal', err.message);
  }
});

/**
 * Callable Function: Seed Initial Demonstration Datasets
 */
export const seedInitialData = functions.https.onCall(async () => {
  try {
    const res = await seedInitialFirestoreData(db, auth);
    return res;
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * HTTP Function: Generate PDF / CSV Report
 */
export const generateReport = functions.https.onRequest(async (req, res) => {
  try {
    const { reportType, format, departmentId, financialYear, category, severity } = req.query;
    const filters = { departmentId, financialYear, category, severity };

    if (format === 'csv') {
      const csvData = await ReportService.generateBudgetCSV(db, filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType || 'budget'}-report.csv"`);
      res.status(200).send(csvData);
      return;
    }

    const pdfBuffer = await ReportService.generateBudgetPDFBuffer(db, filters);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType || 'budget'}-report.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
