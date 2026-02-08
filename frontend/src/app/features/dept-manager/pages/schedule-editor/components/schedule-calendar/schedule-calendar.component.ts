import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShiftOpening } from '@core/models/schedule.model';
import { ShiftCardComponent } from '../shift-card/shift-card.component';

@Component({
  selector: 'app-schedule-calendar',
  standalone: true,
  imports: [CommonModule, ShiftCardComponent],
  templateUrl: './schedule-calendar.component.html'
})
export class ScheduleCalendarComponent {
  @Input() weekDays: Date[] = [];
  @Input() shifts: ShiftOpening[] = [];
  @Input() canEdit: boolean = false;
  @Input() totalShifts: number = 0;
  
  @Output() addShift = new EventEmitter<void>();
  @Output() quickAddShift = new EventEmitter<Date>();
  @Output() editShift = new EventEmitter<ShiftOpening>();
  @Output() deleteShift = new EventEmitter<ShiftOpening>();

  onAddShift() {
    this.addShift.emit();
  }

  onQuickAddShift(day: Date) {
    if (this.canEdit) {
      this.quickAddShift.emit(day);
    }
  }

  onEditShift(shift: ShiftOpening) {
    this.editShift.emit(shift);
  }

  onDeleteShift(shift: ShiftOpening) {
    this.deleteShift.emit(shift);
  }

  getDayName(index: number): string {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[index];
  }

  formatDateNumber(date: Date): string {
    return date.getDate().toString().padStart(2, '0');
  }

  getMonthNumber(date: Date): string {
    return (date.getMonth() + 1).toString().padStart(2, '0');
  }

  getShiftsForDay(day: Date): ShiftOpening[] {
    const dayStr = day.toISOString().split('T')[0];
    return this.shifts
      .filter(shift => {
        const shiftDate = new Date(shift.date).toISOString().split('T')[0];
        return shiftDate === dayStr;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
}
