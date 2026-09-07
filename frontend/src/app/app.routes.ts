import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./features/budgets/budgets.component').then((m) => m.BudgetsComponent),
      },
      {
        path: 'expenditures',
        loadComponent: () =>
          import('./features/expenditures/expenditures.component').then((m) => m.ExpendituresComponent),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./features/alerts/alerts.component').then((m) => m.AlertsComponent),
      },
      {
        path: 'departments',
        loadComponent: () =>
          import('./features/departments/departments.component').then((m) => m.DepartmentsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'FINANCE_OFFICER'] },
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/audit-logs/audit-logs.component').then((m) => m.AuditLogsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
