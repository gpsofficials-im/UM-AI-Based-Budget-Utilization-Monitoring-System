import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Alert, Department } from '../../core/models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <i class="ri-radar-fill text-rose-600"></i>
            Anomaly Detection & Financial Risk Alerts
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Automated analytical detection of under-utilization, overspending, expenditure spikes, and budget deviations
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            *ngIf="authService.isAdmin() || authService.isFinanceOfficer()"
            (click)="triggerScan()"
            [disabled]="isScanning"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <i class="ri-scan-2-line text-base" [ngClass]="{ 'animate-spin': isScanning }"></i>
            <span>{{ isScanning ? 'Evaluating Algorithms...' : 'Scan All Budgets Now' }}</span>
          </button>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Status Filter -->
        <select
          [(ngModel)]="filterStatus"
          (change)="loadAlerts()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-semibold cursor-pointer"
        >
          <option value="ALL">All Alert Statuses</option>
          <option value="OPEN">OPEN (Requires Action)</option>
          <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>

        <!-- Severity Filter -->
        <select
          [(ngModel)]="filterSeverity"
          (change)="loadAlerts()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-semibold cursor-pointer"
        >
          <option value="ALL">All Severity Levels</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        <!-- Alert Type Filter -->
        <select
          [(ngModel)]="filterType"
          (change)="loadAlerts()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-semibold cursor-pointer"
        >
          <option value="ALL">All Anomaly Types</option>
          <option value="OVERSPENDING">Overspending</option>
          <option value="UNDER_UTILIZATION">Under-Utilization</option>
          <option value="SPENDING_SPIKE">Spending Spike</option>
          <option value="BUDGET_DEVIATION">Budget Deviation</option>
        </select>

        <!-- Department Filter -->
        <select
          *ngIf="!authService.isDeptHead()"
          [(ngModel)]="filterDept"
          (change)="loadAlerts()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-semibold cursor-pointer"
        >
          <option value="ALL">All Departments</option>
          <option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</option>
        </select>
      </div>

      <!-- Alerts List -->
      <div class="space-y-3">
        <div *ngIf="loading" class="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          <i class="ri-loader-4-line animate-spin text-3xl mb-2"></i>
          <div>Loading anomaly alert records...</div>
        </div>

        <div *ngIf="!loading && alerts.length === 0" class="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          <i class="ri-checkbox-circle-line text-4xl text-emerald-500 mb-2"></i>
          <div class="text-sm font-semibold text-slate-700">All Clear</div>
          <div class="mt-1">No alerts found matching the selected filter criteria.</div>
        </div>

        <div
          *ngFor="let alert of alerts"
          class="bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition relative overflow-hidden"
          [ngClass]="{
            'border-red-300 bg-red-50/10': alert.severity === 'CRITICAL' && alert.status === 'OPEN',
            'border-orange-200': alert.severity === 'HIGH' && alert.status === 'OPEN',
            'border-slate-200': alert.status !== 'OPEN'
          }"
        >
          <!-- Left Status Indicator Bar -->
          <div
            class="absolute top-0 left-0 bottom-0 w-1.5"
            [ngClass]="{
              'bg-red-600': alert.severity === 'CRITICAL',
              'bg-orange-500': alert.severity === 'HIGH',
              'bg-amber-500': alert.severity === 'MEDIUM',
              'bg-blue-500': alert.severity === 'LOW'
            }"
          ></div>

          <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pl-2">
            <!-- Left Info Block -->
            <div class="space-y-2 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Severity Chip -->
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                  [ngClass]="{
                    'bg-red-100 text-red-800 border border-red-300': alert.severity === 'CRITICAL',
                    'bg-orange-100 text-orange-800 border border-orange-300': alert.severity === 'HIGH',
                    'bg-amber-100 text-amber-800 border border-amber-300': alert.severity === 'MEDIUM',
                    'bg-blue-100 text-blue-800 border border-blue-300': alert.severity === 'LOW'
                  }"
                >
                  {{ alert.severity }}
                </span>

                <!-- Type Badge -->
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 font-mono">
                  {{ alert.alertType }}
                </span>

                <!-- Status Badge -->
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  [ngClass]="{
                    'bg-rose-100 text-rose-800': alert.status === 'OPEN',
                    'bg-amber-100 text-amber-800': alert.status === 'ACKNOWLEDGED',
                    'bg-emerald-100 text-emerald-800': alert.status === 'RESOLVED'
                  }"
                >
                  {{ alert.status }}
                </span>

                <span class="text-[11px] font-mono text-slate-400">
                  {{ alert.alertId }}
                </span>
              </div>

              <h2 class="text-sm font-bold text-slate-900 leading-snug">
                {{ alert.title }}
              </h2>

              <p class="text-xs text-slate-600 leading-relaxed max-w-3xl">
                {{ alert.description }}
              </p>

              <!-- Meta details & tags -->
              <div class="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                <span>
                  <i class="ri-building-line mr-1"></i>
                  Dept: <strong class="text-slate-700">{{ alert.department?.name }}</strong>
                </span>
                <span>
                  <i class="ri-time-line mr-1"></i>
                  Detected: <strong>{{ alert.createdAt | date: 'dd MMM yyyy, hh:mm a' }}</strong>
                </span>
                <span>
                  <i class="ri-calculator-line mr-1"></i>
                  Metric / Threshold: <strong class="text-slate-700">{{ alert.detectedValue }} / {{ alert.threshold }}</strong>
                </span>
              </div>

              <!-- Resolution remarks if resolved -->
              <div *ngIf="alert.status === 'RESOLVED'" class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 mt-2">
                <div class="font-bold flex items-center gap-1.5">
                  <i class="ri-checkbox-circle-fill text-emerald-600"></i>
                  Resolved by {{ alert.resolvedBy?.name || 'Administrator' }} on {{ alert.resolvedAt | date: 'dd MMM yyyy, hh:mm a' }}
                </div>
                <div class="mt-1 text-[11px] opacity-90 leading-relaxed">
                  "{{ alert.resolutionNotes || 'Action completed and verified by the finance team.' }}"
                </div>
              </div>
            </div>

            <!-- Right Action Buttons -->
            <div class="flex lg:flex-col items-center lg:items-end gap-2 flex-shrink-0">
              <!-- Acknowledge Button -->
              <button
                *ngIf="alert.status === 'OPEN'"
                (click)="acknowledgeAlert(alert)"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
              >
                <i class="ri-check-line mr-1"></i>
                Acknowledge
              </button>

              <!-- Resolve Button -->
              <button
                *ngIf="alert.status !== 'RESOLVED' && (authService.isAdmin() || authService.isFinanceOfficer())"
                (click)="openResolveModal(alert)"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition cursor-pointer"
              >
                <i class="ri-shield-check-line mr-1"></i>
                Resolve Issue
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Resolve Modal -->
      <div *ngIf="showResolveModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i class="ri-shield-check-fill text-emerald-600"></i>
              Resolve Anomaly Alert
            </h3>
            <button (click)="closeResolveModal()" class="text-slate-400 hover:text-slate-700 p-1">
              <i class="ri-close-line text-xl"></i>
            </button>
          </div>

          <div class="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div class="font-bold text-slate-800">{{ currentAlert?.title }}</div>
            <div class="text-[11px] text-slate-500 mt-1">{{ currentAlert?.description }}</div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Resolution Remarks & Remedial Actions *
            </label>
            <textarea
              [(ngModel)]="resolutionNotes"
              rows="4"
              placeholder="Detail the corrective actions taken (e.g., Supplementary budget re-allocation authorized, vendor audit conducted, disbursement paused)..."
              class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              (click)="closeResolveModal()"
              class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              (click)="submitResolution()"
              [disabled]="resolving"
              class="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {{ resolving ? 'Submitting...' : 'Mark as Resolved' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AlertsComponent implements OnInit {
  public authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  public alerts: Alert[] = [];
  public departments: Department[] = [];
  public loading = false;
  public isScanning = false;
  public resolving = false;

  // Filters
  public filterStatus = 'OPEN';
  public filterSeverity = 'ALL';
  public filterType = 'ALL';
  public filterDept = 'ALL';

  // Resolve Modal
  public showResolveModal = false;
  public currentAlert: Alert | null = null;
  public resolutionNotes = '';

  ngOnInit(): void {
    this.loadDepartments();
    this.loadAlerts();
  }

  public loadDepartments(): void {
    this.apiService.getDepartments().subscribe({
      next: (res) => (this.departments = res.data),
    });
  }

  public loadAlerts(): void {
    this.loading = true;
    const filters: any = {};
    if (this.filterStatus !== 'ALL') filters.status = this.filterStatus;
    if (this.filterSeverity !== 'ALL') filters.severity = this.filterSeverity;
    if (this.filterType !== 'ALL') filters.alertType = this.filterType;
    if (this.filterDept !== 'ALL') filters.departmentId = this.filterDept;

    this.apiService.getAlerts(filters).subscribe({
      next: (res) => {
        this.alerts = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  public triggerScan(): void {
    this.isScanning = true;
    this.apiService.triggerAnomalyScan().subscribe({
      next: (res) => {
        this.isScanning = false;
        this.toastService.success(
          'Scan Completed',
          `Evaluated ${res.data.scannedBudgets} budgets. ${res.data.alertsGenerated} new alerts generated.`
        );
        this.loadAlerts();
      },
      error: () => (this.isScanning = false),
    });
  }

  public acknowledgeAlert(alert: Alert): void {
    this.apiService.acknowledgeAlert(alert._id).subscribe({
      next: () => {
        this.toastService.info('Acknowledged', `Alert ${alert.alertId} marked as acknowledged.`);
        this.loadAlerts();
      },
    });
  }

  public openResolveModal(alert: Alert): void {
    this.currentAlert = alert;
    this.resolutionNotes = '';
    this.showResolveModal = true;
  }

  public closeResolveModal(): void {
    this.showResolveModal = false;
    this.currentAlert = null;
  }

  public submitResolution(): void {
    if (!this.resolutionNotes || this.resolutionNotes.trim().length < 5) {
      this.toastService.warning('Remarks Required', 'Please provide detailed resolution remarks.');
      return;
    }

    if (!this.currentAlert) return;

    this.resolving = true;
    this.apiService.resolveAlert(this.currentAlert._id, this.resolutionNotes).subscribe({
      next: () => {
        this.resolving = false;
        this.toastService.success('Resolved', `Alert ${this.currentAlert?.alertId} marked as resolved.`);
        this.closeResolveModal();
        this.loadAlerts();
      },
      error: () => (this.resolving = false),
    });
  }
}
