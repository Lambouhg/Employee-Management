import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent, NavMenuItem } from '@shared/components/navbar/navbar.component';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';
import {
  LucideAngularModule,
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  FileText,
  UserCheck,
  CheckSquare,
  CalendarX
} from 'lucide-angular';

@Component({
  selector: 'app-dept-manager-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, LucideAngularModule],
  template: `
    <div class="flex h-screen overflow-hidden">
      <!-- Reusable Navbar/Sidebar -->
      <app-navbar 
        [currentUser]="currentUser" 
        [menuItems]="menuItems"
        [activeRoute]="activeRoute">
      </app-navbar>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col bg-gray-50 overflow-auto">
        <main class="p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class DeptManagerLayoutComponent implements OnInit {
  private authService = inject(AuthService);

  currentUser: User | null = null;
  activeRoute = '';

  menuItems: NavMenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, route: '/dept-manager/dashboard' },
    { label: 'Employees', icon: Users, route: '/dept-manager/employees' },
    { label: 'Weekly Plans', icon: Calendar, route: '/dept-manager/plans' },
    { label: 'Assign Shifts', icon: UserCheck, route: '/dept-manager/shift-assignment' },
    { label: 'Approve Shifts', icon: CheckSquare, route: '/dept-manager/shift-registrations' },
    { label: 'Leave Requests', icon: CalendarX, route: '/dept-manager/leaves' },
    { label: 'Staff Schedules', icon: ClipboardList, route: '/dept-manager/schedules' }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe();
    }
  }
}
