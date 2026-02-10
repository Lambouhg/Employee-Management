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
  @Output() viewDetail = new EventEmitter<ShiftOpening>();
  @Output() deleteShift = new EventEmitter<ShiftOpening>();

  onAddShift() {
    this.addShift.emit();
  }

  onQuickAddShift(day: Date) {
    if (this.canEdit) {
      this.quickAddShift.emit(day);
    }
  }

  onViewDetail(shift: ShiftOpening) {
    this.viewDetail.emit(shift);
  }

  onDeleteShift(shift: ShiftOpening) {
    this.deleteShift.emit(shift);
  }

  getDayName(date: Date): string {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  }

  formatDateNumber(date: Date): string {
    return date.getDate().toString().padStart(2, '0');
  }

  getMonthNumber(date: Date): string {
    return (date.getMonth() + 1).toString().padStart(2, '0');
  }

  getShiftsForDay(day: Date): ShiftOpening[] {
    const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    return this.shifts
      .filter(shift => {
        const shiftDateStr = new Date(shift.date).toISOString().split('T')[0];
        return shiftDateStr === dayStr;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
}
