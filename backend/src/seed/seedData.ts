import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../models/User';
import { Department } from '../models/Department';
import { Budget } from '../models/Budget';
import { Expenditure } from '../models/Expenditure';
import { Alert } from '../models/Alert';
import { AuditLog } from '../models/AuditLog';
import { SystemConfiguration } from '../models/SystemConfiguration';
import { AnomalyEngine } from '../detection/anomalyEngine';

export const seedInitialData = async (): Promise<void> => {
  try {
    console.log('[Seeder] Cleaning existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Budget.deleteMany({}),
      Expenditure.deleteMany({}),
      Alert.deleteMany({}),
      AuditLog.deleteMany({}),
      SystemConfiguration.deleteMany({}),
    ]);

    console.log('[Seeder] Creating System Configuration...');
    const config = await SystemConfiguration.create({
      underUtilizationThresholdPercent: 40,
      underUtilizationTimeElapsedThresholdPercent: 70,
      overspendingThresholdPercent: 100,
      spendingSpikeMultiplier: 1.5,
      budgetDeviationThresholdPercent: 15,
      autoRunDetectionOnExpenditure: true,
      alertNotificationEmail: 'finance-directorate@gov.in',
    });

    console.log('[Seeder] Creating Departments...');
    const depts = await Department.insertMany([
      {
        code: 'MEITY',
        name: 'Ministry of Electronics & Information Technology',
        description: 'Oversees digital governance, semiconductor missions, AI compute nodes, and cybersecurity programs.',
        headOfDepartment: 'Dr. Alok Verma, Joint Secretary',
        contactEmail: 'js.meity@gov.in',
        contactPhone: '+91 11 2436 0199',
        status: 'ACTIVE',
      },
      {
        code: 'MOHFW',
        name: 'Department of Health & Family Welfare',
        description: 'Manages national healthcare infrastructure, medical colleges, telemedicine grids, and emergency supplies.',
        headOfDepartment: 'Dr. Sunita Deshmukh, Director General',
        contactEmail: 'dg.health@gov.in',
        contactPhone: '+91 11 2306 1825',
        status: 'ACTIVE',
      },
      {
        code: 'MHRD',
        name: 'Department of Higher Education',
        description: 'Funds central universities, IIT/IIM research wings, digital libraries, and national scholarships.',
        headOfDepartment: 'Prof. Rajeshwar Rao, Advisor',
        contactEmail: 'adv.edu@gov.in',
        contactPhone: '+91 11 2338 3452',
        status: 'ACTIVE',
      },
      {
        code: 'MORTH',
        name: 'Ministry of Road Transport & Highways',
        description: 'Constructs expressways, economic corridors, strategic border roads, and smart tolling infrastructure.',
        headOfDepartment: 'Er. Vikramaditya Rathore, Chief Engineer',
        contactEmail: 'ce.morth@gov.in',
        contactPhone: '+91 11 2371 4501',
        status: 'ACTIVE',
      },
      {
        code: 'AGRI',
        name: 'Department of Agriculture & Farmers Welfare',
        description: 'Implements micro-irrigation schemes, crop insurance subsidies, soil health card labs, and cold storage.',
        headOfDepartment: 'Shri R. K. Shrivastava, Commissioner',
        contactEmail: 'comm.agri@gov.in',
        contactPhone: '+91 11 2338 1500',
        status: 'ACTIVE',
      },
    ]);

    const meityDept = depts[0];
    const mohfwDept = depts[1];
    const mhrdDept = depts[2];
    const morthDept = depts[3];
    const agriDept = depts[4];

    console.log('[Seeder] Creating Users with hashed passwords...');
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('Admin@123', salt);
    const financePass = await bcrypt.hash('Finance@123', salt);
    const deptPass = await bcrypt.hash('Dept@123', salt);

    const users = await User.insertMany([
      {
        name: 'Rajiv Malhotra (Chief Administrator)',
        email: 'admin@gov.in',
        passwordHash: adminPass,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      {
        name: 'Sneha Kulkarni (Chief Financial Officer)',
        email: 'finance@gov.in',
        passwordHash: financePass,
        role: 'FINANCE_OFFICER',
        status: 'ACTIVE',
      },
      {
        name: 'Dr. Alok Verma (Head - MEITY)',
        email: 'depthead.it@gov.in',
        passwordHash: deptPass,
        role: 'DEPARTMENT_HEAD',
        department: meityDept._id,
        status: 'ACTIVE',
      },
      {
        name: 'Dr. Sunita Deshmukh (Head - Health)',
        email: 'depthead.health@gov.in',
        passwordHash: deptPass,
        role: 'DEPARTMENT_HEAD',
        department: mohfwDept._id,
        status: 'ACTIVE',
      },
      {
        name: 'Prof. Rajeshwar Rao (Head - Higher Education)',
        email: 'depthead.edu@gov.in',
        passwordHash: deptPass,
        role: 'DEPARTMENT_HEAD',
        department: mhrdDept._id,
        status: 'ACTIVE',
      },
    ]);

    const adminUser = users[0];
    const financeUser = users[1];

    console.log('[Seeder] Creating Realistic Government Budgets...');
    const currentFY = '2025-26';

    const budgets = await Budget.insertMany([
      // 1. MEITY - Normal utilization (~62%)
      {
        budgetId: 'BDG-202526-MEITY-001',
        financialYear: currentFY,
        quarter: 'ANNUAL',
        department: meityDept._id,
        projectScheme: 'Digital Public Infrastructure & AI GPU Compute Cloud',
        allocatedAmount: 125000000, // 12.5 Cr
        approvedAmount: 125000000,
        allocationDate: new Date('2025-04-01'),
        status: 'ALLOCATED',
        description: 'Procurement of high-density GPU server clusters and cloud infrastructure for national research labs.',
        createdBy: adminUser._id,
      },
      // 2. MOHFW - Overspending Scenario (>105% of approved budget)
      {
        budgetId: 'BDG-202526-MOHFW-002',
        financialYear: currentFY,
        quarter: 'ANNUAL',
        department: mohfwDept._id,
        projectScheme: 'Emergency Medical Equipment & Critical Care Upgrades',
        allocatedAmount: 85000000, // 8.5 Cr
        approvedAmount: 85000000,
        allocationDate: new Date('2025-04-01'),
        status: 'ALLOCATED',
        description: 'Installation of automated ICU ventilators, MRI imaging suites, and oxygen distribution networks.',
        createdBy: adminUser._id,
      },
      // 3. MHRD - Under-utilization Scenario (< 20% utilization past 70% FY)
      {
        budgetId: 'BDG-202526-MHRD-003',
        financialYear: currentFY,
        quarter: 'ANNUAL',
        department: mhrdDept._id,
        projectScheme: 'Centre of Excellence in Quantum Computing Research',
        allocatedAmount: 95000000, // 9.5 Cr
        approvedAmount: 95000000,
        allocationDate: new Date('2025-04-01'),
        status: 'ALLOCATED',
        description: 'Establishment of multi-institutional quantum algorithm labs and fellowship grants.',
        createdBy: adminUser._id,
      },
      // 4. MORTH - Spending Spike Scenario (Large sudden capital disbursement)
      {
        budgetId: 'BDG-202526-MORTH-004',
        financialYear: currentFY,
        quarter: 'ANNUAL',
        department: morthDept._id,
        projectScheme: 'Western Green Express Highway - Smart Toll Infrastructure',
        allocatedAmount: 210000000, // 21.0 Cr
        approvedAmount: 210000000,
        allocationDate: new Date('2025-04-01'),
        status: 'ALLOCATED',
        description: 'Construction of RFID multi-lane free-flow gantry systems, weigh-in-motion sensors, and automated surveillance.',
        createdBy: adminUser._id,
      },
      // 5. AGRI - Normal Healthy Progress (~68%)
      {
        budgetId: 'BDG-202526-AGRI-005',
        financialYear: currentFY,
        quarter: 'ANNUAL',
        department: agriDept._id,
        projectScheme: 'National Micro-Irrigation & Drone Soil Sampling Mission',
        allocatedAmount: 68000000, // 6.8 Cr
        approvedAmount: 68000000,
        allocationDate: new Date('2025-04-01'),
        status: 'ALLOCATED',
        description: 'Subsidies for drip irrigation grids and solar pump micro-controllers across drought-prone districts.',
        createdBy: adminUser._id,
      },
    ]);

    const meityBdg = budgets[0];
    const mohfwBdg = budgets[1];
    const mhrdBdg = budgets[2];
    const morthBdg = budgets[3];
    const agriBdg = budgets[4];

    console.log('[Seeder] Creating Realistic Expenditure Transactions...');
    const expenditures = await Expenditure.insertMany([
      // MEITY expenditures: total ~ 77,500,000 (~62%)
      {
        transactionId: 'TXN-2025-MEITY-01',
        budget: meityBdg._id,
        department: meityDept._id,
        amount: 32000000,
        category: 'CAPITAL',
        transactionDate: new Date('2025-05-15'),
        vendorPayee: 'Bharat Electronics Ltd (BEL)',
        description: 'Procurement of 16-node Supercomputing Server Rack Cluster with liquid cooling.',
        status: 'VERIFIED',
        recordedBy: financeUser._id,
      },
      {
        transactionId: 'TXN-2025-MEITY-02',
        budget: meityBdg._id,
        department: meityDept._id,
        amount: 24500000,
        category: 'PROCUREMENT',
        transactionDate: new Date('2025-07-22'),
        vendorPayee: 'National Informatics Centre Services Inc.',
        description: 'Enterprise SDN optical switches and high-speed multi-terabit interconnects.',
        status: 'VERIFIED',
        recordedBy: financeUser._id,
      },
      {
        transactionId: 'TXN-2025-MEITY-03',
        budget: meityBdg._id,
        department: meityDept._id,
        amount: 21000000,
        category: 'INFRASTRUCTURE',
        transactionDate: new Date('2025-10-10'),
        vendorPayee: 'Tata Communications Data Center Solutions',
        description: 'Tier-IV Colocation data center lease and uninterrupted green energy integration.',
        status: 'RECORDED',
        recordedBy: financeUser._id,
      },

      // MOHFW expenditures: total 91,200,000 (exceeds 85,000,000 budget -> Overspending!)
      {
        transactionId: 'TXN-2025-MOHFW-01',
        budget: mohfwBdg._id,
        department: mohfwDept._id,
        amount: 38000000,
        category: 'CAPITAL',
        transactionDate: new Date('2025-05-10'),
        vendorPayee: 'Siemens Healthineers India Ltd.',
        description: 'Dual-source 128-slice CT Scanner and advanced cardiology diagnostics setup.',
        status: 'VERIFIED',
        recordedBy: financeUser._id,
      },
      {
        transactionId: 'TXN-2025-MOHFW-02',
        budget: mohfwBdg._id,
        department: mohfwDept._id,
        amount: 32500000,
        category: 'PROCUREMENT',
        transactionDate: new Date('2025-08-14'),
        vendorPayee: 'Philips Medical Systems',
        description: '50 units of high-flow motorized intensive care beds with central telemetry.',
        status: 'VERIFIED',
        recordedBy: financeUser._id,
      },
      {
        transactionId: 'TXN-2025-MOHFW-03',
        budget: mohfwBdg._id,
        department: mohfwDept._id,
        amount: 20700000,
        category: 'OPERATIONAL',
        transactionDate: new Date('2025-11-20'),
        vendorPayee: 'Cryogenic Gas Logistics Corp',
        description: 'Emergency liquid medical oxygen tank refurbishment and supply contingency.',
        status: 'RECORDED',
        recordedBy: financeUser._id,
      },

      // MHRD expenditures: total 14,500,000 out of 95,000,000 (~15.2% -> Under-utilization!)
      {
        transactionId: 'TXN-2025-MHRD-01',
        budget: mhrdBdg._id,
        department: mhrdDept._id,
        amount: 8500000,
        category: 'OPERATIONAL',
        transactionDate: new Date('2025-06-18'),
        vendorPayee: 'Indian Institute of Science (IISc)',
        description: 'Initial architectural blueprint and feasibility review for quantum chamber.',
        status: 'VERIFIED',
        recordedBy: financeUser._id,
      },
      {
        transactionId: 'TXN-2025-MHRD-02',
        budget: mhrdBdg._id,
        department: mhrdDept._id,
        amount: 6000000,
        category: 'TRAINING',
        transactionDate: new Date('2025-09-05'),
        vendorPayee: 'C-DAC Supercomputing Mission',
        description: 'Postdoctoral fellowship workshops on Qiskit and quantum cryogenic engineering.',
        status: 'RECORDED',
        recordedBy: financeUser._id,
      },

      // MORTH expenditures: 4 regular small/medium expenses + 1 massive spike!
      {
        transactionId: 'TXN-2025-MORTH-01',
        budget: morthBdg._id,
        department: morthDept._id,
        amount: 12000000,
        category: 'INFRASTRUCTURE',
        transactionDate: new Date('2025-04-25'),
        vendorPayee: 'Larsen & Toubro Tollways Div',
        description: 'Gantry foundation civil works and lane barrier sensor installation.',
        status: 'VERIFIED',
        recordedBy: financeUser._id,
      },
      {
        transactionId: 'TXN-2025-MORTH-02',
        budget: morthBdg._id,
        department: morthDept._id,
        amount: 14500000,
        category: 'PROCUREMENT',
        transactionDate: new Date('2025-06-30'),
        vendorPayee: 'Schneider Electric Infrastructure',
        description: 'Substation transformers, backup industrial UPS, and solar microgrid arrays.',
        status: 'VERIFIED',
        recordedBy: financeUser._id,
      },
      {
        transactionId: 'TXN-2025-MORTH-03',
        budget: morthBdg._id,
        department: morthDept._id,
        amount: 11000000,
        category: 'OPERATIONAL',
        transactionDate: new Date('2025-08-18'),
        vendorPayee: 'Indian Highways Management Co (IHMCL)',
        description: 'FASTag API integration, cloud hosting, and cryptographic key HSM modules.',
        status: 'VERIFIED',
        recordedBy: financeUser._id,
      },
      {
        transactionId: 'TXN-2025-MORTH-04',
        budget: morthBdg._id,
        department: morthDept._id,
        amount: 13000000,
        category: 'MAINTENANCE',
        transactionDate: new Date('2025-10-12'),
        vendorPayee: 'NHAI Road Safety Maintenance Cell',
        description: 'Routine sensor calibration, lane markings, and optical fiber patch repairs.',
        status: 'VERIFIED',
        recordedBy: financeUser._id,
      },
      // Massive Spike transaction (3.5x higher than ~12.6M average)
      {
        transactionId: 'TXN-2025-MORTH-05',
        budget: morthBdg._id,
        department: morthDept._id,
        amount: 58000000,
        category: 'CAPITAL',
        transactionDate: new Date('2025-12-05'),
        vendorPayee: 'Bharat Heavy Electricals Limited (BHEL)',
        description: 'Urgent emergency turnkey supply of 8 heavy-duty mobile weigh-in-motion bridge sensor platforms.',
        status: 'RECORDED',
        recordedBy: financeUser._id,
      },

      // AGRI expenditures: total 46,000,000 out of 68,000,000 (~67.6%)
      {
        transactionId: 'TXN-2025-AGRI-01',
        budget: agriBdg._id,
        department: agriDept._id,
        amount: 22000000,
        category: 'PROCUREMENT',
        transactionDate: new Date('2025-05-20'),
        vendorPayee: 'Jain Irrigation Systems Ltd.',
        description: 'Subsidized distribution of 15,000 precision drip irrigation emitter units.',
        status: 'VERIFIED',
        recordedBy: financeUser._id,
      },
      {
        transactionId: 'TXN-2025-AGRI-02',
        budget: agriBdg._id,
        department: agriDept._id,
        amount: 15000000,
        category: 'CAPITAL',
        transactionDate: new Date('2025-08-10'),
        vendorPayee: 'Garuda Aerospace Drone Systems',
        description: '50 hyperspectral agricultural survey drones with GPS payload telemetry.',
        status: 'VERIFIED',
        recordedBy: financeUser._id,
      },
      {
        transactionId: 'TXN-2025-AGRI-03',
        budget: agriBdg._id,
        department: agriDept._id,
        amount: 9000000,
        category: 'TRAINING',
        transactionDate: new Date('2025-11-04'),
        vendorPayee: 'State Agricultural Extension Services',
        description: 'Farmer cluster training on soil health dashboard mobile app and fertilizer dosage.',
        status: 'RECORDED',
        recordedBy: financeUser._id,
      },
    ]);

    console.log('[Seeder] Running AI Analytical Anomaly Detection Scan...');
    const scanResult = await AnomalyEngine.runFullScan();
    console.log(`[Seeder] Anomaly Detection Generated ${scanResult.alertsGenerated} alerts.`);

    console.log('[Seeder] Creating Initial Audit Logs...');
    await AuditLog.insertMany([
      {
        user: adminUser._id,
        userEmail: adminUser.email,
        userRole: adminUser.role,
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'SYSTEM',
        entityId: 'SYSTEM_BOOT',
        newValue: { note: 'Initial system boot and seeding of demonstration budget data.' },
        ipAddress: '127.0.0.1',
        userAgent: 'SeederScript/1.0',
        timestamp: new Date('2025-04-01T09:00:00Z'),
      },
      {
        user: adminUser._id,
        userEmail: adminUser.email,
        userRole: adminUser.role,
        action: 'BUDGET_ANNUAL_ALLOCATION',
        entityType: 'BUDGET',
        entityId: (meityBdg._id as any).toString(),
        newValue: { budgetId: meityBdg.budgetId, amount: meityBdg.allocatedAmount },
        ipAddress: '127.0.0.1',
        userAgent: 'SeederScript/1.0',
        timestamp: new Date('2025-04-01T10:30:00Z'),
      },
      {
        user: financeUser._id,
        userEmail: financeUser.email,
        userRole: financeUser.role,
        action: 'EXPENDITURE_DISBURSEMENT',
        entityType: 'EXPENDITURE',
        entityId: 'TXN-2025-MOHFW-03',
        newValue: { amount: 20700000, vendor: 'Cryogenic Gas Logistics Corp' },
        ipAddress: '127.0.0.1',
        userAgent: 'SeederScript/1.0',
        timestamp: new Date('2025-11-20T14:15:00Z'),
      },
    ]);

    console.log('✅ Realistic sample datasets seeded successfully.');
    console.log('====================================================');
    console.log('DEMO ACCOUNTS:');
    console.log('1. Admin:           admin@gov.in          / Admin@123');
    console.log('2. Finance Officer: finance@gov.in        / Finance@123');
    console.log('3. Dept Head (IT):  depthead.it@gov.in    / Dept@123');
    console.log('4. Dept Head (Hlth):depthead.health@gov.in/ Dept@123');
    console.log('5. Dept Head (Edu): depthead.edu@gov.in   / Dept@123');
    console.log('====================================================');
  } catch (err) {
    console.error('[Seeder] Error seeding initial data:', err);
    throw err;
  }
};

// If run directly via CLI `npm run seed`
if (require.main === module) {
  const { connectDB, closeDB } = require('../config/db');
  connectDB()
    .then(() => seedInitialData())
    .then(() => {
      console.log('[Seeder] Script finished.');
      return closeDB();
    })
    .catch((err: any) => {
      console.error('[Seeder] Failed:', err);
      process.exit(1);
    });
}
