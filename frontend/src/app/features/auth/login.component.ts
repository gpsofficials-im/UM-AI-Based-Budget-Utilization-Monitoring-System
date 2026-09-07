import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Background Ambient Glow -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <!-- Emblem / Brand Header -->
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-4 border border-blue-400/30">
            <i class="ri-government-line text-3xl"></i>
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Budget Utilization
          </h2>
          <p class="mt-1 text-sm text-slate-400">
            Government Public Financial Monitoring & Anomaly Portal
          </p>
        </div>

        <!-- Login Card -->
        <div class="mt-8 bg-slate-800/90 border border-slate-700/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <form (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Official Email Address
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i class="ri-mail-line"></i>
                </div>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="e.g. admin@gov.in"
                  class="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i class="ri-lock-password-line"></i>
                </div>
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="Enter security password"
                  class="block w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                />
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  <i [class]="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              [disabled]="loading"
              class="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-60 cursor-pointer"
            >
              <i *ngIf="loading" class="ri-loader-4-line animate-spin text-lg"></i>
              <span>{{ loading ? 'Authenticating...' : 'Sign In to Portal' }}</span>
              <i *ngIf="!loading" class="ri-arrow-right-line"></i>
            </button>
          </form>

          <!-- Quick Demo Accounts Switcher -->
          <div class="mt-8 pt-6 border-t border-slate-700/60">
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Credentials
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="fillCredentials('admin@gov.in', 'Admin@123')"
                class="px-2.5 py-2 bg-slate-900/80 hover:bg-slate-700/80 border border-slate-600/70 rounded-lg text-left transition cursor-pointer"
              >
                <div class="text-xs font-bold text-purple-400">Admin</div>
                <div class="text-[10px] text-slate-400 truncate">admin&#64;gov.in</div>
              </button>

              <button
                type="button"
                (click)="fillCredentials('finance@gov.in', 'Finance@123')"
                class="px-2.5 py-2 bg-slate-900/80 hover:bg-slate-700/80 border border-slate-600/70 rounded-lg text-left transition cursor-pointer"
              >
                <div class="text-xs font-bold text-blue-400">Finance Officer</div>
                <div class="text-[10px] text-slate-400 truncate">finance&#64;gov.in</div>
              </button>

              <button
                type="button"
                (click)="fillCredentials('depthead.it@gov.in', 'Dept@123')"
                class="px-2.5 py-2 bg-slate-900/80 hover:bg-slate-700/80 border border-slate-600/70 rounded-lg text-left transition cursor-pointer"
              >
                <div class="text-xs font-bold text-emerald-400">Dept Head (IT)</div>
                <div class="text-[10px] text-slate-400 truncate">depthead.it&#64;gov.in</div>
              </button>

              <button
                type="button"
                (click)="fillCredentials('depthead.health@gov.in', 'Dept@123')"
                class="px-2.5 py-2 bg-slate-900/80 hover:bg-slate-700/80 border border-slate-600/70 rounded-lg text-left transition cursor-pointer"
              >
                <div class="text-xs font-bold text-emerald-400">Dept Head (Health)</div>
                <div class="text-[10px] text-slate-400 truncate">depthead.health&#64;gov.in</div>
              </button>
            </div>
          </div>
        </div>

        <div class="text-center mt-6 text-xs text-slate-500">
          Secure Ministry & Enterprise Financial Monitoring Engine &copy; 2026
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  public email = 'admin@gov.in';
  public password = 'Admin@123';
  public showPassword = false;
  public loading = false;

  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  public fillCredentials(email: string, pass: string): void {
    this.email = email;
    this.password = pass;
    this.toastService.info('Credentials Applied', `Selected demo account: ${email}`);
  }

  public onSubmit(): void {
    if (!this.email || !this.password) {
      this.toastService.warning('Validation Error', 'Please enter both email and password');
      return;
    }

    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.success('Welcome Back', `Logged in as ${res.data.user.name}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        // error already toasted by interceptor
      },
    });
  }
}
