import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffShiftRegistrationsService, ShiftOpening } from '../../services/staff-shift-registrations.service';
import { Observable, BehaviorSubject, switchMap, tap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-available-shifts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './available-shifts.component.html',
  styleUrls: ['./available-shifts.component.css']
})
export class AvailableShiftsComponent implements OnInit {
  private shiftService = inject(StaffShiftRegistrationsService);

  shifts$!: Observable<ShiftOpening[]>;
  selectedWeekStart: string = '';
  isRegistering = false;
  
  errorMessage = '';
  successMessage = '';
  
  private refreshSubject = new BehaviorSubject<void>(undefined);

  ngOnInit() {
    // Set default week to next week's Monday (tuần sau)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    this.selectedWeekStart = this.getMonday(nextWeek).toISOString().split('T')[0];
    this.loadShifts();
  }

  loadShifts() {
    this.shifts$ = this.refreshSubject.pipe(
      switchMap(() => {
        // Calculate dates inside switchMap so they update when week changes
        const weekStart = new Date(this.selectedWeekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Monday + 6 days = Sunday

        return this.shiftService.getAvailableShifts({
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0]
        });
      }),
      catchError(error => {
        this.errorMessage = 'Unable to load available shifts';
        return of([]);
      })
    );
  }

  onWeekChange() {
    this.refreshSubject.next();
  }

  getWeekDays(): Date[] {
    const start = new Date(this.selectedWeekStart);
    const days: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    return days;
  }

  getShiftsForDay(shifts: ShiftOpening[], date: Date): ShiftOpening[] {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(shift => 
      new Date(shift.date).toISOString().split('T')[0] === dateStr
    );
  }

  registerForShift(shift: ShiftOpening) {
    if (!confirm(`Register for ${this.getShiftTypeLabel(shift.shiftType)} shift on ${new Date(shift.date).toLocaleDateString('en-US')}?`)) {
      return;
    }

    this.isRegistering = true;
    this.errorMessage = '';

    this.shiftService.registerForShift({ openingId: shift.id }).subscribe({
      next: () => {
        this.successMessage = 'Registration successful! Waiting for manager approval.';
        this.refreshSubject.next();
        this.isRegistering = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to register for shift';
        this.isRegistering = false;
      }
    });
  }

  getShiftTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'MORNING': 'Morning',
      'AFTERNOON': 'Afternoon',
      'EVENING': 'Evening',
      'NIGHT': 'Night'
    };
    return labels[type] || type;
  }

  getShiftTypeClass(type: string): string {
    const classes: Record<string, string> = {
      'MORNING': 'bg-amber-50 border-amber-200 hover:border-amber-400',
      'AFTERNOON': 'bg-blue-50 border-blue-200 hover:border-blue-400',
      'EVENING': 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
      'NIGHT': 'bg-slate-50 border-slate-200 hover:border-slate-400'
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

  getAvailableSlots(shift: ShiftOpening): number {
    // Use availableSlots from backend if available (for PT)
    // For FT, calculate based on capacity
    return shift.availableSlots ?? (shift.ptCapacity - shift.ptRegistered);
  }

  isPastShift(shift: ShiftOpening): boolean {
    const shiftDate = new Date(shift.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    shiftDate.setHours(0, 0, 0, 0);
    return shiftDate < today;
  }

  isPastDate(date: Date): boolean {
    const checkDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }

  private getMonday(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  previousWeek() {
    const current = new Date(this.selectedWeekStart);
    current.setDate(current.getDate() - 7);
    this.selectedWeekStart = current.toISOString().split('T')[0];
    this.onWeekChange();
  }

  nextWeek() {
    const current = new Date(this.selectedWeekStart);
    current.setDate(current.getDate() + 7);
    this.selectedWeekStart = current.toISOString().split('T')[0];
    this.onWeekChange();
  }
}
