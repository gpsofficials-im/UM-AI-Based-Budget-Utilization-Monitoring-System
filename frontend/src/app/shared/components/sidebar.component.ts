import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile Backdrop -->
    <div
      *ngIf="isOpen"
      (click)="closeSidebar.emit()"
      class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
    ></div>

    <!-- Sidebar Container -->
    <aside
      class="fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static"
      [ngClass]="{ 'translate-x-0': isOpen, '-translate-x-full': !isOpen }"
    >
      <!-- Sidebar Header -->
      <div class="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <i class="ri-shield-keyhole-line"></i>
          </div>
          <div class="font-bold text-white text-base tracking-wide">
            GOV MONITOR
          </div>
        </div>
        <button
          (click)="closeSidebar.emit()"
          class="lg:hidden text-slate-400 hover:text-white p-1"
        >
          <i class="ri-close-line text-xl"></i>
        </button>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div class="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Main Modules
        </div>

        <ng-container *ngFor="let item of navItems">
          <a
            *ngIf="canAccess(item.roles)"
            [routerLink]="item.route"
            routerLinkActive="bg-blue-600 text-white font-semibold shadow-md"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            (click)="closeSidebar.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition group"
          >
            <i [class]="item.icon + ' text-lg transition-transform group-hover:scale-110'"></i>
            <span>{{ item.label }}</span>
          </a>
        </ng-container>

        <!-- Admin Section -->
        <div *ngIf="authService.isAdmin()" class="pt-5 px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Administration & Compliance
        </div>

        <ng-container *ngFor="let item of adminNavItems">
          <a
            *ngIf="canAccess(item.roles)"
            [routerLink]="item.route"
            routerLinkActive="bg-blue-600 text-white font-semibold shadow-md"
            (click)="closeSidebar.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition group"
          >
            <i [class]="item.icon + ' text-lg transition-transform group-hover:scale-110'"></i>
            <span>{{ item.label }}</span>
          </a>
        </ng-container>
      </div>

      <!-- Sidebar Footer -->
      <div class="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span class="text-slate-300 font-medium">Monitoring Active</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-1">
          Financial Year: <span class="text-blue-400 font-semibold">2025-26</span>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  public authService = inject(AuthService);

  public navItems: NavItem[] = [
    { label: 'Executive Dashboard', route: '/dashboard', icon: 'ri-dashboard-3-line', roles: ['ADMIN', 'FINANCE_OFFICER', 'DEPARTMENT_HEAD'] },
    { label: 'Budget Management', route: '/budgets', icon: 'ri-wallet-3-line', roles: ['ADMIN', 'FINANCE_OFFICER', 'DEPARTMENT_HEAD'] },
    { label: 'Expenditure Ledger', route: '/expenditures', icon: 'ri-exchange-dollar-line', roles: ['ADMIN', 'FINANCE_OFFICER', 'DEPARTMENT_HEAD'] },
    { label: 'Anomaly & Alerts', route: '/alerts', icon: 'ri-alarm-warning-line', roles: ['ADMIN', 'FINANCE_OFFICER', 'DEPARTMENT_HEAD'] },
    { label: 'Departments Registry', route: '/departments', icon: 'ri-building-4-line', roles: ['ADMIN', 'FINANCE_OFFICER'] },
    { label: 'Reports & Export', route: '/reports', icon: 'ri-file-chart-line', roles: ['ADMIN', 'FINANCE_OFFICER', 'DEPARTMENT_HEAD'] },
  ];

  public adminNavItems: NavItem[] = [
    { label: 'User & Access Mgmt', route: '/users', icon: 'ri-team-line', roles: ['ADMIN'] },
    { label: 'Audit Trail Logs', route: '/audit-logs', icon: 'ri-history-line', roles: ['ADMIN'] },
    { label: 'Anomaly Thresholds', route: '/settings', icon: 'ri-settings-4-line', roles: ['ADMIN'] },
  ];

  public canAccess(roles: string[]): boolean {
    return this.authService.hasAnyRole(roles as any);
  }
}
