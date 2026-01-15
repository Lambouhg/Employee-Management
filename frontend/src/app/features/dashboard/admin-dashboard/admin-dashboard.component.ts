import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';
import { NavbarComponent, NavMenuItem } from '../../../shared/components/navbar/navbar.component';
import { LayoutDashboard, Users, Shield, Settings, BarChart3 } from 'lucide-angular';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  
  currentUser: User | null = null;

  menuItems: NavMenuItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      route: '/dashboard'
    },
    {
      label: 'Quản lý người dùng',
      icon: Users,
      route: '/dashboard/admin/users'
    },
    {
      label: 'Quản lý vai trò',
      icon: Shield,
      route: '/dashboard/admin/roles'
    },
    {
      label: 'Quản lý quyền hạn',
      icon: Settings,
      route: '/dashboard/admin/permissions'
    },
    {
      label: 'Thống kê',
      icon: BarChart3,
      route: '/dashboard/admin/statistics'
    }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe();
    }
  }
}
