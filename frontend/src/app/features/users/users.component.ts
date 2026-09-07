import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User, Department, UserRole } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            User Accounts & Role-Based Access Control (RBAC)
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Administer government officer accounts, assign roles, departments, and maintain security credentials
          </p>
        </div>

        <button
          (click)="openCreateModal()"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm cursor-pointer"
        >
          <i class="ri-user-add-line text-base"></i>
          <span>Create Officer Account</span>
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="relative">
          <i class="ri-search-line absolute left-3 top-2.5 text-slate-400 text-sm"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="loadUsers()"
            placeholder="Search Name or Email..."
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          [(ngModel)]="filterRole"
          (change)="loadUsers()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="FINANCE_OFFICER">FINANCE_OFFICER</option>
          <option value="DEPARTMENT_HEAD">DEPARTMENT_HEAD</option>
        </select>

        <select
          [(ngModel)]="filterDept"
          (change)="loadUsers()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Departments</option>
          <option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</option>
        </select>

        <select
          [(ngModel)]="filterStatus"
          (change)="loadUsers()"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      <!-- Users Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th class="py-3 px-4">Officer Name & Email</th>
                <th class="py-3 px-4">System Role</th>
                <th class="py-3 px-4">Assigned Department</th>
                <th class="py-3 px-4">Last Login</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngIf="loading">
                <td colspan="6" class="text-center py-8 text-slate-400">
                  <i class="ri-loader-4-line animate-spin text-2xl mb-1"></i>
                  <div>Loading user accounts...</div>
                </td>
              </tr>

              <tr *ngFor="let u of users" class="hover:bg-slate-50/70 transition">
                <td class="py-3.5 px-4">
                  <div class="font-bold text-slate-900 text-xs">{{ u.name }}</div>
                  <div class="text-[11px] text-slate-500 font-mono">{{ u.email }}</div>
                </td>
                <td class="py-3.5 px-4">
                  <span
                    class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    [ngClass]="{
                      'bg-purple-100 text-purple-800 border border-purple-200': u.role === 'ADMIN',
                      'bg-blue-100 text-blue-800 border border-blue-200': u.role === 'FINANCE_OFFICER',
                      'bg-emerald-100 text-emerald-800 border border-emerald-200': u.role === 'DEPARTMENT_HEAD'
                    }"
                  >
                    {{ u.role.replace('_', ' ') }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-slate-700">
                  <span *ngIf="u.department" class="font-medium text-slate-800">
                    {{ getDeptName(u.department) }}
                  </span>
                  <span *ngIf="!u.department" class="text-slate-400 italic">
                    {{ u.role === 'ADMIN' ? 'Global Access' : 'Unassigned' }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-slate-500 text-[11px]">
                  {{ u.lastLogin ? (u.lastLogin | date: 'dd MMM yyyy, hh:mm a') : 'Never' }}
                </td>
                <td class="py-3.5 px-4 text-center">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    [ngClass]="u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'"
                  >
                    {{ u.status }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      (click)="openEditModal(u)"
                      class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      title="Edit User"
                    >
                      <i class="ri-edit-line text-sm"></i>
                    </button>
                    <button
                      *ngIf="u._id !== authService.currentUser()?.id && u._id !== authService.currentUser()?._id"
                      (click)="deleteUser(u)"
                      class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete User"
                    >
                      <i class="ri-delete-bin-line text-sm"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal: Create / Edit User -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900">
              {{ isEditing ? 'Edit Officer Profile' : 'Register New Officer' }}
            </h3>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 p-1">
              <i class="ri-close-line text-xl"></i>
            </button>
          </div>

          <form (ngSubmit)="saveUser()" class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                [(ngModel)]="formData.name"
                name="name"
                required
                placeholder="e.g. Dr. Rajesh Verma"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Official Email Address *</label>
              <input
                type="email"
                [(ngModel)]="formData.email"
                name="email"
                required
                [disabled]="isEditing"
                placeholder="officer@gov.in"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                {{ isEditing ? 'Reset Password (leave empty to keep current)' : 'Account Password *' }}
              </label>
              <input
                type="password"
                [(ngModel)]="formData.password"
                name="password"
                [required]="!isEditing"
                placeholder="Minimum 6 characters"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                <select
                  [(ngModel)]="formData.role"
                  name="role"
                  required
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="FINANCE_OFFICER">FINANCE_OFFICER</option>
                  <option value="DEPARTMENT_HEAD">DEPARTMENT_HEAD</option>
                </select>
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

            <div *ngIf="formData.role === 'DEPARTMENT_HEAD'">
              <label class="block text-xs font-semibold text-slate-700 mb-1">Assigned Department *</label>
              <select
                [(ngModel)]="formData.department"
                name="department"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                <option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</option>
              </select>
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
                {{ saving ? 'Saving...' : isEditing ? 'Update Officer' : 'Create Account' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class UsersComponent implements OnInit {
  public authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  public users: User[] = [];
  public departments: Department[] = [];
  public loading = false;
  public saving = false;

  // Filters
  public searchQuery = '';
  public filterRole = 'ALL';
  public filterDept = 'ALL';
  public filterStatus = 'ALL';

  // Modal
  public showModal = false;
  public isEditing = false;
  public currentUserId: string | null = null;
  public formData: any = {
    name: '',
    email: '',
    password: '',
    role: 'DEPARTMENT_HEAD',
    department: '',
    status: 'ACTIVE',
  };

  ngOnInit(): void {
    this.loadDepartments();
    this.loadUsers();
  }

  public loadDepartments(): void {
    this.apiService.getDepartments().subscribe({
      next: (res) => (this.departments = res.data),
    });
  }

  public loadUsers(): void {
    this.loading = true;
    const filters: any = {};
    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.filterRole !== 'ALL') filters.role = this.filterRole;
    if (this.filterDept !== 'ALL') filters.departmentId = this.filterDept;
    if (this.filterStatus !== 'ALL') filters.status = this.filterStatus;

    this.apiService.getUsers(filters).subscribe({
      next: (res) => {
        this.users = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  public getDeptName(dept: any): string {
    if (!dept) return 'N/A';
    if (typeof dept === 'object' && dept.name) return dept.name;
    const match = this.departments.find((d) => d._id === dept);
    return match ? match.name : dept;
  }

  public openCreateModal(): void {
    this.isEditing = false;
    this.currentUserId = null;
    this.formData = {
      name: '',
      email: '',
      password: '',
      role: 'DEPARTMENT_HEAD',
      department: this.departments[0]?._id || '',
      status: 'ACTIVE',
    };
    this.showModal = true;
  }

  public openEditModal(user: User): void {
    this.isEditing = true;
    this.currentUserId = user.id || user._id || null;
    this.formData = {
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department ? (typeof user.department === 'object' ? (user.department as any)._id : user.department) : '',
      status: user.status,
    };
    this.showModal = true;
  }

  public closeModal(): void {
    this.showModal = false;
  }

  public saveUser(): void {
    if (!this.formData.name || !this.formData.email || (!this.isEditing && !this.formData.password)) {
      this.toastService.warning('Required Fields', 'Please complete all required user fields');
      return;
    }

    this.saving = true;
    if (this.isEditing && this.currentUserId) {
      this.apiService.updateUser(this.currentUserId, this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.success('Success', 'User profile updated successfully');
          this.closeModal();
          this.loadUsers();
        },
        error: () => (this.saving = false),
      });
    } else {
      this.apiService.createUser(this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.success('Success', 'User account created successfully');
          this.closeModal();
          this.loadUsers();
        },
        error: () => (this.saving = false),
      });
    }
  }

  public deleteUser(user: User): void {
    const uid = user.id || user._id;
    if (!uid) return;
    if (confirm(`Are you sure you want to delete user account '${user.name}' (${user.email})?`)) {
      this.apiService.deleteUser(uid).subscribe({
        next: () => {
          this.toastService.success('Deleted', 'User account deleted successfully');
          this.loadUsers();
        },
      });
    }
  }
}
