import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffAttendanceService } from '../../services/staff-attendance.service';
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
     * Điểm danh
     */
    onCheckIn() {
        if (!confirm('Bạn có chắc chắn muốn điểm danh không?')) {
            return;
        }

        this.checkingIn.set(true);
        const request: CheckInRequest = {
            notes: this.checkInNotes.trim() || undefined
        };

        this.attendanceService.checkIn(request).subscribe({
            next: (result) => {
                this.checkingIn.set(false);
                this.checkInNotes = '';
                alert('Điểm danh thành công!');
                this.loadTodayAttendance();
                this.loadHistory();
            },
            error: (error) => {
                this.checkingIn.set(false);
                const message = error.error?.message || 'Có lỗi xảy ra khi điểm danh';
                alert(message);
            }
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
            [ShiftType.MORNING]: 'Ca sáng',
            [ShiftType.AFTERNOON]: 'Ca chiều',
            [ShiftType.EVENING]: 'Ca tối',
            [ShiftType.NIGHT]: 'Ca đêm'
        };
        return names[type] || type;
    }

    /**
     * Format status
     */
    getStatusName(status: AttendanceStatus): string {
        const names: Record<AttendanceStatus, string> = {
            [AttendanceStatus.PRESENT]: 'Có mặt',
            [AttendanceStatus.LATE]: 'Đi muộn',
            [AttendanceStatus.ABSENT]: 'Vắng mặt',
            [AttendanceStatus.EARLY_LEAVE]: 'Về sớm',
            [AttendanceStatus.ON_LEAVE]: 'Nghỉ phép'
        };
        return names[status] || status;
    }

    /**
     * Get status badge class
     */
    getStatusClass(status: AttendanceStatus): string {
        const classes: Record<AttendanceStatus, string> = {
            [AttendanceStatus.PRESENT]: 'badge-success',
            [AttendanceStatus.LATE]: 'badge-warning',
            [AttendanceStatus.ABSENT]: 'badge-danger',
            [AttendanceStatus.EARLY_LEAVE]: 'badge-info',
            [AttendanceStatus.ON_LEAVE]: 'badge-secondary'
        };
        return classes[status] || 'badge-secondary';
    }

    /**
     * Format time HH:mm
     */
    formatTime(timeString: string): string {
        const date = new Date(timeString);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Format date
     */
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    /**
     * Format datetime
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
