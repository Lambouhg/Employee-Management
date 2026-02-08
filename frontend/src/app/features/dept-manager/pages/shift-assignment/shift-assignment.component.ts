import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeptManagerPlansService } from '../../services/dept-manager-plans.service';
import { DeptManagerShiftsService } from '../../services/dept-manager-shifts.service';
import { DeptManagerEmployeesService } from '../../services/dept-manager-employees.service';
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
        this.errorMessage = 'Không thể tải danh sách plans';
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
        this.errorMessage = 'Không thể tải danh sách nhân viên';
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
        this.errorMessage = 'Không thể tải chi tiết plan';
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
  canAssignEmployee(employee: EmployeeSelection, shiftDate: Date): boolean {
    if (employee.employmentType !== 'FULL_TIME' || !employee.fixedDayOffNumber) {
      return true;
    }

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = shiftDate.getDay();
    // Convert to Monday = 1, Sunday = 7
    const normalizedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

    return normalizedDay !== employee.fixedDayOffNumber;
  }

  /**
   * Get warning message if employee cannot be assigned
   */
  getAssignmentWarning(employee: EmployeeSelection, shiftDate: Date | string): string | null {
    const date = typeof shiftDate === 'string' ? new Date(shiftDate) : shiftDate;
    
    // Check fixedDayOff
    if (!this.canAssignEmployee(employee, date)) {
      return `Nhân viên này nghỉ cố định vào ngày này`;
    }

    // Check weekly stats
    if (employee.weeklyStats && !employee.weeklyStats.canAssignMore) {
      return `Đã đủ ${employee.weeklyStats.maxShiftsPerWeek} ca trong tuần`;
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
        this.successMessage = 'Đã gán ca thành công!';
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
        this.errorMessage = error.error?.message || 'Không thể gán ca';
        this.isAssigning = false;
      }
    });
  }

  unassignShift(shiftId: string) {
    const currentPlan = this.selectedPlanSubject.value;
    const currentShift = this.selectedShiftOpeningSubject.value;
    if (!currentPlan) return;

    if (!confirm('Xóa nhân viên khỏi ca này?')) return;

    this.shiftsService.unassignShift(currentPlan.id, shiftId).subscribe({
      next: () => {
        this.successMessage = 'Đã xóa nhân viên khỏi ca!';
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
        this.errorMessage = error.error?.message || 'Không thể xóa';
      }
    });
  }

  getWeekDays(plan: DeptWeeklyPlan | null): Date[] {
    if (!plan) return [];

    const start = new Date(plan.weekStartDate);
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }

    return days;
  }

  getShiftsForDay(date: Date): ShiftOpening[] {
    const currentPlan = this.selectedPlanSubject.value;
    if (!currentPlan?.shiftOpenings) return [];

    const dateStr = date.toISOString().split('T')[0];
    return currentPlan.shiftOpenings.filter(shift =>
      shift.date.toString().split('T')[0] === dateStr
    );
  }

  getShiftTypeLabel(type: ShiftType): string {
    const labels: Record<ShiftType, string> = {
      [ShiftType.MORNING]: 'Sáng',
      [ShiftType.AFTERNOON]: 'Chiều',
      [ShiftType.EVENING]: 'Tối',
      [ShiftType.NIGHT]: 'Đêm'
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
      'DRAFT': 'Nháp',
      'PUBLISHED': 'Đã công bố',
      'LOCKED': 'Đã khóa'
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
}
