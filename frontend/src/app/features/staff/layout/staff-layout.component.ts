import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { LucideAngularModule, CalendarDays, Calendar, ClipboardList, CheckCircle, FileText, User, LogOut } from 'lucide-angular';

interface MenuItem {
  label: string;
  icon: any;
  route: string;
}

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="flex h-screen bg-gray-50">
      <!-- Sidebar -->
      <aside class="w-64 bg-white shadow-lg">
        <div class="p-6 border-b">
          <h1 class="text-2xl font-bold text-indigo-600">Staff Portal</h1>
          <p *ngIf="currentUser" class="text-sm text-gray-600 mt-1">{{ currentUser.fullName }}</p>
        </div>

        <!-- Navigation -->
        <nav class="p-4">
          <ul class="space-y-2">
            <li *ngFor="let item of menuItems">
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-indigo-50 text-indigo-700"
                class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-indigo-600">
                <lucide-icon [img]="item.icon" class="w-5 h-5"></lucide-icon>
                <span class="font-medium">{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </nav>

        <!-- Logout Button -->
        <div class="absolute bottom-0 w-64 p-4 border-t bg-white">
          <button
            (click)="logout()"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors">
            <lucide-icon [img]="LogOutIcon" class="w-5 h-5"></lucide-icon>
            <span class="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class StaffLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser: any = null;
  LogOutIcon = LogOut;

  menuItems: MenuItem[] = [
    { label: 'My Schedule', icon: CalendarDays, route: '/staff/my-schedule' },
    { label: 'Available Shifts', icon: Calendar, route: '/staff/available-shifts' },
    { label: 'My Registrations', icon: ClipboardList, route: '/staff/my-registrations' },
    { label: 'Attendance', icon: CheckCircle, route: '/staff/attendance' },
    { label: 'Leave Requests', icon: FileText, route: '/staff/leaves' },
    { label: 'Profile', icon: User, route: '/staff/profile' }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
