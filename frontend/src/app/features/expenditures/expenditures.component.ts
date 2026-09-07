import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Expenditure, Budget, Department } from '../../core/models';

@Component({
  selector: 'app-expenditures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Expenditure Ledger & Disbursements
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Log financial outflows, invoice receipts, and cross-reference against active budget ceilings
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            (click)="openCreateModal()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-sm cursor-pointer"
          >
            <i class="ri-receipt-line text-base"></i>
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div class="relative">
          <i class="ri-search-line absolute left-3 top-2.5 text-slate-400 text-sm"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="loadExpenditures()"
            placeholder="Search Vendor, TX, Desc..."
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- Category Filter -->
        <select
          [(ngModel)]="filterCategory"
          (change)="loadExpenditures()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Expense Categories</option>
          <option value="CAPITAL">CAPITAL</option>
          <option value="OPERATIONAL">OPERATIONAL</option>
          <option value="PROCUREMENT">PROCUREMENT</option>
          <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
          <option value="SALARY">SALARY</option>
          <option value="TRAINING">TRAINING</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
          <option value="OTHER">OTHER</option>
        </select>

        <!-- Department Filter -->
        <select
          *ngIf="!authService.isDeptHead()"
          [(ngModel)]="filterDept"
          (change)="loadExpenditures()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Departments</option>
          <option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</option>
        </select>

        <!-- Status Filter -->
        <select
          [(ngModel)]="filterStatus"
          (change)="loadExpenditures()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="RECORDED">RECORDED</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="FLAGGED">FLAGGED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <!-- Quick Reset -->
        <button
          (click)="resetFilters()"
          class="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
        >
          <i class="ri-filter-off-line"></i>
          <span>Reset Filters</span>
        </button>
      </div>

      <!-- Expenditures Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th class="py-3 px-4">TX ID / Date</th>
                <th class="py-3 px-4">Department & Budget Scheme</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Vendor / Payee</th>
                <th class="py-3 px-4 text-right">Amount (₹)</th>
                <th class="py-3 px-4 text-center">Receipt Doc</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngIf="loading">
                <td colspan="8" class="text-center py-8 text-slate-400">
                  <i class="ri-loader-4-line animate-spin text-2xl mb-1"></i>
                  <div>Loading expenditure transactions...</div>
                </td>
              </tr>

              <tr *ngIf="!loading && expenditures.length === 0">
                <td colspan="8" class="text-center py-8 text-slate-400">
                  <i class="ri-file-list-3-line text-3xl mb-1"></i>
                  <div>No expenditure transactions recorded.</div>
                </td>
              </tr>

              <tr *ngFor="let e of expenditures" class="hover:bg-slate-50/70 transition">
                <td class="py-3.5 px-4">
                  <div class="font-mono font-bold text-slate-900 text-[11px]">{{ e.transactionId }}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">
                    {{ e.transactionDate | date: 'dd MMM yyyy' }}
                  </div>
                </td>
                <td class="py-3.5 px-4 text-slate-700">
                  <div class="font-semibold text-slate-900">{{ e.budget?.projectScheme || 'N/A' }}</div>
                  <div class="text-[10px] text-slate-500">
                    Dept: <span class="font-medium text-slate-700">{{ e.department?.name }}</span>
                  </div>
                </td>
                <td class="py-3.5 px-4">
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 font-mono">
                    {{ e.category }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-slate-800">
                  <div class="font-semibold text-xs">{{ e.vendorPayee }}</div>
                  <div class="text-[10px] text-slate-500 truncate max-w-[200px]">{{ e.description }}</div>
                </td>
                <td class="py-3.5 px-4 text-right font-bold text-slate-900">
                  ₹{{ e.amount.toLocaleString('en-IN') }}
                </td>
                <td class="py-3.5 px-4 text-center">
                  <a
                    *ngIf="e.supportingDocument"
                    [href]="apiService.downloadExpenditureDocumentUrl(e._id)"
                    target="_blank"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                    title="Download Invoice/Receipt"
                  >
                    <i class="ri-attachment-line"></i>
                    <span>PDF/Doc</span>
                  </a>
                  <span *ngIf="!e.supportingDocument" class="text-slate-300 text-[10px]">None</span>
                </td>
                <td class="py-3.5 px-4 text-center">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    [ngClass]="{
                      'bg-emerald-50 text-emerald-700 border border-emerald-200': e.status === 'VERIFIED',
                      'bg-blue-50 text-blue-700 border border-blue-200': e.status === 'RECORDED',
                      'bg-rose-50 text-rose-700 border border-rose-200': e.status === 'FLAGGED',
                      'bg-slate-100 text-slate-600 border border-slate-200': e.status === 'CANCELLED'
                    }"
                  >
                    {{ e.status }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      *ngIf="authService.isAdmin()"
                      (click)="deleteExpenditure(e)"
                      class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Record"
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

      <!-- Modal: Record Expenditure -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900">
              Record Public Expenditure Transaction
            </h3>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 p-1">
              <i class="ri-close-line text-xl"></i>
            </button>
          </div>

          <form (ngSubmit)="saveExpenditure()" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Target Budget Scheme *</label>
                <select
                  [(ngModel)]="formData.budget"
                  name="budget"
                  (change)="onBudgetSelected()"
                  required
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>Select Budget Scheme</option>
                  <option *ngFor="let b of budgetsList" [value]="b._id">
                    {{ b.projectScheme }} ({{ b.financialYear }})
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Expense Category *</label>
                <select
                  [(ngModel)]="formData.category"
                  name="category"
                  required
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CAPITAL">CAPITAL</option>
                  <option value="OPERATIONAL">OPERATIONAL</option>
                  <option value="PROCUREMENT">PROCUREMENT</option>
                  <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                  <option value="SALARY">SALARY</option>
                  <option value="TRAINING">TRAINING</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Disbursement Amount (INR) *</label>
                <input
                  type="number"
                  [(ngModel)]="formData.amount"
                  name="amount"
                  required
                  min="1"
                  placeholder="e.g. 2500000"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Transaction Date *</label>
                <input
                  type="date"
                  [(ngModel)]="formData.transactionDate"
                  name="transactionDate"
                  required
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Vendor / Payee Entity *</label>
              <input
                type="text"
                [(ngModel)]="formData.vendorPayee"
                name="vendorPayee"
                required
                placeholder="e.g. Bharat Electronics Ltd"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Transaction Narrative / Purpose *</label>
              <textarea
                [(ngModel)]="formData.description"
                name="description"
                required
                rows="2"
                placeholder="Detailed explanation of items purchased or services rendered..."
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Supporting Invoice / Receipt (PDF, JPG, PNG)</label>
              <input
                type="file"
                (change)="onFileSelected($event)"
                accept=".pdf,.jpg,.jpeg,.png"
                class="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden text-slate-600 file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
              />
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
                class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {{ saving ? 'Submitting...' : 'Post Transaction' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class ExpendituresComponent implements OnInit {
  public authService = inject(AuthService);
  public apiService = inject(ApiService);
  private toastService = inject(ToastService);

  public expenditures: Expenditure[] = [];
  public departments: Department[] = [];
  public budgetsList: Budget[] = [];
  public loading = false;
  public saving = false;

  // Filters
  public searchQuery = '';
  public filterCategory = 'ALL';
  public filterDept = 'ALL';
  public filterStatus = 'ALL';

  // Modal Form
  public showModal = false;
  public selectedFile: File | null = null;
  public formData: any = {
    budget: '',
    department: '',
    category: 'OPERATIONAL',
    amount: 0,
    transactionDate: new Date().toISOString().split('T')[0],
    vendorPayee: '',
    description: '',
  };

  ngOnInit(): void {
    this.loadDepartments();
    this.loadBudgets();
    this.loadExpenditures();
  }

  public loadDepartments(): void {
    this.apiService.getDepartments().subscribe({
      next: (res) => (this.departments = res.data),
    });
  }

  public loadBudgets(): void {
    this.apiService.getBudgets({ status: 'ALLOCATED' }).subscribe({
      next: (res) => (this.budgetsList = res.data),
    });
  }

  public loadExpenditures(): void {
    this.loading = true;
    const filters: any = {};
    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.filterCategory !== 'ALL') filters.category = this.filterCategory;
    if (this.filterDept !== 'ALL') filters.departmentId = this.filterDept;
    if (this.filterStatus !== 'ALL') filters.status = this.filterStatus;

    this.apiService.getExpenditures(filters).subscribe({
      next: (res) => {
        this.expenditures = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  public resetFilters(): void {
    this.searchQuery = '';
    this.filterCategory = 'ALL';
    this.filterDept = 'ALL';
    this.filterStatus = 'ALL';
    this.loadExpenditures();
  }

  public openCreateModal(): void {
    this.formData = {
      budget: this.budgetsList[0]?._id || '',
      department: this.budgetsList[0]?.department
        ? typeof this.budgetsList[0].department === 'object'
          ? (this.budgetsList[0].department as any)._id
          : this.budgetsList[0].department
        : '',
      category: 'OPERATIONAL',
      amount: 500000,
      transactionDate: new Date().toISOString().split('T')[0],
      vendorPayee: '',
      description: '',
    };
    this.selectedFile = null;
    this.showModal = true;
  }

  public onBudgetSelected(): void {
    const selectedBdg = this.budgetsList.find((b) => b._id === this.formData.budget);
    if (selectedBdg && selectedBdg.department) {
      this.formData.department =
        typeof selectedBdg.department === 'object'
          ? (selectedBdg.department as any)._id
          : selectedBdg.department;
    }
  }

  public onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  public closeModal(): void {
    this.showModal = false;
  }

  public saveExpenditure(): void {
    if (!this.formData.budget || !this.formData.amount || !this.formData.vendorPayee || !this.formData.description) {
      this.toastService.warning('Required Fields', 'Please fill out all mandatory expenditure fields');
      return;
    }

    this.saving = true;
    const body = new FormData();
    body.append('budget', this.formData.budget);
    body.append('department', this.formData.department);
    body.append('category', this.formData.category);
    body.append('amount', this.formData.amount.toString());
    body.append('transactionDate', this.formData.transactionDate);
    body.append('vendorPayee', this.formData.vendorPayee);
    body.append('description', this.formData.description);

    if (this.selectedFile) {
      body.append('document', this.selectedFile);
    }

    this.apiService.createExpenditure(body).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success('Disbursement Recorded', 'Transaction logged and anomaly engine triggered');
        this.closeModal();
        this.loadExpenditures();
      },
      error: () => (this.saving = false),
    });
  }

  public deleteExpenditure(exp: Expenditure): void {
    if (confirm(`Delete expenditure transaction ${exp.transactionId}?`)) {
      this.apiService.deleteExpenditure(exp._id).subscribe({
        next: () => {
          this.toastService.success('Deleted', 'Transaction deleted and budget balance updated');
          this.loadExpenditures();
        },
      });
    }
  }
}
