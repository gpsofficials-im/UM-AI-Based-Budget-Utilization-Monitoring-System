import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Department } from '../../core/models';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Departments & Ministries Registry
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Manage organizational divisions, authorized heads, contact details, and view real-time department financial health
          </p>
        </div>

        <div *ngIf="authService.isAdmin()" class="flex items-center gap-3">
          <button
            (click)="openCreateModal()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm cursor-pointer"
          >
            <i class="ri-add-circle-line text-base"></i>
            <span>Add Department</span>
          </button>
        </div>
      </div>

      <!-- Department Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div *ngIf="loading" class="col-span-full py-12 text-center text-slate-400 text-xs">
          <i class="ri-loader-4-line animate-spin text-3xl mb-1"></i>
          <div>Loading departments...</div>
        </div>

        <div
          *ngFor="let dept of departments"
          class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
        >
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-800 font-mono">
                {{ dept.code }}
              </span>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                [ngClass]="dept.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'"
              >
                {{ dept.status }}
              </span>
            </div>

            <h3 class="text-base font-bold text-slate-900 leading-snug">
              {{ dept.name }}
            </h3>

            <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {{ dept.description || 'No description provided.' }}
            </p>

            <div class="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div *ngIf="dept.headOfDepartment" class="flex items-center gap-2">
                <i class="ri-user-star-line text-slate-400"></i>
                <span class="font-medium text-slate-800">{{ dept.headOfDepartment }}</span>
              </div>
              <div *ngIf="dept.contactEmail" class="flex items-center gap-2">
                <i class="ri-mail-line text-slate-400"></i>
                <span class="text-slate-500">{{ dept.contactEmail }}</span>
              </div>
              <div *ngIf="dept.contactPhone" class="flex items-center gap-2">
                <i class="ri-phone-line text-slate-400"></i>
                <span class="text-slate-500">{{ dept.contactPhone }}</span>
              </div>
            </div>
          </div>

          <div *ngIf="authService.isAdmin()" class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              (click)="openEditModal(dept)"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition cursor-pointer"
            >
              <i class="ri-edit-line mr-1"></i>
              Edit
            </button>
            <button
              (click)="deleteDepartment(dept)"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 transition cursor-pointer"
            >
              <i class="ri-delete-bin-line mr-1"></i>
              Deactivate
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: Add / Edit Department -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900">
              {{ isEditing ? 'Edit Department Information' : 'Register New Department' }}
            </h3>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 p-1">
              <i class="ri-close-line text-xl"></i>
            </button>
          </div>

          <form (ngSubmit)="saveDepartment()" class="space-y-3.5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  [(ngModel)]="formData.code"
                  name="code"
                  required
                  [disabled]="isEditing"
                  placeholder="e.g. MEITY"
                  class="w-full px-3 py-2 text-xs uppercase font-mono border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
                <select
                  [(ngModel)]="formData.status"
                  name="status"
                  required
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Full Department / Ministry Name *</label>
              <input
                type="text"
                [(ngModel)]="formData.name"
                name="name"
                required
                placeholder="e.g. Ministry of Electronics & IT"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Head of Department / Secretary</label>
              <input
                type="text"
                [(ngModel)]="formData.headOfDepartment"
                name="headOfDepartment"
                placeholder="e.g. Dr. Alok Verma, Joint Secretary"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  [(ngModel)]="formData.contactEmail"
                  name="contactEmail"
                  placeholder="dept@gov.in"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  [(ngModel)]="formData.contactPhone"
                  name="contactPhone"
                  placeholder="+91 11 2436 0199"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                [(ngModel)]="formData.description"
                name="description"
                rows="2"
                placeholder="Core mission and portfolio responsibilities..."
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                (click)="closeModal()"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="saving"
                class="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {{ saving ? 'Saving...' : isEditing ? 'Update Department' : 'Register Department' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class DepartmentsComponent implements OnInit {
  public authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  public departments: Department[] = [];
  public loading = false;
  public saving = false;

  // Modal
  public showModal = false;
  public isEditing = false;
  public currentDeptId: string | null = null;
  public formData: any = {
    code: '',
    name: '',
    headOfDepartment: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    status: 'ACTIVE',
  };

  ngOnInit(): void {
    this.loadDepartments();
  }

  public loadDepartments(): void {
    this.loading = true;
    this.apiService.getDepartments().subscribe({
      next: (res) => {
        this.departments = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  public openCreateModal(): void {
    this.isEditing = false;
    this.currentDeptId = null;
    this.formData = {
      code: '',
      name: '',
      headOfDepartment: '',
      contactEmail: '',
      contactPhone: '',
      description: '',
      status: 'ACTIVE',
    };
    this.showModal = true;
  }

  public openEditModal(dept: Department): void {
    this.isEditing = true;
    this.currentDeptId = dept._id;
    this.formData = {
      code: dept.code,
      name: dept.name,
      headOfDepartment: dept.headOfDepartment || '',
      contactEmail: dept.contactEmail || '',
      contactPhone: dept.contactPhone || '',
      description: dept.description || '',
      status: dept.status,
    };
    this.showModal = true;
  }

  public closeModal(): void {
    this.showModal = false;
  }

  public saveDepartment(): void {
    if (!this.formData.code || !this.formData.name) {
      this.toastService.warning('Required Fields', 'Department code and name are required');
      return;
    }

    this.saving = true;
    if (this.isEditing && this.currentDeptId) {
      this.apiService.updateDepartment(this.currentDeptId, this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.success('Success', 'Department updated successfully');
          this.closeModal();
          this.loadDepartments();
        },
        error: () => (this.saving = false),
      });
    } else {
      this.apiService.createDepartment(this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.success('Success', 'Department registered successfully');
          this.closeModal();
          this.loadDepartments();
        },
        error: () => (this.saving = false),
      });
    }
  }

  public deleteDepartment(dept: Department): void {
    if (confirm(`Deactivate department '${dept.name}' (${dept.code})?`)) {
      this.apiService.deleteDepartment(dept._id).subscribe({
        next: (res) => {
          this.toastService.success('Success', res.message || 'Department updated');
          this.loadDepartments();
        },
      });
    }
  }
}
