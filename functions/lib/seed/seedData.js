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
exports.seedInitialFirestoreData = void 0;
const admin = __importStar(require("firebase-admin"));
const seedInitialFirestoreData = async (db, auth) => {
    const batch = db.batch();
    // 1. Config
    const configRef = db.collection('config').doc('system');
    batch.set(configRef, {
        underUtilizationThresholdPercent: 40,
        underUtilizationTimeElapsedThresholdPercent: 70,
        overspendingThresholdPercent: 100,
        spendingSpikeMultiplier: 1.5,
        budgetDeviationThresholdPercent: 15,
        autoRunDetectionOnExpenditure: true,
        alertNotificationEmail: 'finance-directorate@gov.in',
    });
    // 2. Departments
    const depts = [
        {
            id: 'DEPT_MEITY',
            code: 'MEITY',
            name: 'Ministry of Electronics & Information Technology',
            description: 'Oversees digital governance, semiconductor missions, AI compute nodes, and cybersecurity programs.',
            headOfDepartment: 'Dr. Alok Verma, Joint Secretary',
            contactEmail: 'js.meity@gov.in',
            contactPhone: '+91 11 2436 0199',
            status: 'ACTIVE',
        },
        {
            id: 'DEPT_MOHFW',
            code: 'MOHFW',
            name: 'Department of Health & Family Welfare',
            description: 'Manages national healthcare infrastructure, medical colleges, telemedicine grids, and emergency supplies.',
            headOfDepartment: 'Dr. Sunita Deshmukh, Director General',
            contactEmail: 'dg.health@gov.in',
            contactPhone: '+91 11 2306 1825',
            status: 'ACTIVE',
        },
        {
            id: 'DEPT_MHRD',
            code: 'MHRD',
            name: 'Department of Higher Education',
            description: 'Funds central universities, IIT/IIM research wings, digital libraries, and national scholarships.',
            headOfDepartment: 'Prof. Rajeshwar Rao, Advisor',
            contactEmail: 'adv.edu@gov.in',
            contactPhone: '+91 11 2338 3452',
            status: 'ACTIVE',
        },
        {
            id: 'DEPT_MORTH',
            code: 'MORTH',
            name: 'Ministry of Road Transport & Highways',
            description: 'Constructs expressways, economic corridors, strategic border roads, and smart tolling infrastructure.',
            headOfDepartment: 'Er. Vikramaditya Rathore, Chief Engineer',
            contactEmail: 'ce.morth@gov.in',
            contactPhone: '+91 11 2371 4501',
            status: 'ACTIVE',
        },
        {
            id: 'DEPT_AGRI',
            code: 'AGRI',
            name: 'Department of Agriculture & Farmers Welfare',
            description: 'Implements micro-irrigation schemes, crop insurance subsidies, soil health card labs, and cold storage.',
            headOfDepartment: 'Shri R. K. Shrivastava, Commissioner',
            contactEmail: 'comm.agri@gov.in',
            contactPhone: '+91 11 2338 1500',
            status: 'ACTIVE',
        },
    ];
    for (const d of depts) {
        const docRef = db.collection('departments').doc(d.id);
        batch.set(docRef, d);
    }
    // 3. Demo Users
    const demoUsers = [
        {
            email: 'admin@gov.in',
            name: 'Dr. Vikram Malhotra',
            role: 'ADMIN',
            status: 'ACTIVE',
            departmentId: null,
            department: null,
        },
        {
            email: 'finance@gov.in',
            name: 'Pooja Sundaram, ICAS',
            role: 'FINANCE_OFFICER',
            status: 'ACTIVE',
            departmentId: null,
            department: null,
        },
        {
            email: 'depthead.it@gov.in',
            name: 'Dr. Alok Verma',
            role: 'DEPARTMENT_HEAD',
            status: 'ACTIVE',
            departmentId: 'DEPT_MEITY',
            department: { id: 'DEPT_MEITY', name: 'Ministry of Electronics & Information Technology', code: 'MEITY' },
        },
        {
            email: 'depthead.health@gov.in',
            name: 'Dr. Sunita Deshmukh',
            role: 'DEPARTMENT_HEAD',
            status: 'ACTIVE',
            departmentId: 'DEPT_MOHFW',
            department: { id: 'DEPT_MOHFW', name: 'Department of Health & Family Welfare', code: 'MOHFW' },
        },
        {
            email: 'depthead.edu@gov.in',
            name: 'Prof. Rajeshwar Rao',
            role: 'DEPARTMENT_HEAD',
            status: 'ACTIVE',
            departmentId: 'DEPT_MHRD',
            department: { id: 'DEPT_MHRD', name: 'Department of Higher Education', code: 'MHRD' },
        },
    ];
    // Try creating/syncing auth users
    for (const u of demoUsers) {
        let uid = `user_${u.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        try {
            const userRecord = await auth.getUserByEmail(u.email);
            uid = userRecord.uid;
            await auth.setCustomUserClaims(uid, { role: u.role, departmentId: u.departmentId });
        }
        catch (err) {
            if (err.code === 'auth/user-not-found') {
                try {
                    const pass = u.role === 'ADMIN' ? 'Admin@123' : u.role === 'FINANCE_OFFICER' ? 'Finance@123' : 'Dept@123';
                    const newUser = await auth.createUser({
                        uid,
                        email: u.email,
                        password: pass,
                        displayName: u.name,
                    });
                    await auth.setCustomUserClaims(newUser.uid, { role: u.role, departmentId: u.departmentId });
                }
                catch (createErr) {
                    console.warn(`Could not create Auth user for ${u.email}:`, createErr);
                }
            }
        }
        const userDocRef = db.collection('users').doc(uid);
        batch.set(userDocRef, {
            ...u,
            uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    // 4. Budgets
    const sampleBudgets = [
        {
            id: 'BDG-2025-001',
            budgetId: 'BDG-2025-001',
            financialYear: '2025-26',
            quarter: 'Q2',
            departmentId: 'DEPT_MEITY',
            department: { id: 'DEPT_MEITY', name: 'Ministry of Electronics & Information Technology', code: 'MEITY' },
            projectScheme: 'National AI Compute Grid & High-Performance Cloud Cluster',
            allocatedAmount: 185000000,
            approvedAmount: 185000000,
            totalSpent: 98000000,
            remainingAmount: 87000000,
            utilizationPercentage: 52.97,
            band: 'NORMAL',
            bandLabel: 'Normal Utilization (40% - 79%)',
            allocationDate: '2025-07-01',
            status: 'ALLOCATED',
            description: 'Procurement of 512 GPU accelerators and dedicated dark fiber interconnects for academic AI compute.',
        },
        {
            id: 'BDG-2025-002',
            budgetId: 'BDG-2025-002',
            financialYear: '2025-26',
            quarter: 'Q2',
            departmentId: 'DEPT_MOHFW',
            department: { id: 'DEPT_MOHFW', name: 'Department of Health & Family Welfare', code: 'MOHFW' },
            projectScheme: 'District Hospital ICU Modernization & Tele-ICU Command Links',
            allocatedAmount: 64000000,
            approvedAmount: 64000000,
            totalSpent: 73500000,
            remainingAmount: -9500000,
            utilizationPercentage: 114.84,
            band: 'OVERSPENDING',
            bandLabel: 'Overspending (>= 100%)',
            allocationDate: '2025-07-01',
            status: 'ALLOCATED',
            description: 'Overspending demonstration scheme for critical emergency equipment.',
        },
        {
            id: 'BDG-2025-003',
            budgetId: 'BDG-2025-003',
            financialYear: '2025-26',
            quarter: 'Q2',
            departmentId: 'DEPT_MHRD',
            department: { id: 'DEPT_MHRD', name: 'Department of Higher Education', code: 'MHRD' },
            projectScheme: 'IIT & Central University Digital Research Repository',
            allocatedAmount: 120000000,
            approvedAmount: 120000000,
            totalSpent: 18500000,
            remainingAmount: 101500000,
            utilizationPercentage: 15.42,
            band: 'LOW',
            bandLabel: 'Low Utilization (< 40%)',
            allocationDate: '2025-07-01',
            status: 'ALLOCATED',
            description: 'Under-utilization demonstration scheme with delayed procurement.',
        },
        {
            id: 'BDG-2025-004',
            budgetId: 'BDG-2025-004',
            financialYear: '2025-26',
            quarter: 'Q2',
            departmentId: 'DEPT_MORTH',
            department: { id: 'DEPT_MORTH', name: 'Ministry of Road Transport & Highways', code: 'MORTH' },
            projectScheme: 'National Highway Intelligent Toll Management & FASTag 3.0',
            allocatedAmount: 220000000,
            approvedAmount: 220000000,
            totalSpent: 165000000,
            remainingAmount: 55000000,
            utilizationPercentage: 75.0,
            band: 'NORMAL',
            bandLabel: 'Normal Utilization (40% - 79%)',
            allocationDate: '2025-07-01',
            status: 'ALLOCATED',
            description: 'Multi-lane free flow AI vision cameras and radar sensing gantries.',
        },
        {
            id: 'BDG-2025-005',
            budgetId: 'BDG-2025-005',
            financialYear: '2025-26',
            quarter: 'Q2',
            departmentId: 'DEPT_AGRI',
            department: { id: 'DEPT_AGRI', name: 'Department of Agriculture & Farmers Welfare', code: 'AGRI' },
            projectScheme: 'PM Micro-Irrigation & Solar Water Pump Subsidies',
            allocatedAmount: 95000000,
            approvedAmount: 95000000,
            totalSpent: 42000000,
            remainingAmount: 53000000,
            utilizationPercentage: 44.21,
            band: 'NORMAL',
            bandLabel: 'Normal Utilization (40% - 79%)',
            allocationDate: '2025-07-01',
            status: 'ALLOCATED',
            description: 'Direct DBT subsidy distribution for solar water pumps and drip irrigation.',
        },
    ];
    for (const b of sampleBudgets) {
        batch.set(db.collection('budgets').doc(b.id), {
            ...b,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    // 5. Expenditures
    const sampleExpenses = [
        {
            id: 'TXN-2025-101',
            transactionId: 'TXN-2025-101',
            budgetId: 'BDG-2025-001',
            budget: { id: 'BDG-2025-001', projectScheme: 'National AI Compute Grid & High-Performance Cloud Cluster' },
            departmentId: 'DEPT_MEITY',
            department: { id: 'DEPT_MEITY', name: 'Ministry of Electronics & Information Technology', code: 'MEITY' },
            amount: 45000000,
            category: 'INFRASTRUCTURE',
            transactionDate: '2025-07-15',
            vendorPayee: 'Centre for Development of Advanced Computing (C-DAC)',
            description: 'Phase-1 Server racks, liquid cooling modules, and UPS power distribution.',
            status: 'VERIFIED',
        },
        {
            id: 'TXN-2025-102',
            transactionId: 'TXN-2025-102',
            budgetId: 'BDG-2025-001',
            budget: { id: 'BDG-2025-001', projectScheme: 'National AI Compute Grid & High-Performance Cloud Cluster' },
            departmentId: 'DEPT_MEITY',
            department: { id: 'DEPT_MEITY', name: 'Ministry of Electronics & Information Technology', code: 'MEITY' },
            amount: 53000000,
            category: 'PROCUREMENT',
            transactionDate: '2025-08-20',
            vendorPayee: 'National Informatics Centre Services Inc. (NICSI)',
            description: 'Procurement of GPU accelerator cards and InfiniBand optical switches.',
            status: 'VERIFIED',
        },
        {
            id: 'TXN-2025-103',
            transactionId: 'TXN-2025-103',
            budgetId: 'BDG-2025-002',
            budget: { id: 'BDG-2025-002', projectScheme: 'District Hospital ICU Modernization & Tele-ICU Command Links' },
            departmentId: 'DEPT_MOHFW',
            department: { id: 'DEPT_MOHFW', name: 'Department of Health & Family Welfare', code: 'MOHFW' },
            amount: 73500000,
            category: 'CAPITAL',
            transactionDate: '2025-08-10',
            vendorPayee: 'HLL Lifecare Limited',
            description: 'Emergency procurement of 120 Ventilators and Multi-parameter ICU monitors.',
            status: 'RECORDED',
        },
        {
            id: 'TXN-2025-104',
            transactionId: 'TXN-2025-104',
            budgetId: 'BDG-2025-003',
            budget: { id: 'BDG-2025-003', projectScheme: 'IIT & Central University Digital Research Repository' },
            departmentId: 'DEPT_MHRD',
            department: { id: 'DEPT_MHRD', name: 'Department of Higher Education', code: 'MHRD' },
            amount: 18500000,
            category: 'OPERATIONAL',
            transactionDate: '2025-07-28',
            vendorPayee: 'INFLIBNET Centre',
            description: 'National digital academic e-journal subscription & indexing licenses.',
            status: 'VERIFIED',
        },
        {
            id: 'TXN-2025-105',
            transactionId: 'TXN-2025-105',
            budgetId: 'BDG-2025-004',
            budget: { id: 'BDG-2025-004', projectScheme: 'National Highway Intelligent Toll Management & FASTag 3.0' },
            departmentId: 'DEPT_MORTH',
            department: { id: 'DEPT_MORTH', name: 'Ministry of Road Transport & Highways', code: 'MORTH' },
            amount: 165000000,
            category: 'INFRASTRUCTURE',
            transactionDate: '2025-08-05',
            vendorPayee: 'Indian Highways Management Company Limited (IHMCL)',
            description: 'High-speed ANPR camera sensors and RFID gantry installations.',
            status: 'VERIFIED',
        },
    ];
    for (const exp of sampleExpenses) {
        batch.set(db.collection('expenditures').doc(exp.id), {
            ...exp,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    // 6. Alerts
    const sampleAlerts = [
        {
            id: 'ALT-MOHFW-001',
            alertId: 'ALT-MOHFW-001',
            departmentId: 'DEPT_MOHFW',
            department: { id: 'DEPT_MOHFW', name: 'Department of Health & Family Welfare', code: 'MOHFW' },
            budgetId: 'BDG-2025-002',
            budget: { id: 'BDG-2025-002', projectScheme: 'District Hospital ICU Modernization & Tele-ICU Command Links' },
            alertType: 'OVERSPENDING',
            severity: 'CRITICAL',
            title: 'Overspending Detected: Department of Health & Family Welfare (District Hospital ICU Modernization)',
            description: 'Total expenditure (Rs. 7,35,00,000) has exceeded approved budget limit of Rs. 6,40,00,000 by Rs. 95,00,000 (114.8% of approved budget).',
            detectedValue: 114.84,
            threshold: 100,
            status: 'OPEN',
        },
        {
            id: 'ALT-MHRD-002',
            alertId: 'ALT-MHRD-002',
            departmentId: 'DEPT_MHRD',
            department: { id: 'DEPT_MHRD', name: 'Department of Higher Education', code: 'MHRD' },
            budgetId: 'BDG-2025-003',
            budget: { id: 'BDG-2025-003', projectScheme: 'IIT & Central University Digital Research Repository' },
            alertType: 'UNDER_UTILIZATION',
            severity: 'MEDIUM',
            title: 'Under-Utilization Risk: Department of Higher Education (IIT & Central University Digital Research)',
            description: '70% of financial period has elapsed, but only 15.4% of allocated funds (Rs. 1,85,00,000 / Rs. 12,00,00,000) have been deployed.',
            detectedValue: 15.42,
            threshold: 40,
            status: 'OPEN',
        },
    ];
    for (const alt of sampleAlerts) {
        batch.set(db.collection('alerts').doc(alt.id), {
            ...alt,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    // 7. Initial Audit Log
    const initialAuditRef = db.collection('auditLogs').doc();
    batch.set(initialAuditRef, {
        userEmail: 'system@gov.in',
        userRole: 'SYSTEM',
        action: 'SYSTEM_BOOTSTRAP',
        entityType: 'SYSTEM',
        entityId: 'SYSTEM',
        newValue: { status: 'INITIALIZED_FIRESTORE_DATASETS' },
        timestamp: new Date().toISOString(),
    });
    await batch.commit();
    return { success: true, message: 'Seeded Firestore collections successfully' };
};
exports.seedInitialFirestoreData = seedInitialFirestoreData;
//# sourceMappingURL=seedData.js.map