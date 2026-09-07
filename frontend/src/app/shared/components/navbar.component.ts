import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div class="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <!-- Left: Toggle & Title -->
        <div class="flex items-center gap-4">
          <button
            (click)="toggleSidebar.emit()"
            class="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          >
            <i class="ri-menu-line text-xl"></i>
          </button>
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-900 to-indigo-700 flex items-center justify-center text-white font-bold shadow">
              <i class="ri-funds-box-line text-lg"></i>
            </div>
            <div>
              <div class="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                AI Budget Utilization Monitoring System
              </div>
              <div class="text-[11px] text-slate-500 font-medium">
                Public Financial Management & Anomaly Detection Portal
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Actions & User Info -->
        <div class="flex items-center gap-3">
          <!-- Manual Anomaly Scan Trigger (Admin & Finance) -->
          <button
            *ngIf="authService.isAdmin() || authService.isFinanceOfficer()"
            (click)="runAnomalyScan()"
            [disabled]="isScanning"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition shadow-sm disabled:opacity-50"
          >
            <i class="ri-radar-line" [ngClass]="{ 'animate-spin': isScanning }"></i>
            <span>{{ isScanning ? 'Scanning...' : 'Run Anomaly Scan' }}</span>
          </button>

          <!-- Role Badge -->
          <div class="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border"
            [ngClass]="{
              'bg-purple-50 text-purple-700 border-purple-200': authService.isAdmin(),
              'bg-blue-50 text-blue-700 border-blue-200': authService.isFinanceOfficer(),
              'bg-emerald-50 text-emerald-700 border-emerald-200': authService.isDeptHead()
            }"
          >
            <i class="ri-shield-user-line"></i>
            <span>{{ authService.currentUser()?.role?.replace('_', ' ') }}</span>
          </div>

          <!-- User Menu -->
          <div class="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div class="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold uppercase shadow">
              {{ authService.currentUser()?.name?.charAt(0) || 'U' }}
            </div>
            <div class="hidden sm:block text-left">
              <div class="text-xs font-semibold text-slate-800 leading-tight">
                {{ getUserDisplayName() }}
              </div>
              <div class="text-[10px] text-slate-500">
                {{ authService.currentUser()?.email }}
              </div>
            </div>
            <button
              (click)="authService.logout()"
              title="Sign Out"
              class="p-2 ml-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <i class="ri-logout-box-r-line text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  public authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  public isScanning = false;

  public getUserDisplayName(): string {
    const user = this.authService.currentUser();
    if (!user || !user.name) return 'Officer';
    return user.name.split('(')[0].trim();
  }

  public runAnomalyScan(): void {
    this.isScanning = true;
    this.apiService.triggerAnomalyScan().subscribe({
      next: (res) => {
        this.isScanning = false;
        this.toastService.success(
          'Anomaly Scan Completed',
          `Generated ${res.data.alertsGenerated} new alerts, updated ${res.data.alertsUpdated}.`
        );
      },
      error: () => {
        this.isScanning = false;
      },
    });
  }
}
