import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';
import { NavbarComponent, NavMenuItem } from '../../shared/components/navbar/navbar.component';
import { LayoutDashboard, Users, Settings } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  currentUser: User | null = null;

  menuItems: NavMenuItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      route: '/dashboard'
    },
    {
      label: 'Quản lý nhân viên',
      icon: Users,
      route: '/manager/employees',
      requiredPermission: 'manage_all_employees'
    },
    {
      label: 'Quản trị hệ thống',
      icon: Settings,
      route: '/dashboard/admin',
      requiredRole: 'admin'
    }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Fetch full user details with permissions after dashboard loads
    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe({
        next: (user) => {
          console.log('User details loaded:', user);
        },
        error: (err) => {
          console.error('Failed to load user details:', err);
        }
      });
    }
  }

  getUserInitials(): string {
    if (!this.currentUser?.fullName) return '?';
    const names = this.currentUser.fullName.split(' ');
    return names.length > 1 
      ? names[0][0] + names[names.length - 1][0]
      : names[0][0];
  }

  getEmploymentType(): string {
    return this.currentUser?.employmentType === 'FULL_TIME' ? 'Toàn thời gian' : 'Bán thời gian';
  }

  formatPermission(permission: string): string {
    return permission.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }


}
