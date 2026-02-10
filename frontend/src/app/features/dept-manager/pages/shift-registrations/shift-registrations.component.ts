import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShiftRegistrationsService } from '../../services/shift-registrations.service';
import {
  ShiftRegistration,
  RegistrationStatus,
  GetRegistrationsQuery,
  ReviewRegistrationDto,
  ShiftType,
  PaginatedRegistrationsResponse
} from '../../models/shift-registration.model';
import { LucideAngularModule, CheckCircle, XCircle, Clock, Calendar, User, Briefcase } from 'lucide-angular';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { switchMap, map, catchError, tap, shareReplay, startWith } from 'rxjs/operators';

/**
 * Component để quản lý shift registration approvals
 * Pattern này có thể tái sử dụng cho Leave Approvals và Attendance Approvals
 */
@Component({
  selector: 'app-shift-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './shift-registrations.component.html',
  styleUrls: ['./shift-registrations.component.css']
})
export class ShiftRegistrationsComponent implements OnInit {
  private service = inject(ShiftRegistrationsService);

  // Icons
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly Briefcase = Briefcase;

  // Expose Math for template
  readonly Math = Math;

  // Reactive data streams
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);
  
  // Filters (will trigger refresh when changed)
  selectedStatus: RegistrationStatus | 'ALL' = RegistrationStatus.PENDING;
  selectedDate: string = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 20;

  // Data streams
  viewState$!: Observable<{
    registrations: ShiftRegistration[];
    totalPages: number;
    totalItems: number;
    pendingCount: number;
    loading: boolean;
    error: string | null;
  }>;

  // Rejection modal
  showRejectModal = false;
  rejectingRegistration: ShiftRegistration | null = null;
  rejectionReason = '';

  // Status enum for template
  readonly RegistrationStatus = RegistrationStatus;

  ngOnInit() {
    // Setup reactive data stream
    this.viewState$ = this.refreshTrigger$.pipe(
      switchMap(() => {
        // Build query
        const query: GetRegistrationsQuery = {
          page: this.currentPage,
          limit: this.pageSize
        };

        if (this.selectedStatus !== 'ALL') {
          query.status = this.selectedStatus as RegistrationStatus;
        }
        if (this.selectedDate) {
          query.date = this.selectedDate;
        }

        // Combine registrations + stats API calls
        return combineLatest([
          this.service.getRegistrations(query),
          this.service.getStats()
        ]).pipe(
          map(([registrationsResponse, stats]) => ({
            registrations: registrationsResponse.data,
            totalPages: registrationsResponse.meta.totalPages,
            totalItems: registrationsResponse.meta.total,
            pendingCount: stats.pending,
            loading: false,
            error: null
          })),
          catchError(err => {
            console.error('Error loading data:', err);
            return of({
              registrations: [],
              totalPages: 1,
              totalItems: 0,
              pendingCount: 0,
              loading: false,
              error: 'Không thể tải danh sách đăng ký. Vui lòng thử lại.'
            });
          }),
          startWith({
            registrations: [],
            totalPages: 1,
            totalItems: 0,
            pendingCount: 0,
            loading: true,
            error: null
          })
        );
      }),
      shareReplay(1)
    );
  }

  /**
   * Trigger refresh
   */
  private refresh() {
    this.refreshTrigger$.next();
  }

  /**
   * Filter by status
   */
  onStatusChange(status: RegistrationStatus | 'ALL') {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.refresh();
  }

  /**
   * Filter by date
   */
  onDateChange() {
    this.currentPage = 1;
    this.refresh();
  }

  /**
   * Clear date filter
   */
  clearDateFilter() {
    this.selectedDate = '';
    this.onDateChange();
  }

  /**
   * Approve registration
   */
  approveRegistration(registration: ShiftRegistration) {
    if (!confirm(`Xác nhận duyệt đơn đăng ký ca của ${registration.employee.fullName}?`)) {
      return;
    }

    const review: ReviewRegistrationDto = {
      status: RegistrationStatus.APPROVED
    };

    this.service.reviewRegistration(registration.id, review).subscribe({
      next: () => {
        // Refresh để reload cả registrations và stats trong 1 lần
        this.refresh();
      },
      error: (err) => {
        alert(err.error?.message || 'Không thể duyệt đơn. Vui lòng thử lại.');
        console.error('Error approving registration:', err);
      }
    });
  }

  /**
   * Show reject modal
   */
  openRejectModal(registration: ShiftRegistration) {
    this.rejectingRegistration = registration;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  /**
   * Close reject modal
   */
  closeRejectModal() {
    this.showRejectModal = false;
    this.rejectingRegistration = null;
    this.rejectionReason = '';
  }

  /**
   * Confirm rejection
   */
  confirmReject() {
    if (!this.rejectingRegistration) return;
    
    if (!this.rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    const review: ReviewRegistrationDto = {
      status: RegistrationStatus.REJECTED,
      rejectionReason: this.rejectionReason.trim()
    };

    this.service.reviewRegistration(this.rejectingRegistration.id, review).subscribe({
      next: () => {
        this.closeRejectModal();
        // Refresh để reload cả registrations và stats trong 1 lần
        this.refresh();
      },
      error: (err) => {
        alert(err.error?.message || 'Không thể từ chối đơn. Vui lòng thử lại.');
        console.error('Error rejecting registration:', err);
      }
    });
  }

  /**
   * Pagination
   */
  goToPage(page: number) {
    this.currentPage = page;
    this.refresh();
  }

  /**
   * Helper: Get status label
   */
  getStatusLabel(status: RegistrationStatus): string {
    const labels = {
      [RegistrationStatus.PENDING]: 'Chờ duyệt',
      [RegistrationStatus.APPROVED]: 'Đã duyệt',
      [RegistrationStatus.REJECTED]: 'Từ chối',
      [RegistrationStatus.CANCELLED]: 'Đã hủy'
    };
    return labels[status] || status;
  }

  /**
   * Helper: Get status CSS class
   */
  getStatusClass(status: RegistrationStatus): string {
    const classes = {
      [RegistrationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [RegistrationStatus.APPROVED]: 'bg-green-100 text-green-800',
      [RegistrationStatus.REJECTED]: 'bg-red-100 text-red-800',
      [RegistrationStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Helper: Get shift type label
   */
  getShiftTypeLabel(type: ShiftType): string {
    const labels = {
      [ShiftType.MORNING]: 'Sáng',
      [ShiftType.AFTERNOON]: 'Chiều',
      [ShiftType.EVENING]: 'Tối',
      [ShiftType.NIGHT]: 'Đêm'
    };
    return labels[type] || type;
  }

  /**
   * Helper: Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Helper: Format time
   */
  formatTime(timeString: string): string {
    return timeString.substring(0, 5); // HH:mm
  }

  /**
   * Helper: Get employment type label
   */
  getEmploymentTypeLabel(type: string): string {
    return type === 'FULL_TIME' ? 'Full-time' : 'Part-time';
  }

  /**
   * Helper: Get initials from full name
   */
  getInitials(fullName: string): string {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Helper: Format datetime with time
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
