import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { EmployeeService } from '@core/services/employee.service';

import { User } from '@core/models/auth.model';
import { 
  LucideAngularModule, 
  LayoutDashboard, 
  Users, 
  Building2,
  ClipboardList,
  FileText,
  BarChart3,
  UserCheck,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle
} from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styles: []
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
 
  private router = inject(Router);

  currentUser: User | null = null;
  isLoading = true;

  statistics = {
    totalEmployees: 0,
    activeEmployees: 0,
    pendingSchedules: 0,
    pendingLeaves: 0,
    attendanceRate: 0
  };

  // Icons
  readonly LayoutDashboard = LayoutDashboard;
  readonly Users = Users;
  readonly Building2 = Building2;
  readonly ClipboardList = ClipboardList;
  readonly FileText = FileText;
  readonly BarChart3 = BarChart3;
  readonly UserCheck = UserCheck;
  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly TrendingUp = TrendingUp;
  readonly CheckCircle = CheckCircle;


  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe();
    }

    this.loadStatistics();
  }

  loadStatistics(): void {
    this.isLoading = false;

    // Load employee statistics
    this.employeeService.getAll({ page: 1, limit: 1 }).subscribe({
      next: (response) => {
        this.statistics.totalEmployees = response.meta.total;
      }
    });

    this.employeeService.getAll({ page: 1, limit: 1, isActive: true }).subscribe({
      next: (response) => {
        this.statistics.activeEmployees = response.meta.total;
        this.isLoading = false;
      }
    });

   

    // Mock data for now
    this.statistics.pendingSchedules = 5;
    this.statistics.pendingLeaves = 3;
    this.statistics.attendanceRate = 95;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
