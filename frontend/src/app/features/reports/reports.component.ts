import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Department } from '../../core/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Financial Intelligence & Audit Reports
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Generate, filter, preview, and download formal compliance audit reports in CSV and PDF formats
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Download CSV -->
          <button
            (click)="exportReport('csv')"
            [disabled]="exporting"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <i class="ri-file-excel-2-line text-emerald-600 text-sm"></i>
            <span>Export CSV</span>
          </button>

          <!-- Download PDF -->
          <button
            (click)="exportReport('pdf')"
            [disabled]="exporting"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <i class="ri-file-pdf-2-line text-sm"></i>
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <!-- Report Type Selector & Filter Grid -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <!-- Tabs for Report Type -->
        <div class="flex border-b border-slate-200 pb-3 gap-2 flex-wrap">
          <button
            (click)="setReportType('budget')"
            class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            [ngClass]="reportType === 'budget' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
          >
            <i class="ri-wallet-3-line"></i>
            <span>Budget Allocation & Utilization</span>
          </button>

          <button
            (click)="setReportType('expenditure')"
            class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            [ngClass]="reportType === 'expenditure' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
          >
            <i class="ri-exchange-dollar-line"></i>
            <span>Expenditure & Disbursements</span>
          </button>

          <button
            (click)="setReportType('anomalies')"
            class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            [ngClass]="reportType === 'anomalies' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
          >
            <i class="ri-alarm-warning-line"></i>
            <span>Anomaly & Risk Irregularities</span>
          </button>
        </div>

        <!-- Filter Dropdowns -->
        <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
          <!-- Department Filter -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Department</label>
            <select
              [(ngModel)]="filterDept"
              (change)="loadPreviewData()"
              class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</option>
            </select>
          </div>

          <!-- FY Filter (Budget / Exp) -->
          <div *ngIf="reportType === 'budget'">
            <label class="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Financial Year</label>
            <select
              [(ngModel)]="filterFY"
              (change)="loadPreviewData()"
              class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Financial Years</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
              <option value="2026-27">2026-27</option>
            </select>
          </div>

          <!-- Category (Expenditure) -->
          <div *ngIf="reportType === 'expenditure'">
            <label class="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Expense Category</label>
            <select
              [(ngModel)]="filterCategory"
              (change)="loadPreviewData()"
              class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="CAPITAL">CAPITAL</option>
              <option value="OPERATIONAL">OPERATIONAL</option>
              <option value="PROCUREMENT">PROCUREMENT</option>
              <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
              <option value="SALARY">SALARY</option>
              <option value="TRAINING">TRAINING</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>

          <!-- Severity (Anomalies) -->
          <div *ngIf="reportType === 'anomalies'">
            <label class="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Severity</label>
            <select
              [(ngModel)]="filterSeverity"
              (change)="loadPreviewData()"
              class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div class="flex items-end">
            <button
              (click)="loadPreviewData()"
              class="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i class="ri-refresh-line"></i>
              <span>Refresh Report</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div class="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Report Data Preview ({{ previewData.length }} records)
          </div>
          <div class="text-[11px] text-slate-500">
            Export includes complete verified dataset
          </div>
        </div>

        <div class="overflow-x-auto">
          <!-- Budget Table Preview -->
          <table *ngIf="reportType === 'budget'" class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <th class="py-3 px-4">Budget ID</th>
                <th class="py-3 px-4">Department</th>
                <th class="py-3 px-4">Scheme</th>
                <th class="py-3 px-4 text-right">Allocated (₹)</th>
                <th class="py-3 px-4 text-right">Expenditure (₹)</th>
                <th class="py-3 px-4 text-right">Remaining (₹)</th>
                <th class="py-3 px-4 text-center">Utilization</th>
                <th class="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let item of previewData" class="hover:bg-slate-50/60">
                <td class="py-3 px-4 font-mono font-bold text-slate-800">{{ item.budgetId }}</td>
                <td class="py-3 px-4 text-slate-700">{{ item.department?.name }}</td>
                <td class="py-3 px-4 font-medium text-slate-900">{{ item.projectScheme }}</td>
                <td class="py-3 px-4 text-right font-semibold">₹{{ item.allocatedAmount?.toLocaleString('en-IN') }}</td>
                <td class="py-3 px-4 text-right font-semibold text-indigo-700">₹{{ item.totalSpent?.toLocaleString('en-IN') }}</td>
                <td class="py-3 px-4 text-right font-semibold text-emerald-700">₹{{ item.remainingAmount?.toLocaleString('en-IN') }}</td>
                <td class="py-3 px-4 text-center font-bold text-blue-700">{{ item.utilizationPercentage }}%</td>
                <td class="py-3 px-4 text-center">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Expenditure Table Preview -->
          <table *ngIf="reportType === 'expenditure'" class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <th class="py-3 px-4">TX ID</th>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4">Department</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Vendor</th>
                <th class="py-3 px-4 text-right">Amount (₹)</th>
                <th class="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let item of previewData" class="hover:bg-slate-50/60">
                <td class="py-3 px-4 font-mono font-bold text-slate-800">{{ item.transactionId }}</td>
                <td class="py-3 px-4 text-slate-600">{{ item.transactionDate | date: 'dd/MM/yyyy' }}</td>
                <td class="py-3 px-4 text-slate-700">{{ item.department?.name }}</td>
                <td class="py-3 px-4 font-mono font-semibold">{{ item.category }}</td>
                <td class="py-3 px-4 text-slate-800">{{ item.vendorPayee }}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-900">₹{{ item.amount?.toLocaleString('en-IN') }}</td>
                <td class="py-3 px-4 text-center">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Anomaly Table Preview -->
          <table *ngIf="reportType === 'anomalies'" class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <th class="py-3 px-4">Alert ID</th>
                <th class="py-3 px-4">Severity</th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4">Department</th>
                <th class="py-3 px-4">Summary Description</th>
                <th class="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let item of previewData" class="hover:bg-slate-50/60">
                <td class="py-3 px-4 font-mono font-bold text-slate-800">{{ item.alertId }}</td>
                <td class="py-3 px-4">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    [ngClass]="{
                      'bg-red-100 text-red-800': item.severity === 'CRITICAL',
                      'bg-orange-100 text-orange-800': item.severity === 'HIGH',
                      'bg-amber-100 text-amber-800': item.severity === 'MEDIUM',
                      'bg-blue-100 text-blue-800': item.severity === 'LOW'
                    }"
                  >
                    {{ item.severity }}
                  </span>
                </td>
                <td class="py-3 px-4 font-mono text-[10px]">{{ item.alertType }}</td>
                <td class="py-3 px-4 text-slate-700">{{ item.department?.name }}</td>
                <td class="py-3 px-4 text-slate-600 truncate max-w-[300px]">{{ item.description }}</td>
                <td class="py-3 px-4 text-center font-bold">{{ item.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  public authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  public reportType: 'budget' | 'expenditure' | 'anomalies' = 'budget';
  public departments: Department[] = [];
  public previewData: any[] = [];
  public loading = false;
  public exporting = false;

  // Filters
  public filterDept = 'ALL';
  public filterFY = '2025-26';
  public filterCategory = 'ALL';
  public filterSeverity = 'ALL';

  ngOnInit(): void {
    this.loadDepartments();
    this.loadPreviewData();
  }

  public loadDepartments(): void {
    this.apiService.getDepartments().subscribe({
      next: (res) => (this.departments = res.data),
    });
  }

  public setReportType(type: 'budget' | 'expenditure' | 'anomalies'): void {
    this.reportType = type;
    this.loadPreviewData();
  }

  public loadPreviewData(): void {
    this.loading = true;
    const filters: any = {};
    if (this.filterDept !== 'ALL') filters.departmentId = this.filterDept;

    if (this.reportType === 'budget') {
      if (this.filterFY !== 'ALL') filters.financialYear = this.filterFY;
      this.apiService.getBudgetReport(filters).subscribe({
        next: (res) => {
          this.previewData = res.data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    } else if (this.reportType === 'expenditure') {
      if (this.filterCategory !== 'ALL') filters.category = this.filterCategory;
      this.apiService.getExpenditures(filters).subscribe({
        next: (res) => {
          this.previewData = res.data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    } else {
      if (this.filterSeverity !== 'ALL') filters.severity = this.filterSeverity;
      this.apiService.getAlerts(filters).subscribe({
        next: (res) => {
          this.previewData = res.data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
  }

  public exportReport(format: 'csv' | 'pdf'): void {
    this.exporting = true;
    const filters: any = {};
    if (this.filterDept !== 'ALL') filters.departmentId = this.filterDept;
    if (this.reportType === 'budget' && this.filterFY !== 'ALL') filters.financialYear = this.filterFY;
    if (this.reportType === 'expenditure' && this.filterCategory !== 'ALL') filters.category = this.filterCategory;
    if (this.reportType === 'anomalies' && this.filterSeverity !== 'ALL') filters.severity = this.filterSeverity;

    this.apiService.downloadReport(this.reportType, format, filters).subscribe({
      next: (blob) => {
        this.exporting = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.reportType}-report-${Date.now()}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Export Ready', `Downloaded ${format.toUpperCase()} report successfully.`);
      },
      error: () => {
        this.exporting = false;
      },
    });
  }
}
