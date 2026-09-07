import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Budget, Department } from '../../core/models';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header & Action Bar -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Annual & Quarterly Budget Allocations
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Configure fiscal fund quotas, schemes, and track real-time utilization progress
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            *ngIf="authService.isAdmin() || authService.isFinanceOfficer()"
            (click)="openCreateModal()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm cursor-pointer"
          >
            <i class="ri-add-circle-line text-base"></i>
            <span>Create New Budget</span>
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Search -->
        <div class="relative">
          <i class="ri-search-line absolute left-3 top-2.5 text-slate-400 text-sm"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="loadBudgets()"
            placeholder="Search Scheme or ID..."
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- FY Filter -->
        <select
          [(ngModel)]="filterFY"
          (change)="loadBudgets()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Financial Years</option>
          <option value="2025-26">2025-26 (Active)</option>
          <option value="2024-25">2024-25</option>
          <option value="2026-27">2026-27</option>
        </select>

        <!-- Quarter Filter -->
        <select
          [(ngModel)]="filterQuarter"
          (change)="loadBudgets()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Periods (Annual + Q1-Q4)</option>
          <option value="ANNUAL">Annual Budget</option>
          <option value="Q1">Q1 (Apr - Jun)</option>
          <option value="Q2">Q2 (Jul - Sep)</option>
          <option value="Q3">Q3 (Oct - Dec)</option>
          <option value="Q4">Q4 (Jan - Mar)</option>
        </select>

        <!-- Department Filter -->
        <select
          *ngIf="!authService.isDeptHead()"
          [(ngModel)]="filterDept"
          (change)="loadBudgets()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Departments</option>
          <option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</option>
        </select>

        <!-- Status Filter -->
        <select
          [(ngModel)]="filterStatus"
          (change)="loadBudgets()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="ALLOCATED">ALLOCATED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REVISED">REVISED</option>
          <option value="DRAFT">DRAFT</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      <!-- Budgets Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th class="py-3 px-4">Scheme / Budget ID</th>
                <th class="py-3 px-4">Department</th>
                <th class="py-3 px-4">Period</th>
                <th class="py-3 px-4 text-right">Allocated (₹)</th>
                <th class="py-3 px-4 text-right">Spent (₹)</th>
                <th class="py-3 px-4 text-right">Remaining (₹)</th>
                <th class="py-3 px-4 text-center">Utilization</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngIf="loading">
                <td colspan="9" class="text-center py-8 text-slate-400">
                  <i class="ri-loader-4-line animate-spin text-2xl mb-1"></i>
                  <div>Loading budget records...</div>
                </td>
              </tr>

              <tr *ngIf="!loading && budgets.length === 0">
                <td colspan="9" class="text-center py-8 text-slate-400">
                  <i class="ri-inbox-line text-3xl mb-1"></i>
                  <div>No budget allocations found matching your filter criteria.</div>
                </td>
              </tr>

              <tr *ngFor="let b of budgets" class="hover:bg-slate-50/70 transition">
                <td class="py-3.5 px-4">
                  <div class="font-bold text-slate-900 text-xs">{{ b.projectScheme }}</div>
                  <div class="text-[10px] text-blue-600 font-mono mt-0.5">{{ b.budgetId }}</div>
                </td>
                <td class="py-3.5 px-4 text-slate-700">
                  <div class="font-semibold">{{ b.department?.code || 'N/A' }}</div>
                  <div class="text-[10px] text-slate-400 truncate max-w-[150px]">{{ b.department?.name }}</div>
                </td>
                <td class="py-3.5 px-4 text-slate-700">
                  <span class="font-semibold text-slate-900">{{ b.financialYear }}</span>
                  <span class="ml-1 px-1.5 py-0.5 rounded-sm text-[10px] bg-slate-100 text-slate-600 font-mono">{{ b.quarter }}</span>
                </td>
                <td class="py-3.5 px-4 text-right font-semibold text-slate-900">
                  ₹{{ b.allocatedAmount.toLocaleString('en-IN') }}
                </td>
                <td class="py-3.5 px-4 text-right font-semibold text-indigo-700">
                  ₹{{ (b.totalSpent || 0).toLocaleString('en-IN') }}
                </td>
                <td class="py-3.5 px-4 text-right font-semibold" [ngClass]="(b.remainingAmount || 0) < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700'">
                  ₹{{ (b.remainingAmount || 0).toLocaleString('en-IN') }}
                </td>
                <td class="py-3.5 px-4">
                  <div class="w-32 mx-auto space-y-1">
                    <div class="flex justify-between text-[10px] font-bold">
                      <span [ngClass]="getBandTextColor(b.band)">{{ b.band }}</span>
                      <span>{{ b.utilizationPercentage }}%</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all"
                        [ngStyle]="{ width: Math.min(b.utilizationPercentage || 0, 100) + '%' }"
                        [ngClass]="getBandBgColor(b.band)"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="py-3.5 px-4 text-center">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    [ngClass]="{
                      'bg-emerald-50 text-emerald-700 border border-emerald-200': b.status === 'ALLOCATED' || b.status === 'APPROVED',
                      'bg-blue-50 text-blue-700 border border-blue-200': b.status === 'REVISED',
                      'bg-amber-50 text-amber-700 border border-amber-200': b.status === 'DRAFT',
                      'bg-slate-100 text-slate-600 border border-slate-200': b.status === 'CLOSED'
                    }"
                  >
                    {{ b.status }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      *ngIf="authService.isAdmin() || authService.isFinanceOfficer()"
                      (click)="openEditModal(b)"
                      class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Budget"
                    >
                      <i class="ri-edit-line text-sm"></i>
                    </button>
                    <button
                      *ngIf="authService.isAdmin()"
                      (click)="deleteBudget(b)"
                      class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Close or Delete Budget"
                    >
                      <i class="ri-delete-bin-line text-sm"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal: Create / Edit Budget -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900">
              {{ isEditing ? 'Modify Budget Allocation' : 'Create New Budget Allocation' }}
            </h3>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 p-1">
              <i class="ri-close-line text-xl"></i>
            </button>
          </div>

          <form (ngSubmit)="saveBudget()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Project / Scheme Name *</label>
              <input
                type="text"
                [(ngModel)]="formData.projectScheme"
                name="projectScheme"
                required
                placeholder="e.g. National Smart City Sensor Network Phase-II"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                <select
                  [(ngModel)]="formData.department"
                  name="department"
                  required
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select Department</option>
                  <option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Financial Year *</label>
                <input
                  type="text"
                  [(ngModel)]="formData.financialYear"
                  name="financialYear"
                  required
                  placeholder="2025-26"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Allocation Period *</label>
                <select
                  [(ngModel)]="formData.quarter"
                  name="quarter"
                  required
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ANNUAL">Annual Total</option>
                  <option value="Q1">Quarter 1 (Q1)</option>
                  <option value="Q2">Quarter 2 (Q2)</option>
                  <option value="Q3">Quarter 3 (Q3)</option>
                  <option value="Q4">Quarter 4 (Q4)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Budget Status *</label>
                <select
                  [(ngModel)]="formData.status"
                  name="status"
                  required
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALLOCATED">ALLOCATED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REVISED">REVISED</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Allocated Amount (INR) *</label>
                <input
                  type="number"
                  [(ngModel)]="formData.allocatedAmount"
                  name="allocatedAmount"
                  required
                  min="1"
                  placeholder="e.g. 50000000"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Approved Amount (INR) *</label>
                <input
                  type="number"
                  [(ngModel)]="formData.approvedAmount"
                  name="approvedAmount"
                  required
                  min="1"
                  placeholder="e.g. 50000000"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Detailed Description & Objectives</label>
              <textarea
                [(ngModel)]="formData.description"
                name="description"
                rows="3"
                placeholder="Explain the primary scope and deliverables for this allocation..."
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                (click)="closeModal()"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="saving"
                class="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {{ saving ? 'Saving...' : isEditing ? 'Save Modifications' : 'Allocate Funds' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class BudgetsComponent implements OnInit {
  public authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  public Math = Math;
  public budgets: Budget[] = [];
  public departments: Department[] = [];
  public loading = false;
  public saving = false;

  // Filters
  public searchQuery = '';
  public filterFY = 'ALL';
  public filterQuarter = 'ALL';
  public filterDept = 'ALL';
  public filterStatus = 'ALL';

  // Modal state
  public showModal = false;
  public isEditing = false;
  public currentBudgetId: string | null = null;
  public formData: any = {
    projectScheme: '',
    department: '',
    financialYear: '2025-26',
    quarter: 'ANNUAL',
    allocatedAmount: 0,
    approvedAmount: 0,
    status: 'ALLOCATED',
    description: '',
  };

  ngOnInit(): void {
    this.loadDepartments();
    this.loadBudgets();
  }

  public loadDepartments(): void {
    this.apiService.getDepartments().subscribe({
      next: (res) => (this.departments = res.data),
    });
  }

  public loadBudgets(): void {
    this.loading = true;
    const filters: any = {};
    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.filterFY !== 'ALL') filters.financialYear = this.filterFY;
    if (this.filterQuarter !== 'ALL') filters.quarter = this.filterQuarter;
    if (this.filterDept !== 'ALL') filters.departmentId = this.filterDept;
    if (this.filterStatus !== 'ALL') filters.status = this.filterStatus;

    this.apiService.getBudgets(filters).subscribe({
      next: (res) => {
        this.budgets = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  public openCreateModal(): void {
    this.isEditing = false;
    this.currentBudgetId = null;
    this.formData = {
      projectScheme: '',
      department: this.departments[0]?._id || '',
      financialYear: '2025-26',
      quarter: 'ANNUAL',
      allocatedAmount: 10000000,
      approvedAmount: 10000000,
      status: 'ALLOCATED',
      description: '',
    };
    this.showModal = true;
  }

  public openEditModal(budget: Budget): void {
    this.isEditing = true;
    this.currentBudgetId = budget._id;
    this.formData = {
      projectScheme: budget.projectScheme,
      department: typeof budget.department === 'object' ? budget.department._id : budget.department,
      financialYear: budget.financialYear,
      quarter: budget.quarter,
      allocatedAmount: budget.allocatedAmount,
      approvedAmount: budget.approvedAmount,
      status: budget.status,
      description: budget.description || '',
    };
    this.showModal = true;
  }

  public closeModal(): void {
    this.showModal = false;
  }

  public saveBudget(): void {
    if (!this.formData.projectScheme || !this.formData.department || !this.formData.allocatedAmount) {
      this.toastService.warning('Required Fields', 'Please complete all required budget fields');
      return;
    }

    this.saving = true;
    if (this.isEditing && this.currentBudgetId) {
      this.apiService.updateBudget(this.currentBudgetId, this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.success('Success', 'Budget updated successfully');
          this.closeModal();
          this.loadBudgets();
        },
        error: () => (this.saving = false),
      });
    } else {
      this.apiService.createBudget(this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.success('Success', 'Budget allocated successfully');
          this.closeModal();
          this.loadBudgets();
        },
        error: () => (this.saving = false),
      });
    }
  }

  public deleteBudget(budget: Budget): void {
    if (confirm(`Are you sure you want to close/delete budget '${budget.projectScheme}' (${budget.budgetId})?`)) {
      this.apiService.deleteBudget(budget._id).subscribe({
        next: (res) => {
          this.toastService.success('Success', res.message || 'Budget updated');
          this.loadBudgets();
        },
      });
    }
  }

  public getBandTextColor(band?: string): string {
    switch (band) {
      case 'LOW': return 'text-amber-600';
      case 'NORMAL': return 'text-emerald-600';
      case 'HIGH': return 'text-blue-600';
      case 'OVERSPENDING': return 'text-rose-600';
      default: return 'text-slate-600';
    }
  }

  public getBandBgColor(band?: string): string {
    switch (band) {
      case 'LOW': return 'bg-amber-500';
      case 'NORMAL': return 'bg-emerald-500';
      case 'HIGH': return 'bg-blue-600';
      case 'OVERSPENDING': return 'bg-rose-600';
      default: return 'bg-slate-400';
    }
  }
}
