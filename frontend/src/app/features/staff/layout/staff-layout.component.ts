import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent, NavMenuItem } from '@shared/components/navbar/navbar.component';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';
import { 
  LucideAngularModule,
  LayoutDashboard,
  CalendarDays,
  Calendar,
  ClipboardList,
  CheckCircle,
  FileText,
  User as UserIcon
} from 'lucide-angular';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, LucideAngularModule],
  templateUrl: './staff-layout.component.html',
})
export class StaffLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  
  currentUser: User | null = null;
  activeRoute = '';

  menuItems: NavMenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, route: '/staff/dashboard' },
    { label: 'My Schedule', icon: CalendarDays, route: '/staff/my-schedule' },
    { label: 'Available Shifts', icon: Calendar, route: '/staff/available-shifts' },
    { label: 'My Registrations', icon: ClipboardList, route: '/staff/my-registrations' },
    { label: 'Attendance', icon: CheckCircle, route: '/staff/attendance' },
    { label: 'Leave Requests', icon: FileText, route: '/staff/leaves' },
    { label: 'Profile', icon: UserIcon, route: '/staff/profile' }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe();
    }
  }
}
