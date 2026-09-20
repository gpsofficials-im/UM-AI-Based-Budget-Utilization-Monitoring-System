export type UserRole = 'ADMIN' | 'FINANCE_OFFICER' | 'DEPARTMENT_HEAD';

export interface User {
  id?: string;
  _id: string;
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
  department?: Department | string | null;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
  createdAt?: string;
}

export interface Department {
  id?: string;
  _id: string;
  code: string;
  name: string;
  description?: string;
  headOfDepartment?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  financialSummary?: {
    totalBudgetsCount: number;
    allocatedAmount: number;
    approvedAmount: number;
    totalExpenditure: number;
    remainingAmount: number;
    utilizationPercentage: number;
    band: string;
    bandLabel: string;
    activeAlertsCount: number;
    activeAlerts?: Alert[];
  };
}

export type BudgetQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ANNUAL';
export type BudgetStatus = 'DRAFT' | 'APPROVED' | 'ALLOCATED' | 'REVISED' | 'CLOSED';

export interface Budget {
  id?: string;
  _id: string;
  budgetId: string;
  financialYear: string;
  quarter: BudgetQuarter;
  departmentId?: string;
  department: Department;
  projectScheme: string;
  allocatedAmount: number;
  approvedAmount: number;
  allocationDate: string;
  status: BudgetStatus;
  description?: string;
  createdBy?: User;
  totalSpent?: number;
  remainingAmount?: number;
  utilizationPercentage?: number;
  band?: string;
  bandLabel?: string;
  expensesCount?: number;
  createdAt?: string;
}

export type ExpenseCategory =
  | 'CAPITAL'
  | 'OPERATIONAL'
  | 'PROCUREMENT'
  | 'SALARY'
  | 'INFRASTRUCTURE'
  | 'TRAINING'
  | 'MAINTENANCE'
  | 'OTHER';

export type ExpenseStatus = 'RECORDED' | 'VERIFIED' | 'FLAGGED' | 'CANCELLED';

export interface SupportingDocument {
  originalName: string;
  filename?: string;
  path?: string;
  downloadUrl?: string;
  mimeType: string;
  size: number;
}

export interface Expenditure {
  id?: string;
  _id: string;
  transactionId: string;
  budgetId?: string;
  budget: Budget;
  departmentId?: string;
  department: Department;
  amount: number;
  category: ExpenseCategory;
  transactionDate: string;
  vendorPayee: string;
  description: string;
  supportingDocument?: SupportingDocument;
  status: ExpenseStatus;
  recordedBy?: User;
  createdAt?: string;
}

export type AlertType =
  | 'UNDER_UTILIZATION'
  | 'OVERSPENDING'
  | 'SPENDING_SPIKE'
  | 'BUDGET_DEVIATION';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  id?: string;
  _id: string;
  alertId: string;
  departmentId?: string;
  department: Department;
  budgetId?: string;
  budget?: Budget;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  detectedValue: number;
  threshold: number;
  status: AlertStatus;
  acknowledgedBy?: User;
  acknowledgedAt?: string;
  resolvedBy?: User;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface AuditLog {
  id?: string;
  _id: string;
  user?: User;
  userEmail: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface SystemConfiguration {
  id?: string;
  _id?: string;
  underUtilizationThresholdPercent: number;
  underUtilizationTimeElapsedThresholdPercent: number;
  overspendingThresholdPercent: number;
  spendingSpikeMultiplier: number;
  budgetDeviationThresholdPercent: number;
  autoRunDetectionOnExpenditure: boolean;
  alertNotificationEmail: string;
}

export interface DashboardSummary {
  totalBudget: number;
  totalApproved: number;
  totalSpent: number;
  remainingBudget: number;
  utilizationPercentage: number;
  utilizationBand: string;
  utilizationBandLabel: string;
  totalDepartments: number;
  activeAlerts: number;
  criticalAlerts: number;
  totalAnomalies: number;
  underUtilizedCount: number;
  overspendingCount: number;
}


