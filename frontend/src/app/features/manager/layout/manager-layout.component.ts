import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent, NavMenuItem } from '@shared/components/navbar/navbar.component';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';
import { 
  LucideAngularModule,
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  FileText,
  BarChart3,
  TrendingUp
} from 'lucide-angular';

@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, LucideAngularModule],
  templateUrl: './manager-layout.component.html',
})
export class ManagerLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  
  currentUser: User | null = null;
  activeRoute = '';

  menuItems: NavMenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, route: '/manager/dashboard' },
    { label: 'Quản lý nhân viên', icon: Users, route: '/manager/employees' },
    { label: 'Phòng ban', icon: Building2, route: '/manager/departments' },
    { label: 'Duyệt lịch', icon: ClipboardList, route: '/manager/approvals/schedules' },
    { label: 'Duyệt nghỉ phép', icon: FileText, route: '/manager/approvals/leaves' },
    { label: 'Báo cáo chấm công', icon: BarChart3, route: '/manager/reports/attendance' },
    { label: 'Báo cáo hiệu suất', icon: TrendingUp, route: '/manager/reports/productivity' }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe();
    }
  }
}
