import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { SystemConfiguration } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-4xl">
      <!-- Header -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Anomaly Engine Configuration & Thresholds
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Fine-tune mathematical trigger parameters for automated irregularity detection across all ministries
          </p>
        </div>

        <button
          (click)="saveConfig()"
          [disabled]="saving"
          class="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition disabled:opacity-50 cursor-pointer"
        >
          <i class="ri-save-3-line text-base"></i>
          <span>{{ saving ? 'Saving Changes...' : 'Save Configuration' }}</span>
        </button>
      </div>

      <!-- Config Form -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <!-- Rule 1: Under-utilization Rules -->
        <div class="space-y-4 pb-6 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base">
              <i class="ri-timer-line"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                1. Under-Utilization Detection Thresholds
              </h3>
              <p class="text-xs text-slate-500">
                Triggered when financial period progresses significantly without proportional fund deployment
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Time Elapsed Threshold (%)
              </label>
              <div class="flex items-center gap-3">
                <input
                  type="number"
                  [(ngModel)]="config.underUtilizationTimeElapsedThresholdPercent"
                  min="10"
                  max="100"
                  class="w-28 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                />
                <span class="text-xs text-slate-500">Default: 70% of financial year</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Utilization Ceiling Below (%)
              </label>
              <div class="flex items-center gap-3">
                <input
                  type="number"
                  [(ngModel)]="config.underUtilizationThresholdPercent"
                  min="1"
                  max="100"
                  class="w-28 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                />
                <span class="text-xs text-slate-500">Default: Less than 40% utilized</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Rule 2: Overspending Rules -->
        <div class="space-y-4 pb-6 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-base">
              <i class="ri-alarm-warning-line"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                2. Overspending Detection Threshold
              </h3>
              <p class="text-xs text-slate-500">
                Critical alert triggered when total actual expenditures breach approved budget caps
              </p>
            </div>
          </div>

          <div class="pl-10">
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Overspending Threshold (%)
            </label>
            <div class="flex items-center gap-3">
              <input
                type="number"
                [(ngModel)]="config.overspendingThresholdPercent"
                min="90"
                max="200"
                class="w-28 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
              />
              <span class="text-xs text-slate-500">Default: 100% of approved allocation</span>
            </div>
          </div>
        </div>

        <!-- Rule 3: Spending Spike Rules -->
        <div class="space-y-4 pb-6 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
              <i class="ri-flashlight-line"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                3. Spending Spike Multiplier
              </h3>
              <p class="text-xs text-slate-500">
                Identifies anomalous single or short-period transactions disproportionate to historical averages
              </p>
            </div>
          </div>

          <div class="pl-10">
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Spike Multiplier (x Historical Average)
            </label>
            <div class="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                [(ngModel)]="config.spendingSpikeMultiplier"
                min="1.1"
                max="10.0"
                class="w-28 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
              />
              <span class="text-xs text-slate-500">Default: 1.5x average transaction size</span>
            </div>
          </div>
        </div>

        <!-- Rule 4: Budget Deviation -->
        <div class="space-y-4 pb-6 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-base">
              <i class="ri-swap-line"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                4. Budget Deviation Tolerance (%)
              </h3>
              <p class="text-xs text-slate-500">
                Allowable variation buffer before non-compliance alert is recorded
              </p>
            </div>
          </div>

          <div class="pl-10">
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Allowed Buffer (%)
            </label>
            <div class="flex items-center gap-3">
              <input
                type="number"
                [(ngModel)]="config.budgetDeviationThresholdPercent"
                min="1"
                max="50"
                class="w-28 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
              />
              <span class="text-xs text-slate-500">Default: 15% maximum deviation</span>
            </div>
          </div>
        </div>

        <!-- Automation & Alerts -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
              <i class="ri-notification-3-line"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                5. Automation & Alert Notifications
              </h3>
              <p class="text-xs text-slate-500">
                Background execution triggers and notification routing
              </p>
            </div>
          </div>

          <div class="pl-10 space-y-3">
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoRun"
                [(ngModel)]="config.autoRunDetectionOnExpenditure"
                class="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label for="autoRun" class="text-xs font-semibold text-slate-700 cursor-pointer">
                Automatically execute Anomaly Engine upon recording any new expenditure transaction
              </label>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Central Alerts Notification Email
              </label>
              <input
                type="email"
                [(ngModel)]="config.alertNotificationEmail"
                class="w-full max-w-md px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  public config: SystemConfiguration = {
    underUtilizationThresholdPercent: 40,
    underUtilizationTimeElapsedThresholdPercent: 70,
    overspendingThresholdPercent: 100,
    spendingSpikeMultiplier: 1.5,
    budgetDeviationThresholdPercent: 15,
    autoRunDetectionOnExpenditure: true,
    alertNotificationEmail: 'finance-directorate@gov.in',
  };

  public loading = false;
  public saving = false;

  ngOnInit(): void {
    this.loadConfig();
  }

  public loadConfig(): void {
    this.loading = true;
    this.apiService.getConfig().subscribe({
      next: (res) => {
        if (res.data) this.config = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  public saveConfig(): void {
    this.saving = true;
    this.apiService.updateConfig(this.config).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success('Settings Saved', 'Anomaly detection parameters updated in database.');
      },
      error: () => (this.saving = false),
    });
  }
}
