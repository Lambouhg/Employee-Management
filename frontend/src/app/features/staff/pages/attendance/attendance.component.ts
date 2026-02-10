import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffAttendanceService } from '../../services/staff-attendance.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import {
    TodayAttendance,
    AttendanceHistory,
    AttendanceStatus,
    ShiftType,
    CheckInRequest
} from '../../../../core/models/attendance.model';

@Component({
    selector: 'app-attendance',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './attendance.component.html',
    styleUrl: './attendance.component.css'
})
export class AttendanceComponent implements OnInit {
    private attendanceService = inject(StaffAttendanceService);
    private toastService = inject(ToastService);
    private confirmDialog = inject(ConfirmDialogService);

    // Signals
    todayAttendance = signal<TodayAttendance | null>(null);
    attendanceHistory = signal<AttendanceHistory | null>(null);
    loading = signal(false);
    checkingIn = signal(false);
    currentTime = signal(new Date());

    // Form data
    checkInNotes = '';

    // Pagination
    currentPage = 1;
    pageSize = 10;

    // Expose enums to template
    AttendanceStatus = AttendanceStatus;
    ShiftType = ShiftType;

    ngOnInit() {
        this.loadTodayAttendance();
        this.loadHistory();
        this.startClock();
    }

    /**
     * Clock cập nhật mỗi giây
     */
    private startClock() {
        setInterval(() => {
            this.currentTime.set(new Date());
        }, 1000);
    }

    /**
     * Load thông tin ca làm hôm nay
     */
    loadTodayAttendance() {
        this.loading.set(true);
        this.attendanceService.getTodayAttendance().subscribe({
            next: (data) => {
                this.todayAttendance.set(data);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading today attendance:', error);
                this.loading.set(false);
            }
        });
    }

    /**
     * Check-in attendance for specific shift
     */
    onCheckIn(shiftId: string) {
        this.confirmDialog.confirm({
            title: 'Check-In Confirmation',
            message: 'Are you ready to check in for your shift?',
            confirmText: 'Check-In',
            cancelText: 'Cancel',
            type: 'info'
        }).subscribe(confirmed => {
            if (!confirmed) return;

            this.checkingIn.set(true);
            const request: CheckInRequest = {
                shiftId,
                notes: this.checkInNotes.trim() || undefined
            };

            this.attendanceService.checkIn(request).subscribe({
                next: (result) => {
                    this.checkingIn.set(false);
                    this.checkInNotes = '';
                    this.toastService.success('Check-in successful!');
                    this.loadTodayAttendance();
                    this.loadHistory();
                },
                error: (error) => {
                    this.checkingIn.set(false);
                    const message = error.error?.message || 'Failed to check in. Please try again.';
                    this.toastService.error(message);
                }
            });
        });
    }

    /**
     * Load lịch sử điểm danh
     */
    loadHistory(page: number = 1) {
        this.currentPage = page;
        this.attendanceService.getHistory({
            page: this.currentPage,
            limit: this.pageSize
        }).subscribe({
            next: (data) => {
                this.attendanceHistory.set(data);
            },
            error: (error) => {
                console.error('Error loading history:', error);
            }
        });
    }

    /**
     * Format shift type
     */
    getShiftTypeName(type: ShiftType): string {
        const names: Record<ShiftType, string> = {
            [ShiftType.MORNING]: 'Morning Shift',
            [ShiftType.AFTERNOON]: 'Afternoon Shift',
            [ShiftType.EVENING]: 'Evening Shift',
            [ShiftType.NIGHT]: 'Night Shift'
        };
        return names[type] || type;
    }

    /**
     * Format status
     */
    getStatusName(status: AttendanceStatus): string {
        const names: Record<AttendanceStatus, string> = {
            [AttendanceStatus.PRESENT]: 'Present',
            [AttendanceStatus.LATE]: 'Late',
            [AttendanceStatus.ABSENT]: 'Absent',
            [AttendanceStatus.EARLY_LEAVE]: 'Early Leave',
            [AttendanceStatus.ON_LEAVE]: 'On Leave'
        };
        return names[status] || status;
    }

    /**
     * Get status badge class for Tailwind CSS
     */
    getStatusBadgeClass(status: AttendanceStatus): string {
        const classes: Record<AttendanceStatus, string> = {
            [AttendanceStatus.PRESENT]: 'inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800',
            [AttendanceStatus.LATE]: 'inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800',
            [AttendanceStatus.ABSENT]: 'inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800',
            [AttendanceStatus.EARLY_LEAVE]: 'inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800',
            [AttendanceStatus.ON_LEAVE]: 'inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800'
        };
        return classes[status] || 'inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800';
    }

    /**
     * Format time HH:mm
     */
    formatTime(timeString: string): string {
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Format date
     */
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    }

    /**
     * Format datetime
     */
    formatDateTime(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Pagination helpers
     */
    get pages(): number[] {
        const totalPages = this.attendanceHistory()?.totalPages || 1;
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    goToPage(page: number) {
        if (page >= 1 && page <= (this.attendanceHistory()?.totalPages || 1)) {
            this.loadHistory(page);
        }
    }
}
