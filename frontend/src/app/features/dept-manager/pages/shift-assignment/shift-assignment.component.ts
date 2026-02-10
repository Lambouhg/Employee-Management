import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeptManagerPlansService } from '../../services/plans.service';
import { DeptManagerShiftsService } from '../../services/shifts.service';
import { DeptManagerEmployeesService } from '../../services/employees.service';
import { DeptWeeklyPlan, ShiftOpening, ShiftType } from '@core/models/schedule.model';
import { EmployeeSelection } from '../../models/employee.model';
import { Observable, BehaviorSubject, switchMap, tap, catchError, of, map, shareReplay, combineLatest } from 'rxjs';
import { DayOfWeekNumberPipe, EmploymentTypePipe, EmploymentTypeClassPipe } from '../../pipes';

type EmployeeFilterType = 'ALL' | 'FULL_TIME' | 'PART_TIME';

@Component({
  selector: 'app-shift-assignment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DayOfWeekNumberPipe,
    EmploymentTypePipe,
    EmploymentTypeClassPipe
  ],
  templateUrl: './shift-assignment.component.html',
  styleUrls: ['./shift-assignment.component.css']
})
export class ShiftAssignmentComponent implements OnInit {
  private plansService = inject(DeptManagerPlansService);
  private shiftsService = inject(DeptManagerShiftsService);
  private employeesService = inject(DeptManagerEmployeesService);

  plans$!: Observable<DeptWeeklyPlan[]>;
  private selectedPlanSubject = new BehaviorSubject<DeptWeeklyPlan | null>(null);
  selectedPlan$ = this.selectedPlanSubject.asObservable().pipe(shareReplay(1));

  private selectedShiftOpeningSubject = new BehaviorSubject<ShiftOpening | null>(null);
  selectedShiftOpening$ = this.selectedShiftOpeningSubject.asObservable();

  private employeesSubject = new BehaviorSubject<EmployeeSelection[]>([]);
  employees$ = this.employeesSubject.asObservable();
  isLoadingEmployees = false;

  // Employee filter state
  private employeeFilterSubject = new BehaviorSubject<EmployeeFilterType>('ALL');
  employeeFilter$ = this.employeeFilterSubject.asObservable();

  showAssignModal = false;
  isAssigning = false;

  errorMessage = '';
  successMessage = '';

  private refreshSubject = new BehaviorSubject<void>(undefined);

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.plans$ = this.refreshSubject.pipe(
      switchMap(() => this.plansService.getWeeklyPlans()),
      tap(plans => {
        // Auto-select first PUBLISHED or LOCKED plan
        if (plans.length > 0 && !this.selectedPlanSubject.value) {
          const publishedPlan = plans.find(p => p.status === 'PUBLISHED' || p.status === 'LOCKED');
          if (publishedPlan) {
            this.selectPlan(publishedPlan);
          }
        }
      }),
      catchError(error => {
        this.errorMessage = 'Cannot load plans list';
        return of([]);
      })
    );
  }

  loadEmployees(weekStartDate?: string) {
    this.isLoadingEmployees = true;
    this.employeesService.getSelectionList(weekStartDate).subscribe({
      next: (employees) => {
        // Filter out managers - only show regular employees
        const filteredEmployees = employees.filter(emp =>
          emp.role !== 'DEPT_MANAGER' && emp.role !== 'MANAGER'
        );
        this.employeesSubject.next(filteredEmployees);
        this.isLoadingEmployees = false;
      },
      error: (error) => {
        this.errorMessage = 'Cannot load employee list';
        this.isLoadingEmployees = false;
      }
    });
  }

  selectPlan(plan: DeptWeeklyPlan) {
    this.selectedPlanSubject.next(plan);
    this.selectedShiftOpeningSubject.next(null);

    // Load employees with weekly statistics
    this.loadEmployees(plan.weekStartDate.toString());

    // Load full plan details with shift assignments
    this.shiftsService.getAssignedShifts(plan.id).subscribe({
      next: (fullPlan) => {
        this.selectedPlanSubject.next(fullPlan);
      },
      error: (error) => {
        this.errorMessage = 'Cannot load plan details';
      }
    });
  }

  openShiftDetail(shiftOpening: ShiftOpening) {
    this.selectedShiftOpeningSubject.next(shiftOpening);
    this.showAssignModal = true;
    // Reset filter when opening modal
    this.employeeFilterSubject.next('ALL');
  }

  closeShiftDetail() {
    this.showAssignModal = false;
    this.selectedShiftOpeningSubject.next(null);
    this.employeeFilterSubject.next('ALL');
  }

  /**
   * Set filter type (ALL, FULL_TIME, PART_TIME)
   */
  setEmployeeFilter(filter: EmployeeFilterType) {
    this.employeeFilterSubject.next(filter);
  }

  /**
   * Get filtered available employees (not yet assigned) with filtering by type
   */
  getAvailableEmployees(): Observable<EmployeeSelection[]> {
    return combineLatest([
      this.selectedShiftOpening$,
      this.employees$,
      this.employeeFilter$
    ]).pipe(
      map(([selectedShift, employees, filter]) => {
        if (!selectedShift) return [];

        // Filter out employees already assigned to this shift
        const assignedIds = selectedShift.shifts?.map(s => s.employeeId) || [];
        let availableEmployees = employees.filter(emp => !assignedIds.includes(emp.id));

        // Apply employment type filter
        if (filter === 'FULL_TIME') {
          availableEmployees = availableEmployees.filter(emp => emp.employmentType === 'FULL_TIME');
        } else if (filter === 'PART_TIME') {
          availableEmployees = availableEmployees.filter(emp => emp.employmentType === 'PART_TIME');
        }

        return availableEmployees;
      })
    );
  }

  /**
   * Get count by employment type
   */
  getEmployeeCount(type: EmployeeFilterType): Observable<number> {
    return this.getAvailableEmployees().pipe(
      map(employees => {
        if (type === 'ALL') return employees.length;
        return employees.filter(emp => emp.employmentType === type).length;
      })
    );
  }

  /**
   * Check if employee can be assigned based on fixedDayOff
   */
  canAssignEmployee(employee: EmployeeSelection, shiftDate: Date | string): boolean {
    if (employee.employmentType !== 'FULL_TIME' || !employee.fixedDayOffNumber) {
      return true;
    }

    // Parse date string properly to avoid timezone issues
    let dateStr: string;
    if (typeof shiftDate === 'string') {
      dateStr = shiftDate.split('T')[0]; // "2026-02-17T00:00:00.000Z" → "2026-02-17"
    } else {
      // Convert Date object to YYYY-MM-DD using local date components
      const year = shiftDate.getFullYear();
      const month = String(shiftDate.getMonth() + 1).padStart(2, '0');
      const day = String(shiftDate.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }
    
    // Extract year, month, day directly from YYYY-MM-DD string
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // Create local date without timezone conversion
    
    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = localDate.getDay();
    // Convert to Monday = 1, Sunday = 7
    const normalizedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

    // Debug logging
    console.log('[FE FIXED DAY OFF CHECK]', {
      employee: employee.fullName,
      shiftDate: dateStr,
      dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
      normalizedDay,
      fixedDayOffNumber: employee.fixedDayOffNumber,
      canAssign: normalizedDay !== employee.fixedDayOffNumber
    });

    return normalizedDay !== employee.fixedDayOffNumber;
  }

  /**
   * Get warning message if employee cannot be assigned
   */
  getAssignmentWarning(employee: EmployeeSelection, shiftDate: Date | string): string | null {
    // Use the same date parsing logic to ensure consistency
    const date = shiftDate; // Pass directly to canAssignEmployee
    
    // Check fixedDayOff
    if (!this.canAssignEmployee(employee, date)) {
      return `Employee has fixed day off on this day`;
    }

    // Check weekly stats
    if (employee.weeklyStats && !employee.weeklyStats.canAssignMore) {
      return `Already assigned ${employee.weeklyStats.maxShiftsPerWeek} shifts this week`;
    }

    return null;
  }

  assignEmployee(employeeId: string) {
    const currentPlan = this.selectedPlanSubject.value;
    const currentShift = this.selectedShiftOpeningSubject.value;
    if (!currentPlan || !currentShift) return;

    // Additional validation
    const employee = this.employeesSubject.value.find(e => e.id === employeeId);
    if (employee) {
      const warning = this.getAssignmentWarning(employee, currentShift.date);
      if (warning) {
        this.errorMessage = warning;
        setTimeout(() => this.errorMessage = '', 3000);
        return;
      }
    }

    this.isAssigning = true;
    this.errorMessage = '';

    const dto = {
      employeeId: employeeId,
      openingId: currentShift.id,
      date: currentShift.date,
      shiftType: currentShift.shiftType
    };

    this.shiftsService.assignShift(currentPlan.id, dto).subscribe({
      next: () => {
        this.successMessage = 'Shift assigned successfully!';
        // Reload plan data and employees with fresh statistics
        this.loadEmployees(currentPlan.weekStartDate.toString());
        this.shiftsService.getAssignedShifts(currentPlan.id).subscribe({
          next: (fullPlan) => {
            this.selectedPlanSubject.next(fullPlan);
            // Update selectedShiftOpening with fresh data
            const updatedShift = fullPlan.shiftOpenings?.find(s => s.id === currentShift.id);
            if (updatedShift) {
              this.selectedShiftOpeningSubject.next(updatedShift);
            }
            this.isAssigning = false;
          },
          error: () => {
            this.isAssigning = false;
          }
        });
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Cannot assign shift';
        this.isAssigning = false;
      }
    });
  }

  unassignShift(shiftId: string) {
    const currentPlan = this.selectedPlanSubject.value;
    const currentShift = this.selectedShiftOpeningSubject.value;
    if (!currentPlan) return;

    if (!confirm('Remove employee from this shift?')) return;

    this.shiftsService.unassignShift(currentPlan.id, shiftId).subscribe({
      next: () => {
        this.successMessage = 'Employee removed from shift!';
        // Reload plan data and employees with fresh statistics
        this.loadEmployees(currentPlan.weekStartDate.toString());
        this.shiftsService.getAssignedShifts(currentPlan.id).subscribe({
          next: (fullPlan) => {
            this.selectedPlanSubject.next(fullPlan);
            // Update selectedShiftOpening with fresh data
            const updatedShift = fullPlan.shiftOpenings?.find(s => s.id === currentShift?.id);
            if (updatedShift) {
              this.selectedShiftOpeningSubject.next(updatedShift);
            }
          }
        });
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Cannot remove employee';
      }
    });
  }

  getWeekDays(plan: DeptWeeklyPlan | null): Date[] {
    if (!plan) return [];

    // Parse weekStartDate correctly - backend returns Monday already
    const dateStr = plan.weekStartDate.toString().split('T')[0]; // Get YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create local date for Monday (weekStartDate from backend is already Monday)
    const monday = new Date(year, month - 1, day);
    
    // Generate 7 days starting from Monday
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      days.push(currentDay);
    }
    return days;
  }

  /**
   * Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
   */
  getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  /**
   * Get day label based on actual day of week
   */
  getDayLabel(date: Date): string {
    // Thứ tự tuần: Thứ 2 -> Chủ nhật
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Tìm thứ tự của ngày trong tuần tính từ Thứ 2
    let dayIndex = date.getDay() - 1;
    if (dayIndex < 0) dayIndex = 6; // Nếu là Chủ nhật (0), chuyển về cuối tuần
    return dayLabels[dayIndex];
  }

  getShiftsForDay(date: Date): ShiftOpening[] {
    const currentPlan = this.selectedPlanSubject.value;
    if (!currentPlan?.shiftOpenings) return [];

    // Convert local date to YYYY-MM-DD format for comparison
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return currentPlan.shiftOpenings.filter(shift => {
      // Extract YYYY-MM-DD from shift.date (which might be ISO string)
      const shiftDateStr = shift.date.toString().split('T')[0];
      return shiftDateStr === dateStr;
    });
  }

  getShiftTypeLabel(type: ShiftType): string {
    const labels: Record<ShiftType, string> = {
      [ShiftType.MORNING]: 'Morning',
      [ShiftType.AFTERNOON]: 'Afternoon',
      [ShiftType.EVENING]: 'Evening',
      [ShiftType.NIGHT]: 'Night'
    };
    return labels[type] || type;
  }

  getShiftTypeClass(type: ShiftType): string {
    const classes: Record<ShiftType, string> = {
      [ShiftType.MORNING]: 'bg-amber-100 text-amber-700 border-amber-300',
      [ShiftType.AFTERNOON]: 'bg-blue-100 text-blue-700 border-blue-300',
      [ShiftType.EVENING]: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      [ShiftType.NIGHT]: 'bg-slate-100 text-slate-700 border-slate-300'
    };
    return classes[type] || '';
  }

  formatTime(time: string): string {
    if (!time) return '';
    if (time.includes('T') || time.includes('Z')) {
      const date = new Date(time);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return time.substring(0, 5);
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-700',
      'PUBLISHED': 'bg-green-100 text-green-700',
      'LOCKED': 'bg-red-100 text-red-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'DRAFT': 'Draft',
      'PUBLISHED': 'Published',
      'LOCKED': 'Locked'
    };
    return labels[status] || status;
  }

  getEmployeeName(employeeId: string): string {
    const employees = this.employeesSubject.value;
    const employee = employees.find(e => e.id === employeeId);
    return employee?.fullName || 'Unknown';
  }

  isEmployeeAssigned(employeeId: string, shiftOpening: ShiftOpening): boolean {
    return shiftOpening.shifts?.some(s => s.employeeId === employeeId) || false;
  }

  /**
   * Get count of employees with specific attendance status
   */
  getAttendanceCount(shift: ShiftOpening, status: string): number {
    if (!shift.shifts) return 0;
    return shift.shifts.filter(s => {
      const attendance = (s as any).attendance;
      return attendance && attendance.status === status;
    }).length;
  }

  /**
   * Get count of employees who haven't checked in yet
   */
  getPendingCount(shift: ShiftOpening): number {
    if (!shift.shifts) return 0;
    return shift.shifts.filter(s => {
      const attendance = (s as any).attendance;
      return !attendance;
    }).length;
  }

  /**
   * Get attendance rate for a shift opening
   */
  getAttendanceRate(shift: ShiftOpening): number {
    if (!shift.shifts || shift.shifts.length === 0) return 0;
    const attended = this.getAttendanceCount(shift, 'PRESENT') + this.getAttendanceCount(shift, 'LATE');
    return Math.round((attended / shift.shifts.length) * 100);
  }
}
