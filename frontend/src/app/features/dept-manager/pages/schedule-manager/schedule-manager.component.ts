import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeptManagerSchedulesService } from '../../services/schedules.service';
import { DeptWeeklyPlan, PlanStatus } from '@core/models/schedule.model';
import { AuthService } from '@core/services/auth.service';
import { RouterLink } from '@angular/router';
import { Observable, BehaviorSubject, shareReplay, switchMap, tap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-schedule-manager',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './schedule-manager.component.html',
  styleUrls: ['./schedule-manager.component.css']
})
export class ScheduleManagerComponent implements OnInit {
  private schedulesService = inject(DeptManagerSchedulesService);
  auth = inject(AuthService);

  private refreshSchedules$ = new BehaviorSubject<void>(undefined);
  private currentSchedules: DeptWeeklyPlan[] = [];
  
  errorMessage: string = '';
  isCreating: boolean = false;

  schedules$: Observable<DeptWeeklyPlan[]> = this.refreshSchedules$.pipe(
    switchMap(() => this.schedulesService.getSchedules().pipe(
      catchError(error => {
        this.errorMessage = error.error?.message || 'Không thể tải danh sách schedules';
        return of([]);
      })
    )),
    tap(schedules => {
      this.currentSchedules = schedules;
      this.errorMessage = '';
    }),
    shareReplay(1)
  );

  ngOnInit() { }

  /**
   * Lấy Monday của tuần tiếp theo
   */
  getNextMondayStr(): string {
    const today = new Date();
    const day = today.getDay();
    // Tính Monday của tuần tiếp theo
    const diff = today.getDate() + (day === 0 ? 1 : 8 - day);
    const nextMonday = new Date(today.getFullYear(), today.getMonth(), diff);

    // Format YYYY-MM-DD
    const year = nextMonday.getFullYear();
    const month = String(nextMonday.getMonth() + 1).padStart(2, '0');
    const date = String(nextMonday.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  /**
   * Kiểm tra xem schedule tuần sau đã tồn tại chưa
   */
  isNextWeekScheduleExists(): boolean {
    const nextMondayStr = this.getNextMondayStr();
    return this.currentSchedules.some(s => 
      s.weekStartDate.toString().startsWith(nextMondayStr)
    );
  }

  /**
   * Tạo schedule mới (DRAFT) cho tuần tiếp theo
   */
  createDraftSchedule() {
    const weekStartDate = this.getNextMondayStr();

    if (this.isNextWeekScheduleExists()) {
      this.errorMessage = 'Schedule cho tuần tiếp theo đã tồn tại!';
      return;
    }

    this.isCreating = true;
    this.errorMessage = '';

    this.schedulesService.createSchedule({ weekStartDate }).subscribe({
      next: () => {
        this.refreshSchedules$.next();
        this.isCreating = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể tạo schedule';
        this.isCreating = false;
      }
    });
  }

  getStatusClass(status: PlanStatus | string) {
    return 'status-' + (status?.toLowerCase() || 'draft');
  }

  getStatusText(status: PlanStatus | string): string {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Nháp',
      'PUBLISHED': 'Đã Công Bố',
      'LOCKED': 'Đã Khóa'
    };
    return statusMap[status as string] || status as string;
  }

  /**
   * Get total number of assigned employees in a schedule
   */
  getTotalAssignedEmployees(schedule: DeptWeeklyPlan): number {
    if (!schedule.shiftOpenings) return 0;
    let total = 0;
    schedule.shiftOpenings.forEach(opening => {
      total += opening.shifts?.length || 0;
    });
    return total;
  }

  /**
   * Calculate attendance rate for a schedule
   */
  getScheduleAttendanceRate(schedule: DeptWeeklyPlan): number {
    if (!schedule.shiftOpenings) return 0;
    
    let totalShifts = 0;
    let attendedShifts = 0;

    schedule.shiftOpenings.forEach(opening => {
      if (opening.shifts) {
        opening.shifts.forEach(shift => {
          totalShifts++;
          const attendance = (shift as any).attendance;
          if (attendance && (attendance.status === 'PRESENT' || attendance.status === 'LATE')) {
            attendedShifts++;
          }
        });
      }
    });

    return totalShifts > 0 ? Math.round((attendedShifts / totalShifts) * 100) : 0;
  }
}
