import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffShiftRegistrationsService, ShiftRegistration } from '../../services/staff-shift-registrations.service';
import { Observable, BehaviorSubject, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-my-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-registrations.component.html',
  styleUrls: ['./my-registrations.component.css']
})
export class MyRegistrationsComponent implements OnInit {
  private shiftService = inject(StaffShiftRegistrationsService);

  registrations$!: Observable<ShiftRegistration[]>;
  selectedStatus: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL';
  isCancelling = false;
  
  errorMessage = '';
  successMessage = '';
  
  private refreshSubject = new BehaviorSubject<void>(undefined);

  ngOnInit() {
    this.loadRegistrations();
  }

  loadRegistrations() {
    this.registrations$ = this.refreshSubject.pipe(
      switchMap(() => {
        const query = this.selectedStatus === 'ALL' ? undefined : { status: this.selectedStatus };
        return this.shiftService.getMyRegistrations(query);
      }),
      catchError(error => {
        this.errorMessage = 'Unable to load registrations';
        return of([]);
      })
    );
  }

  onStatusFilterChange() {
    this.refreshSubject.next();
  }

  cancelRegistration(registration: ShiftRegistration) {
    if (!confirm(`Cancel ${this.getShiftTypeLabel(registration.opening?.shiftType || '')} shift registration?`)) {
      return;
    }

    this.isCancelling = true;
    this.errorMessage = '';

    this.shiftService.cancelRegistration(registration.id).subscribe({
      next: () => {
        this.successMessage = 'Registration canceled successfully!';
        this.refreshSubject.next();
        this.isCancelling = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to cancel registration';
        this.isCancelling = false;
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Pending',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'APPROVED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
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
      'MORNING': 'border-l-4 border-amber-400',
      'AFTERNOON': 'border-l-4 border-blue-400',
      'EVENING': 'border-l-4 border-indigo-400',
      'NIGHT': 'border-l-4 border-slate-400'
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

  canCancel(registration: ShiftRegistration): boolean {
    return registration.status === 'PENDING';
  }
}
