import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { StaffDashboardService, DashboardData } from '../../services/staff-dashboard.service';
import { StaffAttendanceService } from '../../services/staff-attendance.service';
import {
  LucideAngularModule,
  Clock,
  Calendar,
  FileText,
  ClipboardList,
  CheckCircle,
  TrendingUp,
  Award,
  Zap,
  CalendarDays,
  AlertCircle,
  ArrowRight
} from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(StaffDashboardService);
  private attendanceService = inject(StaffAttendanceService);
  private router = inject(Router);

  dashboardData = signal<DashboardData | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  currentTime = signal(new Date());
  isCheckingIn = signal(false);

  // Icons
  readonly Clock = Clock;
  readonly Calendar = Calendar;
  readonly FileText = FileText;
  readonly ClipboardList = ClipboardList;
  readonly CheckCircle = CheckCircle;
  readonly TrendingUp = TrendingUp;
  readonly Award = Award;
  readonly Zap = Zap;
  readonly CalendarDays = CalendarDays;
  readonly AlertCircle = AlertCircle;
  readonly ArrowRight = ArrowRight;

  ngOnInit(): void {
    this.loadDashboard();
    // Update clock every second
    setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load dashboard data');
        this.isLoading.set(false);
        console.error('Dashboard error:', error);
      }
    });
  }

  checkIn(): void {
    const data = this.dashboardData();
    if (!data?.todayShift || !data.todayShift.id) return;

    this.isCheckingIn.set(true);
    this.attendanceService.checkIn({ 
      shiftId: data.todayShift.id 
    }).subscribe({
      next: () => {
        this.isCheckingIn.set(false);
        this.loadDashboard(); // Reload to update attendance status
      },
      error: (error) => {
        this.isCheckingIn.set(false);
        this.errorMessage.set(error.error?.message || 'Check-in failed');
      }
    });
  }

  getShiftTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'MORNING': 'Morning Shift',
      'AFTERNOON': 'Afternoon Shift',
      'EVENING': 'Evening Shift',
      'NIGHT': 'Night Shift'
    };
    return labels[type] || type;
  }

  getShiftTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'MORNING': 'bg-amber-50 border-amber-200 text-amber-700',
      'AFTERNOON': 'bg-blue-50 border-blue-200 text-blue-700',
      'EVENING': 'bg-indigo-50 border-indigo-200 text-indigo-700',
      'NIGHT': 'bg-slate-50 border-slate-200 text-slate-700'
    };
    return colors[type] || '';
  }

  getAttendanceStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PRESENT': 'Present',
      'LATE': 'Late',
      'ABSENT': 'Absent',
      'ON_LEAVE': 'On Leave',
      'EARLY_LEAVE': 'Early Leave'
    };
    return labels[status] || status;
  }

  getAttendanceStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PRESENT': 'bg-green-100 text-green-800',
      'LATE': 'bg-yellow-100 text-yellow-800',
      'ABSENT': 'bg-red-100 text-red-800',
      'ON_LEAVE': 'bg-blue-100 text-blue-800',
      'EARLY_LEAVE': 'bg-orange-100 text-orange-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getActivityStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    if (timeString.includes('T') || timeString.includes('Z')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return timeString.substring(0, 5);
  }

  formatDate(dateString: Date): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: Date): string {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
