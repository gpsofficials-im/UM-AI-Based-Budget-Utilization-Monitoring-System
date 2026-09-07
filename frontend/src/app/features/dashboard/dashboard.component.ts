import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { KpiCardComponent } from '../../shared/components/kpi-card.component';
import { Department, Alert, DashboardSummary } from '../../core/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, KpiCardComponent],
  template: `
    <div class="space-y-6">
      <!-- Top Bar: Welcome, Filters & Quick Actions -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Financial Health & Utilization Executive Overview
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Real-time public expenditure auditing and predictive irregularity detection
          </p>
        </div>

        <!-- Filters Bar -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Financial Year Filter -->
          <div class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <i class="ri-calendar-event-line text-slate-500 text-sm"></i>
            <span class="text-xs font-semibold text-slate-600">FY:</span>
            <select
              [(ngModel)]="selectedFY"
              (change)="loadDashboardData()"
              class="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="2025-26">2025-26 (Active)</option>
              <option value="2024-25">2024-25</option>
              <option value="2026-27">2026-27 (Projected)</option>
              <option value="ALL">All Financial Years</option>
            </select>
          </div>

          <!-- Department Filter (if Admin or Finance) -->
          <div *ngIf="!authService.isDeptHead()" class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <i class="ri-building-line text-slate-500 text-sm"></i>
            <span class="text-xs font-semibold text-slate-600">Dept:</span>
            <select
              [(ngModel)]="selectedDept"
              (change)="loadDashboardData()"
              class="bg-transparent text-xs font-medium text-slate-800 focus:outline-hidden max-w-[140px] truncate cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</option>
            </select>
          </div>

          <!-- Refresh Button -->
          <button
            (click)="loadDashboardData()"
            [disabled]="loading"
            class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Reload Metrics"
          >
            <i class="ri-refresh-line text-base" [ngClass]="{ 'animate-spin': loading }"></i>
          </button>
        </div>
      </div>

      <!-- KPI Metric Grid (8 Cards) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Card 1: Total Allocated Budget -->
        <app-kpi-card
          title="Total Allocated Budget"
          [value]="formatCurrency(summary?.totalBudget || 0)"
          [subtitle]="'Approved: ' + formatCurrency(summary?.totalApproved || 0)"
          subColorClass="text-slate-500 font-medium"
          icon="ri-wallet-3-line"
          accentColorClass="bg-blue-600"
          iconBgClass="bg-blue-50 text-blue-600"
        ></app-kpi-card>

        <!-- Card 2: Total Expenditure -->
        <app-kpi-card
          title="Total Expenditure"
          [value]="formatCurrency(summary?.totalSpent || 0)"
          [subtitle]="(summary?.utilizationPercentage || 0) + '% Utilized'"
          subColorClass="text-indigo-600 font-semibold"
          icon="ri-hand-coin-line"
          accentColorClass="bg-indigo-600"
          iconBgClass="bg-indigo-50 text-indigo-600"
        ></app-kpi-card>

        <!-- Card 3: Remaining Budget -->
        <app-kpi-card
          title="Remaining Balance"
          [value]="formatCurrency(summary?.remainingBudget || 0)"
          [subtitle]="(summary?.remainingBudget || 0) < 0 ? 'Deficit Warning' : 'Available for Deployment'"
          [subColorClass]="(summary?.remainingBudget || 0) < 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'"
          icon="ri-bank-card-line"
          [accentColorClass]="(summary?.remainingBudget || 0) < 0 ? 'bg-rose-600' : 'bg-emerald-600'"
          [iconBgClass]="(summary?.remainingBudget || 0) < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'"
        ></app-kpi-card>

        <!-- Card 4: Utilization Band -->
        <app-kpi-card
          title="Overall Utilization"
          [value]="(summary?.utilizationPercentage || 0) + '%'"
          [subtitle]="summary?.utilizationBandLabel || 'Calculating...'"
          [subColorClass]="getBandColorClass(summary?.utilizationBand)"
          icon="ri-pie-chart-line"
          [accentColorClass]="getBandAccentClass(summary?.utilizationBand)"
          [iconBgClass]="getBandIconBgClass(summary?.utilizationBand)"
        ></app-kpi-card>

        <!-- Card 5: Active Alerts -->
        <app-kpi-card
          title="Active Financial Alerts"
          [value]="summary?.activeAlerts || 0"
          [subtitle]="(summary?.criticalAlerts || 0) + ' Critical Actions Required'"
          subColorClass="text-amber-600 font-bold"
          icon="ri-alarm-warning-line"
          accentColorClass="bg-amber-500"
          iconBgClass="bg-amber-50 text-amber-600"
        ></app-kpi-card>

        <!-- Card 6: Critical Irregularities -->
        <app-kpi-card
          title="Critical Anomalies"
          [value]="summary?.criticalAlerts || 0"
          subtitle="Immediate Audit Triggered"
          subColorClass="text-rose-600 font-bold"
          icon="ri-error-warning-line"
          accentColorClass="bg-rose-600"
          iconBgClass="bg-rose-50 text-rose-600"
        ></app-kpi-card>

        <!-- Card 7: Monitored Departments -->
        <app-kpi-card
          title="Active Departments"
          [value]="summary?.totalDepartments || 0"
          subtitle="Public Ministries & Wings"
          subColorClass="text-slate-500"
          icon="ri-government-line"
          accentColorClass="bg-slate-700"
          iconBgClass="bg-slate-100 text-slate-700"
        ></app-kpi-card>

        <!-- Card 8: Under-utilized / Overspending Count -->
        <app-kpi-card
          title="Flagged Portfolios"
          [value]="(summary?.underUtilizedCount || 0) + (summary?.overspendingCount || 0)"
          [subtitle]="(summary?.overspendingCount || 0) + ' Overspent / ' + (summary?.underUtilizedCount || 0) + ' Under-utilized'"
          subColorClass="text-purple-600 font-semibold"
          icon="ri-scales-3-line"
          accentColorClass="bg-purple-600"
          iconBgClass="bg-purple-50 text-purple-600"
        ></app-kpi-card>
      </div>

      <!-- Charts Row 1: Budget vs Expenditure & Department Utilization -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Chart 1: Budget vs Expenditure Comparison -->
        <div class="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Budget Allocation vs Actual Expenditure
              </h2>
              <p class="text-xs text-slate-500">Comparing total allocated funds against logged disbursements</p>
            </div>
            <span class="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700">Bar Analytics</span>
          </div>
          <div class="relative h-72 w-full">
            <canvas #budgetVsExpChart></canvas>
          </div>
        </div>

        <!-- Chart 2: Department Utilization Rate (%) -->
        <div class="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Department Utilization Rates (%)
              </h2>
              <p class="text-xs text-slate-500">Benchmark target range: 40% - 80%</p>
            </div>
            <span class="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700">Target Scale</span>
          </div>
          <div class="relative h-72 w-full">
            <canvas #deptUtilChart></canvas>
          </div>
        </div>
      </div>

      <!-- Charts Row 2: Monthly Expenditure Trend & Distributions -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Chart 3: Monthly Expenditure Trend (Line) -->
        <div class="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Monthly Expenditure Timeline
              </h2>
              <p class="text-xs text-slate-500">Monthly fiscal burn rate from April to March</p>
            </div>
            <span class="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700">Fiscal Curve</span>
          </div>
          <div class="relative h-64 w-full">
            <canvas #monthlyTrendChart></canvas>
          </div>
        </div>

        <!-- Chart 4: Expense Breakdown by Category (Doughnut) -->
        <div class="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h2 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Category Split
              </h2>
              <p class="text-[11px] text-slate-500">Disbursement type</p>
            </div>
          </div>
          <div class="relative h-56 w-full flex items-center justify-center">
            <canvas #categoryChart></canvas>
          </div>
        </div>

        <!-- Chart 5: Alert Severity Breakdown (Doughnut) -->
        <div class="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h2 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Anomaly Severity
              </h2>
              <p class="text-[11px] text-slate-500">Open risk levels</p>
            </div>
          </div>
          <div class="relative h-56 w-full flex items-center justify-center">
            <canvas #severityChart></canvas>
          </div>
        </div>
      </div>

      <!-- Recent High-Priority Anomalies Section -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <i class="ri-radar-fill text-rose-600"></i>
              Active AI Anomaly Detection Alerts
            </h3>
            <p class="text-xs text-slate-500">Unresolved financial risks requiring administrative attention</p>
          </div>
          <a
            routerLink="/alerts"
            class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
          >
            <span>View All Alerts</span>
            <i class="ri-arrow-right-line"></i>
          </a>
        </div>

        <div class="divide-y divide-slate-100">
          <div *ngIf="recentAlerts.length === 0" class="p-8 text-center text-slate-400 text-xs">
            <i class="ri-shield-check-line text-3xl text-emerald-500 mb-1"></i>
            <div>No open anomalies or risk alerts detected for this selection.</div>
          </div>

          <div
            *ngFor="let alert of recentAlerts"
            class="p-4 sm:px-6 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
                [ngClass]="{
                  'bg-red-100 text-red-700': alert.severity === 'CRITICAL',
                  'bg-orange-100 text-orange-700': alert.severity === 'HIGH',
                  'bg-amber-100 text-amber-700': alert.severity === 'MEDIUM',
                  'bg-blue-100 text-blue-700': alert.severity === 'LOW'
                }"
              >
                <i
                  [class]="{
                    'ri-alarm-warning-fill': alert.alertType === 'OVERSPENDING',
                    'ri-timer-line': alert.alertType === 'UNDER_UTILIZATION',
                    'ri-flashlight-line': alert.alertType === 'SPENDING_SPIKE',
                    'ri-swap-line': alert.alertType === 'BUDGET_DEVIATION'
                  }"
                ></i>
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-xs text-slate-900">{{ alert.title }}</span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    [ngClass]="{
                      'bg-red-100 text-red-800 border border-red-300': alert.severity === 'CRITICAL',
                      'bg-orange-100 text-orange-800 border border-orange-300': alert.severity === 'HIGH',
                      'bg-amber-100 text-amber-800 border border-amber-300': alert.severity === 'MEDIUM',
                      'bg-blue-100 text-blue-800 border border-blue-300': alert.severity === 'LOW'
                    }"
                  >
                    {{ alert.severity }}
                  </span>
                  <span class="text-[11px] text-slate-400">
                    Dept: {{ alert.department?.name }}
                  </span>
                </div>
                <div class="text-xs text-slate-600 mt-1 leading-relaxed">
                  {{ alert.description }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 self-end sm:self-center">
              <a
                routerLink="/alerts"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
              >
                Resolve in Alerts &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('budgetVsExpChart') budgetVsExpRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('deptUtilChart') deptUtilRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyTrendChart') monthlyTrendRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('severityChart') severityRef!: ElementRef<HTMLCanvasElement>;

  public authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  public selectedFY = '2025-26';
  public selectedDept = 'ALL';
  public departments: Department[] = [];
  public summary: DashboardSummary | null = null;
  public recentAlerts: Alert[] = [];
  public loading = false;

  private charts: Chart[] = [];

  ngOnInit(): void {
    this.loadDepartments();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  public loadDepartments(): void {
    this.apiService.getDepartments().subscribe({
      next: (res) => {
        this.departments = res.data;
      },
    });
  }

  public loadDashboardData(): void {
    this.loading = true;

    // 1. Fetch KPI Summary
    this.apiService.getDashboardSummary(this.selectedFY, this.selectedDept).subscribe({
      next: (res) => {
        this.summary = res.data;
      },
      error: () => (this.loading = false),
    });

    // 2. Fetch Recent Alerts
    this.apiService.getAlerts({ limit: 5, status: 'OPEN' }).subscribe({
      next: (res) => {
        this.recentAlerts = res.data;
      },
    });

    // 3. Fetch Data for Charts and Render
    Promise.all([
      this.apiService.getDashboardTrends(this.selectedFY, this.selectedDept).toPromise(),
      this.apiService.getDashboardDepartments(this.selectedFY).toPromise(),
      this.apiService.getDashboardCategories(this.selectedFY, this.selectedDept).toPromise(),
      this.apiService.getDashboardAlertsDistribution().toPromise(),
    ]).then(([trendsRes, deptRes, catRes, alertDistRes]) => {
      this.loading = false;
      setTimeout(() => {
        this.renderAllCharts(trendsRes?.data, deptRes?.data, catRes?.data, alertDistRes?.data);
      }, 50);
    }).catch(() => {
      this.loading = false;
    });
  }

  private renderAllCharts(trends: any, deptStats: any[], categories: any, alertDist: any): void {
    this.destroyCharts();

    // Chart 1: Budget vs Expenditure (Bar)
    if (this.budgetVsExpRef && deptStats) {
      const labels = deptStats.map((d) => d.departmentCode || d.departmentName);
      const allocatedData = deptStats.map((d) => d.allocatedAmount / 10000000); // in Cr
      const spentData = deptStats.map((d) => d.totalExpenditure / 10000000); // in Cr

      const chart1 = new Chart(this.budgetVsExpRef.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Allocated (₹ Cr)',
              data: allocatedData,
              backgroundColor: '#3b82f6',
              borderRadius: 6,
            },
            {
              label: 'Spent (₹ Cr)',
              data: spentData,
              backgroundColor: '#10b981',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Amount in ₹ Crores', font: { size: 10 } },
              grid: { color: '#f1f5f9' },
            },
            x: { grid: { display: false } },
          },
        },
      });
      this.charts.push(chart1);
    }

    // Chart 2: Department Utilization Horizontal Bar
    if (this.deptUtilRef && deptStats) {
      const labels = deptStats.map((d) => d.departmentCode || d.departmentName);
      const utilData = deptStats.map((d) => d.utilizationPercentage);
      const bgColors = utilData.map((u) => {
        if (u < 40) return '#f59e0b'; // Low (Amber)
        if (u < 80) return '#10b981'; // Normal (Emerald)
        if (u < 100) return '#3b82f6'; // High (Blue)
        return '#ef4444'; // Overspending (Red)
      });

      const chart2 = new Chart(this.deptUtilRef.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Utilization %',
              data: utilData,
              backgroundColor: bgColors,
              borderRadius: 6,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 120,
              title: { display: true, text: 'Utilization Percentage (%)', font: { size: 10 } },
              grid: { color: '#f1f5f9' },
            },
            y: { grid: { display: false } },
          },
        },
      });
      this.charts.push(chart2);
    }

    // Chart 3: Monthly Expenditure Timeline
    if (this.monthlyTrendRef && trends) {
      const chart3 = new Chart(this.monthlyTrendRef.nativeElement, {
        type: 'line',
        data: {
          labels: trends.labels,
          datasets: [
            {
              label: 'Expenditure (₹)',
              data: trends.datasets[0].data,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointBackgroundColor: '#4f46e5',
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#f1f5f9' },
              ticks: {
                callback: (val) => '₹' + Number(val) / 10000000 + ' Cr',
              },
            },
            x: { grid: { display: false } },
          },
        },
      });
      this.charts.push(chart3);
    }

    // Chart 4: Expense Categories (Doughnut)
    if (this.categoryRef && categories) {
      const chart4 = new Chart(this.categoryRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: categories.labels,
          datasets: [
            {
              data: categories.data,
              backgroundColor: [
                '#3b82f6',
                '#10b981',
                '#f59e0b',
                '#ec4899',
                '#8b5cf6',
                '#06b6d4',
                '#64748b',
                '#a855f7',
              ],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 } } },
          },
          cutout: '65%',
        },
      });
      this.charts.push(chart4);
    }

    // Chart 5: Alert Severity Distribution (Doughnut)
    if (this.severityRef && alertDist) {
      const chart5 = new Chart(this.severityRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: alertDist.labels,
          datasets: [
            {
              data: alertDist.data,
              backgroundColor: ['#ef4444', '#f97316', '#eab308', '#3b82f6'],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 } } },
          },
          cutout: '65%',
        },
      });
      this.charts.push(chart5);
    }
  }

  public formatCurrency(val: number): string {
    if (val === 0) return '₹0.00';
    if (Math.abs(val) >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(val) >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  }

  public getBandColorClass(band?: string): string {
    switch (band) {
      case 'LOW': return 'text-amber-600 font-semibold';
      case 'NORMAL': return 'text-emerald-600 font-semibold';
      case 'HIGH': return 'text-blue-600 font-semibold';
      case 'OVERSPENDING': return 'text-rose-600 font-bold';
      default: return 'text-slate-500 font-medium';
    }
  }

  public getBandAccentClass(band?: string): string {
    switch (band) {
      case 'LOW': return 'bg-amber-500';
      case 'NORMAL': return 'bg-emerald-500';
      case 'HIGH': return 'bg-blue-600';
      case 'OVERSPENDING': return 'bg-rose-600';
      default: return 'bg-slate-400';
    }
  }

  public getBandIconBgClass(band?: string): string {
    switch (band) {
      case 'LOW': return 'bg-amber-50 text-amber-600';
      case 'NORMAL': return 'bg-emerald-50 text-emerald-600';
      case 'HIGH': return 'bg-blue-50 text-blue-600';
      case 'OVERSPENDING': return 'bg-rose-50 text-rose-600';
      default: return 'bg-slate-50 text-slate-500';
    }
  }
}
