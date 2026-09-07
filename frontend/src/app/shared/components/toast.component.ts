import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="pointer-events-auto p-4 rounded-xl shadow-xl border flex items-start gap-3 transform transition-all duration-300 animate-slide-in"
        [ngClass]="{
          'bg-emerald-50 border-emerald-300 text-emerald-900': toast.type === 'success',
          'bg-rose-50 border-rose-300 text-rose-900': toast.type === 'error',
          'bg-amber-50 border-amber-300 text-amber-900': toast.type === 'warning',
          'bg-blue-50 border-blue-300 text-blue-900': toast.type === 'info'
        }"
      >
        <div class="text-xl flex-shrink-0">
          <i *ngIf="toast.type === 'success'" class="ri-checkbox-circle-fill text-emerald-600"></i>
          <i *ngIf="toast.type === 'error'" class="ri-error-warning-fill text-rose-600"></i>
          <i *ngIf="toast.type === 'warning'" class="ri-alert-fill text-amber-600"></i>
          <i *ngIf="toast.type === 'info'" class="ri-information-fill text-blue-600"></i>
        </div>
        <div class="flex-1">
          <div class="font-semibold text-sm">{{ toast.title }}</div>
          <div class="text-xs mt-0.5 opacity-90 leading-relaxed">{{ toast.message }}</div>
        </div>
        <button
          (click)="toastService.remove(toast.id)"
          class="text-slate-400 hover:text-slate-700 transition p-1"
        >
          <i class="ri-close-line text-lg"></i>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-slide-in {
        animation: slideIn 0.25s ease-out forwards;
      }
    `,
  ],
})
export class ToastComponent {
  public toastService = inject(ToastService);
}
