import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DeptManagerSchedulesService } from '../../services/schedules.service';
import { DeptWeeklyPlan, ShiftOpening } from '@core/models/schedule.model';
import { 
  AlertMessageComponent,
  ScheduleHeaderComponent,
  ScheduleCalendarComponent,
  ShiftFormModalComponent,
  ShiftDetailModalComponent,
  ShiftFormData
} from '../../components';
import { Observable, BehaviorSubject, catchError, tap, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-schedule-editor',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    AlertMessageComponent,
    ScheduleHeaderComponent,
    ScheduleCalendarComponent,
    ShiftFormModalComponent,
    ShiftDetailModalComponent
  ],
  templateUrl: './schedule-editor.component.html',
  styleUrl: './schedule-editor.component.css'
})
export class ScheduleEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private schedulesService = inject(DeptManagerSchedulesService);

  scheduleId: string = '';
  isCreatingMode: boolean = false; // Flag cho create mode
  
  // Observable for async pipe - NO MORE isLoading!
  schedule$!: Observable<DeptWeeklyPlan | null>;
  private refreshSubject = new BehaviorSubject<void>(undefined);
  
  // UI State
  showShiftForm = false;
  showShiftDetail = false;
  editingShift: ShiftOpening | null = null;
  viewingShift: ShiftOpening | null = null;
  isSaving = false;
  isPublishing = false;
  isLocking = false;
  errorMessage = '';
  successMessage = '';

  // Shift Form
  shiftForm: ShiftFormData = {
    date: '',
    shiftType: 'MORNING' as any,
    startTime: '06:00',
    endTime: '14:00',
    // Part-time settings
    isPTEnabled: true,
    ptCapacity: 5,
    notes: ''
  };

  ngOnInit() {
    this.scheduleId = this.route.snapshot.params['id'];
    
    // Nếu route là "create", tự động tạo schedule mới
    if (this.scheduleId === 'create') {
      this.handleCreateNewSchedule();
      return;
    }
    
    // Setup Observable stream với async pipe
    this.schedule$ = this.refreshSubject.pipe(
      switchMap(() => this.schedulesService.getScheduleById(this.scheduleId)),
      tap(() => {
        this.errorMessage = ''; // Clear error on success
      }),
      catchError((error) => {
        console.error('Error loading schedule:', error);
        this.errorMessage = error.error?.message || 'Không thể tải schedule';
        return of(null); // Return null on error
      })
    );
  }

  /**
   * Xử lý tạo schedule mới khi user vào route /schedules/create
   */
  private handleCreateNewSchedule() {
    this.isCreatingMode = true;
    const nextMondayStr = this.getNextMondayStr();
    
    this.schedulesService.createSchedule({ weekStartDate: nextMondayStr }).subscribe({
      next: (newSchedule) => {
        // Navigate đến schedule vừa tạo
        this.router.navigate(['/dept-manager/schedules', newSchedule.id], { replaceUrl: true });
      },
      error: (error) => {
        console.error('Error creating schedule:', error);
        this.errorMessage = error.error?.message || 'Không thể tạo schedule';
        this.isCreatingMode = false;
        // Quay lại list sau 2s
        setTimeout(() => {
          this.router.navigate(['/dept-manager/schedules']);
        }, 2000);
      }
    });
  }

  /**
   * Lấy Monday của tuần tiếp theo (format YYYY-MM-DD)
   */
  private getNextMondayStr(): string {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() + (day === 0 ? 1 : 8 - day);
    const nextMonday = new Date(today.getFullYear(), today.getMonth(), diff);
    
    const year = nextMonday.getFullYear();
    const month = String(nextMonday.getMonth() + 1).padStart(2, '0');
    const date = String(nextMonday.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  refreshSchedule() {
    this.refreshSubject.next();
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  canEdit(schedule: DeptWeeklyPlan | null): boolean {
    return schedule?.status === 'DRAFT';
  }

  canPublish(schedule: DeptWeeklyPlan | null): boolean {
    return this.hasAtLeastOneShift(schedule) && this.allShiftsInWeek(schedule);
  }

  hasAtLeastOneShift(schedule: DeptWeeklyPlan | null): boolean {
    return (schedule?.shiftOpenings?.length || 0) > 0;
  }

  allShiftsInWeek(schedule: DeptWeeklyPlan | null): boolean {
    if (!schedule?.shiftOpenings) return true;
    
    const weekStart = new Date(schedule.weekStartDate);
    const weekEnd = this.getWeekEndDate(schedule);
    
    return schedule.shiftOpenings.every(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= weekStart && shiftDate <= weekEnd;
    });
  }

  publishSchedule(schedule: DeptWeeklyPlan | null) {
    if (!this.canPublish(schedule)) {
      this.errorMessage = 'Schedule chưa đủ điều kiện để publish';
      return;
    }

    if (!confirm('Publish schedule này? Nhân viên sẽ có thể đăng ký ca làm việc.')) {
      return;
    }

    this.isPublishing = true;
    this.errorMessage = '';

    this.schedulesService.updateScheduleStatus(this.scheduleId, { status: 'PUBLISHED' }).subscribe({
      next: () => {
        this.successMessage = 'Đã publish schedule thành công!';
        this.refreshSchedule();
        this.isPublishing = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể publish schedule';
        this.isPublishing = false;
      }
    });
  }

  lockSchedule() {
    if (!confirm('Lock schedule này? Sẽ không thể chỉnh sửa sau khi lock.')) {
      return;
    }

    this.isLocking = true;
    this.errorMessage = '';

    this.schedulesService.updateScheduleStatus(this.scheduleId, { status: 'LOCKED' }).subscribe({
      next: () => {
        this.successMessage = 'Đã lock schedule thành công!';
        this.refreshSchedule();
        this.isLocking = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể lock schedule';
        this.isLocking = false;
      }
    });
  }

  // ============================================
  // SHIFT MANAGEMENT
  // ============================================

  resetShiftForm(schedule: DeptWeeklyPlan | null = null) {
    const firstDay = this.getWeekDays(schedule)[0];
    this.shiftForm = {
      date: firstDay ? firstDay.toISOString().split('T')[0] : '',
      shiftType: 'MORNING' as any,
      startTime: '06:00',
      endTime: '14:00',
      // Part-time settings
      isPTEnabled: true,
      ptCapacity: 5,
      notes: ''
    };
    this.editingShift = null;
  }

  editShift(shift: ShiftOpening) {
    this.editingShift = shift;
    this.shiftForm = {
      date: shift.date,
      shiftType: shift.shiftType,
      startTime: this.formatTime(shift.startTime),
      endTime: this.formatTime(shift.endTime),
      // Part-time settings
      isPTEnabled: shift.isPTEnabled,
      ptCapacity: shift.ptCapacity,
      notes: shift.notes || ''
    };
    this.showShiftForm = true;
  }

  viewShiftDetail(shift: ShiftOpening) {
    this.viewingShift = shift;
    this.showShiftDetail = true;
  }

  closeShiftDetail() {
    this.showShiftDetail = false;
    this.viewingShift = null;
  }

  saveShift(formData: ShiftFormData) {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const dto = {
      date: formData.date,
      shiftType: formData.shiftType,
      startTime: formData.startTime,
      endTime: formData.endTime,
      // Part-time settings
      isPTEnabled: formData.isPTEnabled,
      ptCapacity: formData.ptCapacity,
      // Full-time settings - mặc định luôn cho phép FT
      isFTEnabled: true,
      notes: formData.notes
    };

    const request = this.editingShift
      ? this.schedulesService.updateShift(this.scheduleId, this.editingShift.id, dto)
      : this.schedulesService.createShift(this.scheduleId, dto);

    request.subscribe({
      next: () => {
        this.successMessage = this.editingShift ? 'Đã cập nhật ca thành công!' : 'Đã thêm ca thành công!';
        this.refreshSchedule();
        this.closeShiftForm();
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể lưu ca làm việc';
        this.isSaving = false;
      }
    });
  }

  deleteShift(shift: ShiftOpening) {
    if (shift.ptRegistered > 0) {
      this.errorMessage = 'Không thể xóa ca đã có nhân viên đăng ký';
      return;
    }

    if (!confirm('Xóa ca làm việc này?')) {
      return;
    }

    this.schedulesService.deleteShift(this.scheduleId, shift.id).subscribe({
      next: () => {
        this.successMessage = 'Đã xóa ca thành công!';
        this.refreshSchedule();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể xóa ca';
      }
    });
  }

  closeShiftForm() {
    this.showShiftForm = false;
    this.editingShift = null;
  }

  quickAddShift(day: Date, schedule: DeptWeeklyPlan | null) {
    if (!this.canEdit(schedule)) return;
    this.resetShiftForm(schedule);
    this.shiftForm.date = day.toISOString().split('T')[0];
    this.showShiftForm = true;
  }

  // ============================================
  // HELPERS FOR CHILD COMPONENTS
  // ============================================

  getWeekDays(schedule: DeptWeeklyPlan | null): Date[] {
    if (!schedule) return [];
    
    const start = new Date(schedule.weekStartDate);
    const days: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    return days;
  }

  getWeekEndDate(schedule: DeptWeeklyPlan | null): Date {
    if (!schedule) return new Date();
    const start = new Date(schedule.weekStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  }

  getAvailableDates(schedule: DeptWeeklyPlan | null): { value: string; label: string }[] {
    return this.getWeekDays(schedule).map((day, index) => {
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return {
        value: day.toISOString().split('T')[0],
        label: `${days[index]} - ${day.getDate()}/${day.getMonth() + 1}`
      };
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    // If time is ISO string, extract HH:mm
    if (time.includes('T') || time.includes('Z')) {
      const date = new Date(time);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    // Already HH:mm format
    return time.substring(0, 5);
  }
}
