import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuditLog } from '../../core/models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Security & Financial Audit Trail
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Immutable, tamper-evident chronological event log of all financial allocations, disbursements, system changes, and logins
          </p>
        </div>

        <button
          (click)="loadLogs()"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
        >
          <i class="ri-refresh-line" [ngClass]="{ 'animate-spin': loading }"></i>
          <span>Refresh Trail</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="relative">
          <i class="ri-search-line absolute left-3 top-2.5 text-slate-400 text-sm"></i>
          <input
            type="text"
            [(ngModel)]="searchUser"
            (input)="loadLogs()"
            placeholder="Search Officer Email..."
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          [(ngModel)]="filterEntity"
          (change)="loadLogs()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Entity Types</option>
          <option value="BUDGET">BUDGET</option>
          <option value="EXPENDITURE">EXPENDITURE</option>
          <option value="ALERT">ALERT</option>
          <option value="DEPARTMENT">DEPARTMENT</option>
          <option value="USER">USER</option>
          <option value="CONFIG">CONFIG</option>
          <option value="AUTH">AUTH</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>

        <div class="relative">
          <i class="ri-search-line absolute left-3 top-2.5 text-slate-400 text-sm"></i>
          <input
            type="text"
            [(ngModel)]="searchAction"
            (input)="loadLogs()"
            placeholder="Filter by Action Code..."
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th class="py-3 px-4">Timestamp</th>
                <th class="py-3 px-4">Officer / Email</th>
                <th class="py-3 px-4">Role</th>
                <th class="py-3 px-4">Action Event</th>
                <th class="py-3 px-4">Entity Type</th>
                <th class="py-3 px-4">IP Address</th>
                <th class="py-3 px-4 text-center">Audit Payload</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
              <tr *ngIf="loading">
                <td colspan="7" class="text-center py-8 text-slate-400">
                  <i class="ri-loader-4-line animate-spin text-2xl mb-1"></i>
                  <div>Fetching security audit trails...</div>
                </td>
              </tr>

              <tr *ngIf="!loading && logs.length === 0">
                <td colspan="7" class="text-center py-8 text-slate-400">
                  No audit log records found.
                </td>
              </tr>

              <tr *ngFor="let log of logs" class="hover:bg-slate-50/70">
                <td class="py-3 px-4 text-slate-500">
                  {{ log.timestamp | date: 'dd/MM/yyyy HH:mm:ss' }}
                </td>
                <td class="py-3 px-4 font-sans font-semibold text-slate-900">
                  {{ log.userEmail }}
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-slate-100 text-slate-700">
                    {{ log.userRole }}
                  </span>
                </td>
                <td class="py-3 px-4 font-bold text-blue-700">
                  {{ log.action }}
                </td>
                <td class="py-3 px-4 text-slate-600">
                  {{ log.entityType }} {{ log.entityId ? ('#' + log.entityId.slice(-6)) : '' }}
                </td>
                <td class="py-3 px-4 text-slate-400 text-[10px]">
                  {{ log.ipAddress }}
                </td>
                <td class="py-3 px-4 text-center">
                  <button
                    *ngIf="log.newValue || log.previousValue"
                    (click)="inspectLog(log)"
                    class="px-2 py-1 text-[10px] font-sans font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-md transition cursor-pointer"
                  >
                    View Diff
                  </button>
                  <span *ngIf="!log.newValue && !log.previousValue" class="text-slate-300">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Diff Inspection Modal -->
      <div *ngIf="selectedLog" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto animate-scale-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-sm font-bold text-slate-900">
              Audit Record Payload: {{ selectedLog.action }}
            </h3>
            <button (click)="selectedLog = null" class="text-slate-400 hover:text-slate-700 p-1">
              <i class="ri-close-line text-xl"></i>
            </button>
          </div>

          <div *ngIf="selectedLog.previousValue" class="space-y-1">
            <div class="text-[11px] font-bold text-rose-700 uppercase">Previous State:</div>
            <pre class="bg-slate-900 text-rose-300 p-3 rounded-xl text-[11px] overflow-x-auto font-mono">{{ selectedLog.previousValue | json }}</pre>
          </div>

          <div *ngIf="selectedLog.newValue" class="space-y-1">
            <div class="text-[11px] font-bold text-emerald-700 uppercase">New / Modified State:</div>
            <pre class="bg-slate-900 text-emerald-300 p-3 rounded-xl text-[11px] overflow-x-auto font-mono">{{ selectedLog.newValue | json }}</pre>
          </div>

          <div class="flex justify-end pt-3">
            <button
              (click)="selectedLog = null"
              class="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuditLogsComponent implements OnInit {
  private apiService = inject(ApiService);

  public logs: AuditLog[] = [];
  public loading = false;
  public searchUser = '';
  public filterEntity = 'ALL';
  public searchAction = '';
  public selectedLog: AuditLog | null = null;

  ngOnInit(): void {
    this.loadLogs();
  }

  public loadLogs(): void {
    this.loading = true;
    const filters: any = {};
    if (this.searchUser) filters.userEmail = this.searchUser;
    if (this.filterEntity !== 'ALL') filters.entityType = this.filterEntity;
    if (this.searchAction) filters.action = this.searchAction;

    this.apiService.getAuditLogs(filters).subscribe({
      next: (res) => {
        this.logs = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  public inspectLog(log: AuditLog): void {
    this.selectedLog = log;
  }
}
