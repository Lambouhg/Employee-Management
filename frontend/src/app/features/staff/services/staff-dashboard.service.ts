import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardData {
  user: {
    fullName: string;
    email: string;
    employmentType: 'FULL_TIME' | 'PART_TIME';
  };
  todayShift: {
    id: string;
    date: Date;
    shiftType: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
    startTime: string;
    endTime: string;
    attendance: {
      id: string;
      checkInTime: Date | null;
      checkOutTime: Date | null;
      status: string;
    } | null;
    canCheckIn: boolean;
    checkInWindow: {
      start: Date;
      end: Date;
    } | null;
  } | null;
  stats: {
    shiftsThisWeek: number;
    pendingRegistrations: number;
    leaveBalance: {
      total: number;
      used: number;
      remaining: number;
    };
    attendanceRate: number;
    onTimeRate: number;
    thisMonth: {
      totalWorkingDays: number;
      presentDays: number;
      lateDays: number;
      absentDays: number;
    };
  };
  upcomingShifts: Array<{
    id: string;
    date: Date;
    shiftType: string;
    startTime: string;
    endTime: string;
    hasAttendance: boolean;
  }>;
  recentActivities: Array<{
    type: 'registration' | 'leave';
    date: Date;
    status: string;
    details: any;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class StaffDashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/staff/dashboard`;

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.baseUrl);
  }
}
