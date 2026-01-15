import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';
import { NavbarComponent, NavMenuItem } from '../../../shared/components/navbar/navbar.component';
import { LayoutDashboard, Users, CheckCircle, FileText } from 'lucide-angular';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  currentUser: User | null = null;

  menuItems: NavMenuItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      route: '/manager'
    },
    {
      label: 'Quản lý nhân viên',
      icon: Users,
      route: '/manager/employees',
      requiredPermission: 'manage_all_employees'
    },
    {
      label: 'Phê duyệt',
      icon: CheckCircle,
      route: '/manager/approvals'
    },
    {
      label: 'Báo cáo',
      icon: FileText,
      route: '/manager/reports'
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

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
