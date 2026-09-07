import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
      <!-- Accent Top Border -->
      <div class="absolute top-0 left-0 right-0 h-1" [ngClass]="accentColorClass"></div>

      <div class="flex items-start justify-between">
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {{ title }}
          </div>
          <div class="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-tight">
            {{ value }}
          </div>
          <div *ngIf="subtitle" class="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span [ngClass]="subColorClass">{{ subtitle }}</span>
          </div>
        </div>

        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-xs transition-transform group-hover:scale-110" [ngClass]="iconBgClass">
          <i [class]="icon"></i>
        </div>
      </div>
    </div>
  `,
})
export class KpiCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() subtitle?: string;
  @Input() subColorClass = 'text-slate-500';
  @Input() icon = 'ri-money-dollar-circle-line';
  @Input() accentColorClass = 'bg-blue-600';
  @Input() iconBgClass = 'bg-blue-50 text-blue-600';
}
