import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../shared/components/navbar.component';
import { SidebarComponent } from '../shared/components/sidebar.component';
import { ToastComponent } from '../shared/components/toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent, ToastComponent],
  template: `
    <div class="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <!-- Sidebar Navigation -->
      <app-sidebar [isOpen]="sidebarOpen" (closeSidebar)="sidebarOpen = false"></app-sidebar>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top Navbar -->
        <app-navbar (toggleSidebar)="sidebarOpen = !sidebarOpen"></app-navbar>

        <!-- Dynamic Routed Content -->
        <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Floating Toast Notifications -->
      <app-toast></app-toast>
    </div>
  `,
})
export class MainLayoutComponent {
  public sidebarOpen = false;
}
