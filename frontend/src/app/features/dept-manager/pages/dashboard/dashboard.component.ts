import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { DeptManagerDashboardService } from '../../services/dashboard.service';
import {
  CompleteDashboardDto,
  AlertDto,
  ShiftCoverageDto,
  AttendanceTrendDto,
  EmployeeWorkloadDto,
  RecentActivityDto,
} from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DeptManagerDashboardService);

  dashboardData$!: Observable<{
    data: CompleteDashboardDto | null;
    loading: boolean;
    error: string | null;
  }>;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.dashboardData$ = this.dashboardService.getCompleteDashboard().pipe(
      map((data) => ({ data, loading: false, error: null })),
      catchError((err) => {
        console.error('Dashboard error:', err);
        return of({
          data: null,
          loading: false,
          error: 'Không thể tải dữ liệu dashboard',
        });
      }),
      shareReplay(1)
    );
  }

  getAlertColor(severity: string): string {
    switch (severity) {
      case 'ERROR':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'INFO':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  }

  getCoverageColor(status: string): string {
    switch (status) {
      case 'FULL':
        return 'bg-green-500';
      case 'PARTIAL':
        return 'bg-yellow-500';
      case 'EMPTY':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  }

  getCoveragePercentage(coverage: ShiftCoverageDto): number {
    if (coverage.totalShifts === 0) return 0;
    return Math.round((coverage.assignedShifts / coverage.totalShifts) * 100);
  }

  getPlanStatusLabel(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'Nháp';
      case 'PUBLISHED':
        return 'Đã xuất bản';
      case 'LOCKED':
        return 'Đã khóa';
      case 'NONE':
        return 'Chưa có lịch';
      default:
        return status;
    }
  }

  getPlanStatusColor(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'text-yellow-600 bg-yellow-50';
      case 'PUBLISHED':
        return 'text-green-600 bg-green-50';
      case 'LOCKED':
        return 'text-gray-600 bg-gray-50';
      case 'NONE':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'SHIFT_REGISTRATION':
        return '📋';
      case 'LEAVE_REQUEST':
        return '🏖️';
      case 'PLAN_CREATED':
        return '📅';
      case 'PLAN_PUBLISHED':
        return '✅';
      default:
        return '📌';
    }
  }

  getWorkloadColor(employee: EmployeeWorkloadDto): string {
    if (employee.isOverloaded) return 'text-red-600 bg-red-50';
    if (employee.isUnderloaded) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  }

  // Chart helper methods
  getCircleProgress(value: number, total: number): string {
    if (total === 0) return '0 534';
    const percentage = (value / total) * 100;
    const circumference = 2 * Math.PI * 85; // r=85
    const progress = (percentage / 100) * circumference;
    return `${progress} ${circumference}`;
  }

  getSegmentOffset(previousValues: number, previousTotal: number): number {
    if (previousTotal === 0) return 0;
    const circumference = 2 * Math.PI * 85;
    return (previousValues / previousTotal) * circumference;
  }

  getDonutSegment(percentage: number): string {
    const circumference = 2 * Math.PI * 70; // r=70
    const segment = (percentage / 100) * circumference;
    return `${segment} ${circumference}`;
  }
}
