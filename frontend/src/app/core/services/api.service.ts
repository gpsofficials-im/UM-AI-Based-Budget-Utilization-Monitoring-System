import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Department,
  Budget,
  Expenditure,
  Alert,
  AuditLog,
  SystemConfiguration,
  DashboardSummary,
  User,
} from '../models';
import { FirestoreService } from './firestore.service';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(
    private firestoreService: FirestoreService,
    private storageService: StorageService,
    private authService: AuthService
  ) {
    this.ensureInitialData();
  }

  private async ensureInitialData(): Promise<void> {
    try {
      const depts = await this.firestoreService.getCollection<Department>('departments');
      if (depts.length === 0) {
        await this.seedData();
      }
    } catch (e) {
      console.warn('Initial data bootstrap check:', e);
    }
  }
  public async seedData(): Promise<void> {
    const sampleDepts: Department[] = [
      {
        id: 'DEPT_MEITY',
        _id: 'DEPT_MEITY',
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
        _id: 'DEPT_MOHFW',
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
        _id: 'DEPT_MHRD',
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
        _id: 'DEPT_MORTH',
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
        _id: 'DEPT_AGRI',
        code: 'AGRI',
        name: 'Department of Agriculture & Farmers Welfare',
        description: 'Implements micro-irrigation schemes, crop insurance subsidies, soil health card labs, and cold storage.',
        headOfDepartment: 'Shri R. K. Shrivastava, Commissioner',
        contactEmail: 'comm.agri@gov.in',
        contactPhone: '+91 11 2338 1500',
        status: 'ACTIVE',
      },
    ];

    for (const d of sampleDepts) {
      await this.firestoreService.setDocument('departments', d.id!, d);
    }

    const sampleBudgets: Budget[] = [
      {
        id: 'BDG-2025-001',
        _id: 'BDG-2025-001',
        budgetId: 'BDG-2025-001',
        financialYear: '2025-26',
        quarter: 'Q2',
        departmentId: 'DEPT_MEITY',
        department: sampleDepts[0],
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
        _id: 'BDG-2025-002',
        budgetId: 'BDG-2025-002',
        financialYear: '2025-26',
        quarter: 'Q2',
        departmentId: 'DEPT_MOHFW',
        department: sampleDepts[1],
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
        _id: 'BDG-2025-003',
        budgetId: 'BDG-2025-003',
        financialYear: '2025-26',
        quarter: 'Q2',
        departmentId: 'DEPT_MHRD',
        department: sampleDepts[2],
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
        _id: 'BDG-2025-004',
        budgetId: 'BDG-2025-004',
        financialYear: '2025-26',
        quarter: 'Q2',
        departmentId: 'DEPT_MORTH',
        department: sampleDepts[3],
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
        _id: 'BDG-2025-005',
        budgetId: 'BDG-2025-005',
        financialYear: '2025-26',
        quarter: 'Q2',
        departmentId: 'DEPT_AGRI',
        department: sampleDepts[4],
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
      await this.firestoreService.setDocument('budgets', b.id!, b);
    }
    const sampleExpenses: Expenditure[] = [
      {
        id: 'TXN-2025-101',
        _id: 'TXN-2025-101',
        transactionId: 'TXN-2025-101',
        budgetId: 'BDG-2025-001',
        budget: sampleBudgets[0],
        departmentId: 'DEPT_MEITY',
        department: sampleDepts[0],
        amount: 45000000,
        category: 'INFRASTRUCTURE',
        transactionDate: '2025-07-15',
        vendorPayee: 'Centre for Development of Advanced Computing (C-DAC)',
        description: 'Phase-1 Server racks, liquid cooling modules, and UPS power distribution.',
        status: 'VERIFIED',
      },
      {
        id: 'TXN-2025-102',
        _id: 'TXN-2025-102',
        transactionId: 'TXN-2025-102',
        budgetId: 'BDG-2025-001',
        budget: sampleBudgets[0],
        departmentId: 'DEPT_MEITY',
        department: sampleDepts[0],
        amount: 53000000,
        category: 'PROCUREMENT',
        transactionDate: '2025-08-20',
        vendorPayee: 'National Informatics Centre Services Inc. (NICSI)',
        description: 'Procurement of GPU accelerator cards and InfiniBand optical switches.',
        status: 'VERIFIED',
      },
      {
        id: 'TXN-2025-103',
        _id: 'TXN-2025-103',
        transactionId: 'TXN-2025-103',
        budgetId: 'BDG-2025-002',
        budget: sampleBudgets[1],
        departmentId: 'DEPT_MOHFW',
        department: sampleDepts[1],
        amount: 73500000,
        category: 'CAPITAL',
        transactionDate: '2025-08-10',
        vendorPayee: 'HLL Lifecare Limited',
        description: 'Emergency procurement of 120 Ventilators and Multi-parameter ICU monitors.',
        status: 'RECORDED',
      },
      {
        id: 'TXN-2025-104',
        _id: 'TXN-2025-104',
        transactionId: 'TXN-2025-104',
        budgetId: 'BDG-2025-003',
        budget: sampleBudgets[2],
        departmentId: 'DEPT_MHRD',
        department: sampleDepts[2],
        amount: 18500000,
        category: 'OPERATIONAL',
        transactionDate: '2025-07-28',
        vendorPayee: 'INFLIBNET Centre',
        description: 'National digital academic e-journal subscription & indexing licenses.',
        status: 'VERIFIED',
      },
      {
        id: 'TXN-2025-105',
        _id: 'TXN-2025-105',
        transactionId: 'TXN-2025-105',
        budgetId: 'BDG-2025-004',
        budget: sampleBudgets[3],
        departmentId: 'DEPT_MORTH',
        department: sampleDepts[3],
        amount: 165000000,
        category: 'INFRASTRUCTURE',
        transactionDate: '2025-08-05',
        vendorPayee: 'Indian Highways Management Company Limited (IHMCL)',
        description: 'High-speed ANPR camera sensors and RFID gantry installations.',
        status: 'VERIFIED',
      },
    ];

    for (const exp of sampleExpenses) {
      await this.firestoreService.setDocument('expenditures', exp.id!, exp);
    }

    const sampleAlerts: Alert[] = [
      {
        id: 'ALT-MOHFW-001',
        _id: 'ALT-MOHFW-001',
        alertId: 'ALT-MOHFW-001',
        departmentId: 'DEPT_MOHFW',
        department: sampleDepts[1],
        budgetId: 'BDG-2025-002',
        budget: sampleBudgets[1],
        alertType: 'OVERSPENDING',
        severity: 'CRITICAL',
        title: 'Overspending Detected: Department of Health & Family Welfare (District Hospital ICU Modernization)',
        description: 'Total expenditure (Rs. 7,35,00,000) has exceeded approved budget limit of Rs. 6,40,00,000 by Rs. 95,00,000 (114.8% of approved budget).',
        detectedValue: 114.84,
        threshold: 100,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ALT-MHRD-002',
        _id: 'ALT-MHRD-002',
        alertId: 'ALT-MHRD-002',
        departmentId: 'DEPT_MHRD',
        department: sampleDepts[2],
        budgetId: 'BDG-2025-003',
        budget: sampleBudgets[2],
        alertType: 'UNDER_UTILIZATION',
        severity: 'MEDIUM',
        title: 'Under-Utilization Risk: Department of Higher Education (IIT & Central University Digital Research)',
        description: '70% of financial period has elapsed, but only 15.4% of allocated funds (Rs. 1,85,00,000 / Rs. 12,00,00,000) have been deployed.',
        detectedValue: 15.42,
        threshold: 40,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const alt of sampleAlerts) {
      await this.firestoreService.setDocument('alerts', alt.id!, alt);
    }

    await this.firestoreService.setDocument('config', 'system', {
      underUtilizationThresholdPercent: 40,
      underUtilizationTimeElapsedThresholdPercent: 70,
      overspendingThresholdPercent: 100,
      spendingSpikeMultiplier: 1.5,
      budgetDeviationThresholdPercent: 15,
      autoRunDetectionOnExpenditure: true,
      alertNotificationEmail: 'finance-directorate@gov.in',
    });
  }
  // --- DASHBOARD ---
  public getDashboardSummary(financialYear?: string, departmentId?: string): Observable<any> {
    return from(this.calculateDashboardSummary(financialYear, departmentId)).pipe(
      map((summary) => ({ success: true, data: summary }))
    );
  }

  private async calculateDashboardSummary(financialYear?: string, departmentId?: string): Promise<DashboardSummary> {
    let budgets = await this.firestoreService.getCollection<Budget>('budgets');
    let expenditures = await this.firestoreService.getCollection<Expenditure>('expenditures');
    let alerts = await this.firestoreService.getCollection<Alert>('alerts');
    const departments = await this.firestoreService.getCollection<Department>('departments');

    const user = this.authService.currentUser();
    const isDeptHead = this.authService.isDeptHead();
    const userDeptId = user?.departmentId || (user?.department ? (typeof user.department === 'object' ? (user.department as any)._id || (user.department as any).id : user.department) : null);

    if (isDeptHead && userDeptId) {
      budgets = budgets.filter((b) => b.departmentId === userDeptId || b.department?._id === userDeptId || b.department?.id === userDeptId);
      expenditures = expenditures.filter((e) => e.departmentId === userDeptId || e.department?._id === userDeptId || e.department?.id === userDeptId);
      alerts = alerts.filter((a) => a.departmentId === userDeptId || a.department?._id === userDeptId || a.department?.id === userDeptId);
    } else if (departmentId && departmentId !== 'ALL') {
      budgets = budgets.filter((b) => b.departmentId === departmentId || b.department?._id === departmentId || b.department?.id === departmentId);
      expenditures = expenditures.filter((e) => e.departmentId === departmentId || e.department?._id === departmentId || e.department?.id === departmentId);
      alerts = alerts.filter((a) => a.departmentId === departmentId || a.department?._id === departmentId || a.department?.id === departmentId);
    }

    if (financialYear && financialYear !== 'ALL') {
      budgets = budgets.filter((b) => b.financialYear === financialYear);
      const budgetIds = new Set(budgets.map((b) => b._id || b.id || ''));
      expenditures = expenditures.filter((e) => budgetIds.has(e.budgetId || e.budget?._id || ''));
    }

    const totalBudget = budgets.reduce((acc, b) => acc + (b.allocatedAmount || 0), 0);
    const totalApproved = budgets.reduce((acc, b) => acc + (b.approvedAmount || 0), 0);
    const totalSpent = expenditures.reduce((acc, e) => acc + (e.amount || 0), 0);
    const remainingBudget = totalBudget - totalSpent;
    const utilizationPercentage = totalBudget > 0 ? Math.round(((totalSpent / totalBudget) * 100 + Number.EPSILON) * 100) / 100 : 0;

    let utilizationBand = 'NORMAL';
    let utilizationBandLabel = 'Normal Utilization (40% - 79%)';
    if (utilizationPercentage < 40) {
      utilizationBand = 'LOW';
      utilizationBandLabel = 'Low Utilization (< 40%)';
    } else if (utilizationPercentage < 80) {
      utilizationBand = 'NORMAL';
      utilizationBandLabel = 'Normal Utilization (40% - 79%)';
    } else if (utilizationPercentage < 100) {
      utilizationBand = 'HIGH';
      utilizationBandLabel = 'High Utilization (80% - 99%)';
    } else {
      utilizationBand = 'OVERSPENDING';
      utilizationBandLabel = 'Overspending (>= 100%)';
    }

    const openAlerts = alerts.filter((a) => a.status === 'OPEN');
    const criticalAlerts = openAlerts.filter((a) => a.severity === 'CRITICAL');

    let underUtilizedCount = 0;
    let overspendingCount = 0;
    for (const b of budgets) {
      const bSpent = expenditures
        .filter((e) => (e.budgetId || e.budget?._id || e.budget?.id) === (b.id || b._id))
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const bPct = b.allocatedAmount > 0 ? (bSpent / b.allocatedAmount) * 100 : 0;
      if (bPct < 40) underUtilizedCount++;
      if (bSpent > b.approvedAmount) overspendingCount++;
    }

    return {
      totalBudget,
      totalApproved,
      totalSpent,
      remainingBudget,
      utilizationPercentage,
      utilizationBand,
      utilizationBandLabel,
      totalDepartments: departments.length,
      activeAlerts: openAlerts.length,
      criticalAlerts: criticalAlerts.length,
      totalAnomalies: openAlerts.length,
      underUtilizedCount,
      overspendingCount,
    };
  }

  public getDashboardTrends(financialYear?: string, departmentId?: string): Observable<any> {
    return from(this.calculateDashboardTrends(financialYear, departmentId)).pipe(
      map((data) => ({ success: true, data }))
    );
  }

  private async calculateDashboardTrends(financialYear?: string, departmentId?: string): Promise<any> {
    let expenditures = await this.firestoreService.getCollection<Expenditure>('expenditures');
    const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const monthlyData: Record<string, number> = {};
    monthNames.forEach((m) => (monthlyData[m] = 0));

    const monthMap = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const user = this.authService.currentUser();
    const isDeptHead = this.authService.isDeptHead();
    const userDeptId = user?.departmentId || (user?.department ? (typeof user.department === 'object' ? (user.department as any)._id || (user.department as any).id : user.department) : null);

    if (isDeptHead && userDeptId) {
      expenditures = expenditures.filter((e) => e.departmentId === userDeptId || e.department?._id === userDeptId || e.department?.id === userDeptId);
    } else if (departmentId && departmentId !== 'ALL') {
      expenditures = expenditures.filter((e) => e.departmentId === departmentId || e.department?._id === departmentId || e.department?.id === departmentId);
    }

    for (const exp of expenditures) {
      if (!exp.transactionDate) continue;
      const date = new Date(exp.transactionDate);
      const m = monthMap[date.getMonth()];
      if (monthlyData[m] !== undefined) {
        monthlyData[m] += (exp.amount || 0);
      }
    }

    return {
      labels: monthNames,
      datasets: [
        {
          label: 'Monthly Expenditure (INR)',
          data: monthNames.map((m) => monthlyData[m]),
        },
      ],
    };
  }
  public getDashboardDepartments(financialYear?: string): Observable<any> {
    return from(this.calculateDashboardDepartments(financialYear)).pipe(
      map((data) => ({ success: true, data }))
    );
  }

  private async calculateDashboardDepartments(financialYear?: string): Promise<any[]> {
    const departments = await this.firestoreService.getCollection<Department>('departments');
    const budgets = await this.firestoreService.getCollection<Budget>('budgets');
    const expenditures = await this.firestoreService.getCollection<Expenditure>('expenditures');
    const alerts = await this.firestoreService.getCollection<Alert>('alerts');

    return departments.map((dept) => {
      const deptId = dept.id || dept._id;
      let deptBudgets = budgets.filter((b) => b.departmentId === deptId || b.department?._id === deptId || b.department?.id === deptId);
      if (financialYear && financialYear !== 'ALL') {
        deptBudgets = deptBudgets.filter((b) => b.financialYear === financialYear);
      }

      const allocated = deptBudgets.reduce((acc, b) => acc + (b.allocatedAmount || 0), 0);
      const approved = deptBudgets.reduce((acc, b) => acc + (b.approvedAmount || 0), 0);

      const deptExpenses = expenditures.filter((e) => e.departmentId === deptId || e.department?._id === deptId || e.department?.id === deptId);
      const spent = deptExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
      const remaining = allocated - spent;
      const utilPct = allocated > 0 ? Math.round(((spent / allocated) * 100 + Number.EPSILON) * 100) / 100 : 0;

      let band = 'NORMAL';
      let bandLabel = 'Normal Utilization (40% - 79%)';
      if (utilPct < 40) {
        band = 'LOW';
        bandLabel = 'Low Utilization (< 40%)';
      } else if (utilPct < 80) {
        band = 'NORMAL';
        bandLabel = 'Normal Utilization (40% - 79%)';
      } else if (utilPct < 100) {
        band = 'HIGH';
        bandLabel = 'High Utilization (80% - 99%)';
      } else {
        band = 'OVERSPENDING';
        bandLabel = 'Overspending (>= 100%)';
      }

      const activeAlerts = alerts.filter((a) => (a.departmentId === deptId || a.department?._id === deptId || a.department?.id === deptId) && a.status === 'OPEN').length;

      return {
        departmentId: deptId,
        departmentCode: dept.code,
        departmentName: dept.name,
        allocatedAmount: allocated,
        approvedAmount: approved,
        totalExpenditure: spent,
        remainingAmount: remaining,
        utilizationPercentage: utilPct,
        band,
        bandLabel,
        activeAlerts,
      };
    });
  }

  public getDashboardCategories(financialYear?: string, departmentId?: string): Observable<any> {
    return from(this.calculateDashboardCategories(financialYear, departmentId)).pipe(
      map((data) => ({ success: true, data }))
    );
  }

  private async calculateDashboardCategories(financialYear?: string, departmentId?: string): Promise<any> {
    let expenditures = await this.firestoreService.getCollection<Expenditure>('expenditures');
    const categories = [
      'CAPITAL',
      'OPERATIONAL',
      'PROCUREMENT',
      'SALARY',
      'INFRASTRUCTURE',
      'TRAINING',
      'MAINTENANCE',
      'OTHER',
    ];
    const catSums: Record<string, number> = {};
    categories.forEach((c) => (catSums[c] = 0));

    const user = this.authService.currentUser();
    const isDeptHead = this.authService.isDeptHead();
    const userDeptId = user?.departmentId || (user?.department ? (typeof user.department === 'object' ? (user.department as any)._id || (user.department as any).id : user.department) : null);

    if (isDeptHead && userDeptId) {
      expenditures = expenditures.filter((e) => e.departmentId === userDeptId || e.department?._id === userDeptId || e.department?.id === userDeptId);
    } else if (departmentId && departmentId !== 'ALL') {
      expenditures = expenditures.filter((e) => e.departmentId === departmentId || e.department?._id === departmentId || e.department?.id === departmentId);
    }

    for (const e of expenditures) {
      if (catSums[e.category] !== undefined) {
        catSums[e.category] += (e.amount || 0);
      } else {
        catSums[e.category] = (e.amount || 0);
      }
    }

    return {
      labels: categories,
      data: categories.map((c) => catSums[c]),
    };
  }

  public getDashboardAlertsDistribution(): Observable<any> {
    return from(this.calculateAlertsDistribution()).pipe(
      map((data) => ({ success: true, data }))
    );
  }

  private async calculateAlertsDistribution(): Promise<any> {
    let alerts = await this.firestoreService.getCollection<Alert>('alerts');
    const user = this.authService.currentUser();
    const isDeptHead = this.authService.isDeptHead();
    const userDeptId = user?.departmentId || (user?.department ? (typeof user.department === 'object' ? (user.department as any)._id || (user.department as any).id : user.department) : null);

    if (isDeptHead && userDeptId) {
      alerts = alerts.filter((a) => a.departmentId === userDeptId || a.department?._id === userDeptId || a.department?.id === userDeptId);
    }

    const openAlerts = alerts.filter((a) => a.status === 'OPEN');
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    openAlerts.forEach((a) => {
      if (counts[a.severity] !== undefined) counts[a.severity]++;
    });

    return {
      labels: severities,
      data: severities.map((s) => counts[s]),
    };
  }

  // --- DEPARTMENTS ---
  public getDepartments(): Observable<any> {
    return from(this.firestoreService.getCollection<Department>('departments')).pipe(
      map((depts) => ({
        success: true,
        data: depts.map((d) => ({ ...d, _id: d.id || d._id })),
      }))
    );
  }

  public getDepartmentById(id: string): Observable<any> {
    return from(this.firestoreService.getDocument<Department>('departments', id)).pipe(
      map((dept) => ({ success: true, data: dept ? { ...dept, _id: dept.id || dept._id } : null }))
    );
  }

  public createDepartment(dept: Partial<Department>): Observable<any> {
    const id = `DEPT_${dept.code?.toUpperCase() || Date.now()}`;
    const newDept: Department = {
      id,
      _id: id,
      code: dept.code?.toUpperCase() || '',
      name: dept.name || '',
      description: dept.description || '',
      headOfDepartment: dept.headOfDepartment || '',
      contactEmail: dept.contactEmail || '',
      contactPhone: dept.contactPhone || '',
      status: dept.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    return from(this.firestoreService.setDocument('departments', id, newDept)).pipe(
      map(() => {
        this.logAudit('CREATE_DEPARTMENT', 'DEPARTMENT', id, newDept);
        return { success: true, data: newDept };
      })
    );
  }

  public updateDepartment(id: string, dept: Partial<Department>): Observable<any> {
    return from(this.firestoreService.updateDocument('departments', id, dept)).pipe(
      map(() => {
        this.logAudit('UPDATE_DEPARTMENT', 'DEPARTMENT', id, dept);
        return { success: true, data: { ...dept, _id: id } };
      })
    );
  }

  public deleteDepartment(id: string): Observable<any> {
    return from(this.firestoreService.deleteDocument('departments', id)).pipe(
      map(() => {
        this.logAudit('DELETE_DEPARTMENT', 'DEPARTMENT', id, null);
        return { success: true };
      })
    );
  }
  // --- BUDGETS ---
  public getBudgets(filters: any = {}): Observable<any> {
    return from(this.fetchFilteredBudgets(filters)).pipe(
      map((budgets) => ({ success: true, data: budgets }))
    );
  }

  private async fetchFilteredBudgets(filters: any): Promise<Budget[]> {
    let budgets = await this.firestoreService.getCollection<Budget>('budgets');
    const expenditures = await this.firestoreService.getCollection<Expenditure>('expenditures');

    const user = this.authService.currentUser();
    const isDeptHead = this.authService.isDeptHead();
    const userDeptId = user?.departmentId || (user?.department ? (typeof user.department === 'object' ? (user.department as any)._id || (user.department as any).id : user.department) : null);

    if (isDeptHead && userDeptId) {
      budgets = budgets.filter((b) => b.departmentId === userDeptId || b.department?._id === userDeptId || b.department?.id === userDeptId);
    } else if (filters.departmentId && filters.departmentId !== 'ALL') {
      budgets = budgets.filter((b) => b.departmentId === filters.departmentId || b.department?._id === filters.departmentId || b.department?.id === filters.departmentId);
    }

    if (filters.financialYear && filters.financialYear !== 'ALL') {
      budgets = budgets.filter((b) => b.financialYear === filters.financialYear);
    }
    if (filters.quarter && filters.quarter !== 'ALL') {
      budgets = budgets.filter((b) => b.quarter === filters.quarter);
    }
    if (filters.status && filters.status !== 'ALL') {
      budgets = budgets.filter((b) => b.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      budgets = budgets.filter((b) => b.projectScheme.toLowerCase().includes(q) || b.budgetId.toLowerCase().includes(q));
    }

    return budgets.map((b) => {
      const bId = b.id || b._id;
      const bExpenses = expenditures.filter((e) => (e.budgetId || e.budget?._id || e.budget?.id) === bId);
      const totalSpent = bExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const remainingAmount = (b.allocatedAmount || 0) - totalSpent;
      const utilPct = b.allocatedAmount > 0 ? Math.round(((totalSpent / b.allocatedAmount) * 100 + Number.EPSILON) * 100) / 100 : 0;

      let band = 'NORMAL';
      let bandLabel = 'Normal Utilization (40% - 79%)';
      if (utilPct < 40) {
        band = 'LOW';
        bandLabel = 'Low Utilization (< 40%)';
      } else if (utilPct < 80) {
        band = 'NORMAL';
        bandLabel = 'Normal Utilization (40% - 79%)';
      } else if (utilPct < 100) {
        band = 'HIGH';
        bandLabel = 'High Utilization (80% - 99%)';
      } else {
        band = 'OVERSPENDING';
        bandLabel = 'Overspending (>= 100%)';
      }

      return {
        ...b,
        _id: bId,
        totalSpent,
        remainingAmount,
        utilizationPercentage: utilPct,
        band,
        bandLabel,
        expensesCount: bExpenses.length,
      };
    });
  }

  public getBudgetById(id: string): Observable<any> {
    return from(this.firestoreService.getDocument<Budget>('budgets', id)).pipe(
      map((b) => ({ success: true, data: b ? { ...b, _id: b.id || b._id } : null }))
    );
  }

  public createBudget(budget: Partial<Budget>): Observable<any> {
    const id = `BDG-${Date.now().toString().slice(-6)}`;
    const newBudget: Budget = {
      id,
      _id: id,
      budgetId: budget.budgetId || id,
      financialYear: budget.financialYear || '2025-26',
      quarter: budget.quarter || 'ANNUAL',
      departmentId: budget.departmentId || (budget.department ? (typeof budget.department === 'object' ? (budget.department as any)._id || (budget.department as any).id : budget.department) : ''),
      department: budget.department as any,
      projectScheme: budget.projectScheme || '',
      allocatedAmount: Number(budget.allocatedAmount) || 0,
      approvedAmount: Number(budget.approvedAmount) || Number(budget.allocatedAmount) || 0,
      allocationDate: budget.allocationDate || new Date().toISOString().split('T')[0],
      status: budget.status || 'ALLOCATED',
      description: budget.description || '',
      createdAt: new Date().toISOString(),
    };
    return from(this.firestoreService.setDocument('budgets', id, newBudget)).pipe(
      map(() => {
        this.logAudit('CREATE_BUDGET', 'BUDGET', id, newBudget);
        this.runLocalAnomalyScan();
        return { success: true, data: newBudget };
      })
    );
  }

  public updateBudget(id: string, budget: Partial<Budget>): Observable<any> {
    return from(this.firestoreService.updateDocument('budgets', id, budget)).pipe(
      map(() => {
        this.logAudit('UPDATE_BUDGET', 'BUDGET', id, budget);
        this.runLocalAnomalyScan();
        return { success: true, data: { ...budget, _id: id } };
      })
    );
  }

  public deleteBudget(id: string): Observable<any> {
    return from(this.firestoreService.deleteDocument('budgets', id)).pipe(
      map(() => {
        this.logAudit('DELETE_BUDGET', 'BUDGET', id, null);
        return { success: true };
      })
    );
  }

  // --- EXPENDITURES ---
  public getExpenditures(filters: any = {}): Observable<any> {
    return from(this.fetchFilteredExpenditures(filters)).pipe(
      map((expenditures) => ({ success: true, data: expenditures }))
    );
  }

  private async fetchFilteredExpenditures(filters: any): Promise<Expenditure[]> {
    let expenditures = await this.firestoreService.getCollection<Expenditure>('expenditures');
    const user = this.authService.currentUser();
    const isDeptHead = this.authService.isDeptHead();
    const userDeptId = user?.departmentId || (user?.department ? (typeof user.department === 'object' ? (user.department as any)._id || (user.department as any).id : user.department) : null);

    if (isDeptHead && userDeptId) {
      expenditures = expenditures.filter((e) => e.departmentId === userDeptId || e.department?._id === userDeptId || e.department?.id === userDeptId);
    } else if (filters.departmentId && filters.departmentId !== 'ALL') {
      expenditures = expenditures.filter((e) => e.departmentId === filters.departmentId || e.department?._id === filters.departmentId || e.department?.id === filters.departmentId);
    }

    if (filters.category && filters.category !== 'ALL') {
      expenditures = expenditures.filter((e) => e.category === filters.category);
    }
    if (filters.status && filters.status !== 'ALL') {
      expenditures = expenditures.filter((e) => e.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      expenditures = expenditures.filter(
        (e) =>
          e.vendorPayee.toLowerCase().includes(q) ||
          e.transactionId.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }

    return expenditures.map((e) => ({ ...e, _id: e.id || e._id }));
  }

  public createExpenditure(formData: FormData): Observable<any> {
    return from(this.saveExpenditureFromFormData(formData)).pipe(
      map((createdExp) => ({ success: true, data: createdExp }))
    );
  }

  private async saveExpenditureFromFormData(formData: FormData): Promise<Expenditure> {
    const budgetId = formData.get('budget') as string;
    const departmentId = formData.get('department') as string;
    const category = (formData.get('category') as any) || 'OPERATIONAL';
    const amount = Number(formData.get('amount')) || 0;
    const transactionDate = (formData.get('transactionDate') as string) || new Date().toISOString().split('T')[0];
    const vendorPayee = (formData.get('vendorPayee') as string) || '';
    const description = (formData.get('description') as string) || '';
    const file = formData.get('document') as File | null;

    const budget = await this.firestoreService.getDocument<Budget>('budgets', budgetId);
    const department = await this.firestoreService.getDocument<Department>('departments', departmentId);

    let supportingDocument = undefined;
    if (file && file.size > 0) {
      supportingDocument = await this.storageService.uploadReceipt(file, departmentId);
    }

    const id = `TXN-${Date.now().toString().slice(-6)}`;
    const newExp: Expenditure = {
      id,
      _id: id,
      transactionId: id,
      budgetId,
      budget: budget || ({ id: budgetId, _id: budgetId, projectScheme: 'Public Scheme' } as any),
      departmentId,
      department: department || ({ id: departmentId, _id: departmentId, name: 'Department' } as any),
      amount,
      category,
      transactionDate,
      vendorPayee,
      description,
      supportingDocument,
      status: 'VERIFIED',
      recordedBy: this.authService.currentUser() || undefined,
      createdAt: new Date().toISOString(),
    };

    await this.firestoreService.setDocument('expenditures', id, newExp);
    await this.logAudit('CREATE_EXPENDITURE', 'EXPENDITURE', id, newExp);
    await this.runLocalAnomalyScan();

    return newExp;
  }

  public updateExpenditure(id: string, formData: FormData): Observable<any> {
    return from(this.firestoreService.updateDocument('expenditures', id, {})).pipe(
      map(() => ({ success: true }))
    );
  }

  public deleteExpenditure(id: string): Observable<any> {
    return from(this.firestoreService.deleteDocument('expenditures', id)).pipe(
      map(() => {
        this.logAudit('DELETE_EXPENDITURE', 'EXPENDITURE', id, null);
        this.runLocalAnomalyScan();
        return { success: true };
      })
    );
  }

  public downloadExpenditureDocumentUrl(id: string): string {
    return '#';
  }
  // --- ALERTS & ANOMALY SCAN ---
  public getAlerts(filters: any = {}): Observable<any> {
    return from(this.fetchFilteredAlerts(filters)).pipe(
      map((alerts) => ({ success: true, data: alerts }))
    );
  }

  private async fetchFilteredAlerts(filters: any): Promise<Alert[]> {
    let alerts = await this.firestoreService.getCollection<Alert>('alerts');
    const user = this.authService.currentUser();
    const isDeptHead = this.authService.isDeptHead();
    const userDeptId = user?.departmentId || (user?.department ? (typeof user.department === 'object' ? (user.department as any)._id || (user.department as any).id : user.department) : null);

    if (isDeptHead && userDeptId) {
      alerts = alerts.filter((a) => a.departmentId === userDeptId || a.department?._id === userDeptId || a.department?.id === userDeptId);
    } else if (filters.departmentId && filters.departmentId !== 'ALL') {
      alerts = alerts.filter((a) => a.departmentId === filters.departmentId || a.department?._id === filters.departmentId || a.department?.id === filters.departmentId);
    }

    if (filters.status && filters.status !== 'ALL') {
      alerts = alerts.filter((a) => a.status === filters.status);
    }
    if (filters.severity && filters.severity !== 'ALL') {
      alerts = alerts.filter((a) => a.severity === filters.severity);
    }
    if (filters.alertType && filters.alertType !== 'ALL') {
      alerts = alerts.filter((a) => a.alertType === filters.alertType);
    }

    return alerts.map((a) => ({ ...a, _id: a.id || a._id }));
  }

  public acknowledgeAlert(id: string): Observable<any> {
    const user = this.authService.currentUser();
    const updateData = {
      status: 'ACKNOWLEDGED' as const,
      acknowledgedBy: user || undefined,
      acknowledgedAt: new Date().toISOString(),
    };
    return from(this.firestoreService.updateDocument('alerts', id, updateData)).pipe(
      map(() => {
        this.logAudit('ACKNOWLEDGE_ALERT', 'ALERT', id, updateData);
        return { success: true };
      })
    );
  }

  public resolveAlert(id: string, resolutionNotes: string): Observable<any> {
    const user = this.authService.currentUser();
    const updateData = {
      status: 'RESOLVED' as const,
      resolvedBy: user || undefined,
      resolvedAt: new Date().toISOString(),
      resolutionNotes,
    };
    return from(this.firestoreService.updateDocument('alerts', id, updateData)).pipe(
      map(() => {
        this.logAudit('RESOLVE_ALERT', 'ALERT', id, updateData);
        return { success: true };
      })
    );
  }

  public triggerAnomalyScan(): Observable<any> {
    return from(this.runLocalAnomalyScan()).pipe(
      map((result) => ({ success: true, data: result }))
    );
  }

  public async runLocalAnomalyScan(): Promise<any> {
    const budgets = await this.firestoreService.getCollection<Budget>('budgets');
    const expenditures = await this.firestoreService.getCollection<Expenditure>('expenditures');
    const configDoc = await this.firestoreService.getDocument<SystemConfiguration>('config', 'system');
    const config = configDoc || {
      underUtilizationThresholdPercent: 40,
      underUtilizationTimeElapsedThresholdPercent: 70,
      overspendingThresholdPercent: 100,
      spendingSpikeMultiplier: 1.5,
      budgetDeviationThresholdPercent: 15,
      autoRunDetectionOnExpenditure: true,
      alertNotificationEmail: 'finance@gov.in',
    };

    let generated = 0;
    for (const b of budgets) {
      const bId = b.id || b._id;
      const bExpenses = expenditures.filter((e) => (e.budgetId || e.budget?._id || e.budget?.id) === bId);
      const totalSpent = bExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      // Rule 1: Overspending
      if (totalSpent > b.approvedAmount) {
        const overspentRatio = Math.round(((totalSpent / b.approvedAmount) * 100 + Number.EPSILON) * 100) / 100;
        const alertId = `ALT-OV-${bId}`;
        await this.firestoreService.setDocument('alerts', alertId, {
          id: alertId,
          _id: alertId,
          alertId,
          departmentId: b.departmentId || b.department?._id || b.department?.id,
          department: b.department,
          budgetId: bId,
          budget: b,
          alertType: 'OVERSPENDING',
          severity: 'CRITICAL',
          title: `Overspending Detected: ${b.department?.name} (${b.projectScheme})`,
          description: `Total expenditure (Rs. ${totalSpent.toLocaleString('en-IN')}) has exceeded approved budget limit of Rs. ${b.approvedAmount.toLocaleString('en-IN')} (${overspentRatio}%).`,
          detectedValue: overspentRatio,
          threshold: config.overspendingThresholdPercent,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
        });
        generated++;
      }

      // Rule 2: Under-utilization
      const utilPct = b.allocatedAmount > 0 ? (totalSpent / b.allocatedAmount) * 100 : 0;
      if (utilPct < config.underUtilizationThresholdPercent && b.status === 'ALLOCATED') {
        const alertId = `ALT-UN-${bId}`;
        await this.firestoreService.setDocument('alerts', alertId, {
          id: alertId,
          _id: alertId,
          alertId,
          departmentId: b.departmentId || b.department?._id || b.department?.id,
          department: b.department,
          budgetId: bId,
          budget: b,
          alertType: 'UNDER_UTILIZATION',
          severity: 'MEDIUM',
          title: `Under-Utilization Risk: ${b.department?.name} (${b.projectScheme})`,
          description: `Only ${utilPct.toFixed(1)}% of allocated funds (Rs. ${totalSpent.toLocaleString('en-IN')} / Rs. ${b.allocatedAmount.toLocaleString('en-IN')}) have been deployed.`,
          detectedValue: Math.round(utilPct * 100) / 100,
          threshold: config.underUtilizationThresholdPercent,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
        });
        generated++;
      }
    }

    return { alertsGenerated: generated, scannedBudgets: budgets.length };
  }

  // --- USERS ---
  public getUsers(filters: any = {}): Observable<any> {
    return from(this.firestoreService.getCollection<User>('users')).pipe(
      map((users) => {
        let list = users.map((u) => ({ ...u, _id: u.id || u._id }));
        if (filters.role && filters.role !== 'ALL') {
          list = list.filter((u) => u.role === filters.role);
        }
        if (filters.departmentId && filters.departmentId !== 'ALL') {
          list = list.filter((u) => u.departmentId === filters.departmentId);
        }
        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        }
        return { success: true, data: list };
      })
    );
  }

  public createUser(user: any): Observable<any> {
    const id = `user_${Date.now()}`;
    const newUser: User = {
      id,
      _id: id,
      uid: id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || user.department,
      department: user.department,
      status: user.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    return from(this.firestoreService.setDocument('users', id, newUser)).pipe(
      map(() => {
        this.logAudit('CREATE_USER', 'USER', id, newUser);
        return { success: true, data: newUser };
      })
    );
  }

  public updateUser(id: string, user: any): Observable<any> {
    return from(this.firestoreService.updateDocument('users', id, user)).pipe(
      map(() => {
        this.logAudit('UPDATE_USER', 'USER', id, user);
        return { success: true, data: { ...user, _id: id } };
      })
    );
  }

  public deleteUser(id: string): Observable<any> {
    return from(this.firestoreService.deleteDocument('users', id)).pipe(
      map(() => {
        this.logAudit('DELETE_USER', 'USER', id, null);
        return { success: true };
      })
    );
  }

  // --- REPORTS ---
  public getBudgetReport(filters: any = {}): Observable<any> {
    return this.getBudgets(filters);
  }

  public downloadReport(
    reportType: 'budget' | 'expenditure' | 'anomalies',
    format: 'csv' | 'pdf',
    filters: any = {}
  ): Observable<Blob> {
    return from(this.generateClientReport(reportType, format, filters));
  }

  private async generateClientReport(
    reportType: 'budget' | 'expenditure' | 'anomalies',
    format: 'csv' | 'pdf',
    filters: any = {}
  ): Promise<Blob> {
    if (reportType === 'budget') {
      const budgets = await this.fetchFilteredBudgets(filters);
      if (format === 'csv') {
        const headers = ['Budget ID,Financial Year,Quarter,Department,Scheme,Allocated (INR),Approved (INR),Spent (INR),Remaining (INR),Utilization %,Status\n'];
        const rows = budgets.map(
          (b) =>
            `"${b.budgetId}","${b.financialYear}","${b.quarter}","${b.department?.name || ''}","${b.projectScheme}",${b.allocatedAmount},${b.approvedAmount},${b.totalSpent || 0},${b.remainingAmount || 0},${b.utilizationPercentage || 0}%,"${b.status}"`
        );
        return new Blob([headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
      } else {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Government Budget Utilization Monitoring System', 14, 15);
        doc.setFontSize(10);
        doc.text(`Official Budget Allocation & Utilization Report - Generated ${new Date().toLocaleString('en-IN')}`, 14, 22);

        autoTable(doc, {
          startY: 28,
          head: [['Budget ID', 'Dept', 'Scheme', 'Allocated (Rs)', 'Spent (Rs)', 'Utilization %', 'Status']],
          body: budgets.map((b) => [
            b.budgetId,
            b.department?.code || b.department?.name || '',
            b.projectScheme,
            (b.allocatedAmount || 0).toLocaleString('en-IN'),
            (b.totalSpent || 0).toLocaleString('en-IN'),
            `${b.utilizationPercentage || 0}%`,
            b.status,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 8 },
        });

        return doc.output('blob');
      }
    } else if (reportType === 'expenditure') {
      const expenses = await this.fetchFilteredExpenditures(filters);
      if (format === 'csv') {
        const headers = ['Transaction ID,Date,Department,Budget Scheme,Category,Vendor,Amount (INR),Status,Description\n'];
        const rows = expenses.map(
          (e) =>
            `"${e.transactionId}","${e.transactionDate}","${e.department?.name || ''}","${e.budget?.projectScheme || ''}","${e.category}","${e.vendorPayee}",${e.amount},"${e.status}","${e.description}"`
        );
        return new Blob([headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
      } else {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Expenditure Audit & Transaction Report', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 14, 22);

        autoTable(doc, {
          startY: 28,
          head: [['TX ID', 'Date', 'Dept', 'Category', 'Vendor', 'Amount (Rs)', 'Status']],
          body: expenses.map((e) => [
            e.transactionId,
            e.transactionDate,
            e.department?.name || '',
            e.category,
            e.vendorPayee,
            (e.amount || 0).toLocaleString('en-IN'),
            e.status,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [4, 120, 87] },
          styles: { fontSize: 8 },
        });

        return doc.output('blob');
      }
    } else {
      const alerts = await this.fetchFilteredAlerts(filters);
      if (format === 'csv') {
        const headers = ['Alert ID,Severity,Type,Department,Scheme,Title,Description,Detected Value,Threshold,Status\n'];
        const rows = alerts.map(
          (a) =>
            `"${a.alertId}","${a.severity}","${a.alertType}","${a.department?.name || ''}","${a.budget?.projectScheme || ''}","${a.title}","${a.description}",${a.detectedValue},${a.threshold},"${a.status}"`
        );
        return new Blob([headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
      } else {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Financial Irregularities & Anomaly Audit Report', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 14, 22);

        autoTable(doc, {
          startY: 28,
          head: [['Alert ID', 'Severity', 'Type', 'Department', 'Description', 'Status']],
          body: alerts.map((a) => [
            a.alertId,
            a.severity,
            a.alertType,
            a.department?.name || '',
            a.title,
            a.status,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [153, 27, 27] },
          styles: { fontSize: 8 },
        });

        return doc.output('blob');
      }
    }
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(filters: any = {}): Observable<any> {
    return from(this.firestoreService.getCollection<AuditLog>('auditLogs')).pipe(
      map((logs) => {
        let list = logs.map((l) => ({ ...l, _id: l.id || l._id }));
        if (filters.entityType && filters.entityType !== 'ALL') {
          list = list.filter((l) => l.entityType === filters.entityType);
        }
        if (filters.searchUser) {
          const q = filters.searchUser.toLowerCase();
          list = list.filter((l) => l.userEmail.toLowerCase().includes(q));
        }
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return { success: true, data: list };
      })
    );
  }

  private async logAudit(action: string, entityType: string, entityId: string, newValue: any): Promise<void> {
    const user = this.authService.currentUser();
    const id = `AUDIT-${Date.now()}`;
    const log: AuditLog = {
      id,
      _id: id,
      userEmail: user?.email || 'officer@gov.in',
      userRole: user?.role || 'OFFICER',
      action,
      entityType,
      entityId,
      newValue,
      timestamp: new Date().toISOString(),
    };
    try {
      await this.firestoreService.addDocument('auditLogs', log);
    } catch (e) {
      console.warn('Audit logging:', e);
    }
  }

  // --- CONFIG ---
  public getConfig(): Observable<any> {
    return from(this.firestoreService.getDocument<SystemConfiguration>('config', 'system')).pipe(
      map((cfg) => ({
        success: true,
        data:
          cfg || {
            underUtilizationThresholdPercent: 40,
            underUtilizationTimeElapsedThresholdPercent: 70,
            overspendingThresholdPercent: 100,
            spendingSpikeMultiplier: 1.5,
            budgetDeviationThresholdPercent: 15,
            autoRunDetectionOnExpenditure: true,
            alertNotificationEmail: 'finance-directorate@gov.in',
          },
      }))
    );
  }

  public updateConfig(config: Partial<SystemConfiguration>): Observable<any> {
    return from(this.firestoreService.setDocument('config', 'system', config)).pipe(
      map(() => {
        this.logAudit('UPDATE_CONFIG', 'CONFIG', 'system', config);
        return { success: true, data: config };
      })
    );
  }
}
