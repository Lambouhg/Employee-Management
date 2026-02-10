import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShiftOpening } from '@core/models/schedule.model';

@Component({
  selector: 'app-shift-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shift-detail-modal.component.html'
})
export class ShiftDetailModalComponent {
  @Input() shift: ShiftOpening | null = null;
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  getShiftTypeLabel(): string {
    if (!this.shift) return '';
    const labels: Record<string, string> = {
      'MORNING': 'Morning Shift',
      'AFTERNOON': 'Afternoon Shift',
      'EVENING': 'Evening Shift',
      'NIGHT': 'Night Shift'
    };
    return labels[this.shift.shiftType] || this.shift.shiftType;
  }

  getShiftTypeColor(): string {
    if (!this.shift) return 'gray';
    const colors: Record<string, string> = {
      'MORNING': 'amber',
      'AFTERNOON': 'blue',
      'EVENING': 'indigo',
      'NIGHT': 'slate'
    };
    return colors[this.shift.shiftType] || 'gray';
  }

  formatTime(time: string): string {
    if (!time) return '';
    if (time.includes('T') || time.includes('Z')) {
      const date = new Date(time);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return time.substring(0, 5);
  }

  formatDateTime(dateTime: string | undefined): string {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getAttendanceStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PRESENT': 'Present',
      'LATE': 'Late',
      'HALF_DAY': 'Half Day',
      'ABSENT': 'Absent'
    };
    return labels[status] || status;
  }

  getAttendanceStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PRESENT': 'green',
      'LATE': 'yellow',
      'HALF_DAY': 'blue',
      'ABSENT': 'red'
    };
    return colors[status] || 'gray';
  }

  getRegistrationPercentage(): number {
    if (!this.shift) return 0;
    return (this.shift.ptRegistered / this.shift.ptCapacity) * 100;
  }
}
