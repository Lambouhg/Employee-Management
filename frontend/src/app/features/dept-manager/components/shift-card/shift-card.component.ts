import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShiftOpening, ShiftType } from '@core/models/schedule.model';

@Component({
  selector: 'app-shift-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shift-card.component.html'
})
export class ShiftCardComponent {
  @Input() shift!: ShiftOpening;
  @Input() canEdit: boolean = false;
  
  @Output() edit = new EventEmitter<ShiftOpening>();
  @Output() delete = new EventEmitter<ShiftOpening>();

  onClick() {
    // Always allow viewing details
    this.edit.emit(this.shift);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    if (confirm('Delete this shift?')) {
      this.delete.emit(this.shift);
    }
  }

  getCardClasses(): string {
    const baseClasses = [];
    if (this.shift.shiftType === 'MORNING') baseClasses.push('border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50');
    else if (this.shift.shiftType === 'AFTERNOON') baseClasses.push('border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50');
    else if (this.shift.shiftType === 'EVENING') baseClasses.push('border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50');
    else if (this.shift.shiftType === 'NIGHT') baseClasses.push('border-slate-300 bg-gradient-to-br from-slate-100 to-gray-100');
    return baseClasses.join(' ');
  }

  getBadgeClasses(): string {
    const badges: Record<string, string> = {
      'MORNING': 'bg-amber-100 text-amber-800',
      'AFTERNOON': 'bg-blue-100 text-blue-800',
      'EVENING': 'bg-indigo-100 text-indigo-800',
      'NIGHT': 'bg-slate-200 text-slate-800'
    };
    return badges[this.shift.shiftType] || 'bg-gray-100 text-gray-800';
  }

  getDeleteButtonClasses(): string {
    const classes: Record<string, string> = {
      'MORNING': 'text-amber-400 hover:bg-amber-100 hover:text-amber-600',
      'AFTERNOON': 'text-blue-400 hover:bg-blue-100 hover:text-blue-600',
      'EVENING': 'text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600',
      'NIGHT': 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
    };
    return classes[this.shift.shiftType] || 'text-gray-400 hover:bg-gray-100 hover:text-gray-600';
  }

  getShiftTypeLabel(): string {
    const labels: Record<string, string> = {
      'MORNING': 'Morning',
      'AFTERNOON': 'Afternoon',
      'EVENING': 'Evening',
      'NIGHT': 'Night'
    };
    return labels[this.shift.shiftType] || this.shift.shiftType;
  }

  getRegistrationPercentage(): number {
    return (this.shift.ptRegistered / this.shift.ptCapacity) * 100;
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

  getCheckedInCount(): number {
    if (!this.shift.shifts) return 0;
    return this.shift.shifts.filter(s => s.attendance?.checkInTime).length;
  }
}