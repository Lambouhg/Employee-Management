import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StaffLeavesService, StaffLeaveRequest, LeaveBalance, LeaveRequestList } from '../../services/staff-leaves.service';

@Component({
    selector: 'app-leave-requests',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './leave-requests.component.html',
    styleUrl: './leave-requests.component.css'
})
export class LeaveRequestsComponent implements OnInit {
    private leavesService = inject(StaffLeavesService);
    private router = inject(Router);

    // Signals
    leaveRequests = signal<LeaveRequestList | null>(null);
    leaveBalance = signal<LeaveBalance | null>(null);
    loading = signal(false);
    deleting = signal<string | null>(null);

    // Filter
    selectedStatus: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL';
    currentPage = 1;
    pageSize = 10;
    currentYear = new Date().getFullYear();

    ngOnInit() {
        this.loadLeaveBalance();
        this.loadLeaveRequests();
    }

    /**
     * Load số dư phép
     */
    loadLeaveBalance() {
        this.leavesService.getLeaveBalance().subscribe({
            next: (balance) => {
                this.leaveBalance.set(balance);
            },
            error: (error) => {
                console.error('Error loading leave balance:', error);
            }
        });
    }

    /**
     * Load danh sách yêu cầu
     */
    loadLeaveRequests(page: number = 1) {
        this.loading.set(true);
        this.currentPage = page;

        const params: any = {
            page: this.currentPage,
            limit: this.pageSize
        };

        if (this.selectedStatus !== 'ALL') {
            params.status = this.selectedStatus;
        }

        this.leavesService.getMyLeaveRequests(params).subscribe({
            next: (data) => {
                this.leaveRequests.set(data);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading leave requests:', error);
                this.loading.set(false);
            }
        });
    }

    /**
     * Filter by status
     */
    filterByStatus(status: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') {
        this.selectedStatus = status;
        this.loadLeaveRequests(1);
    }

    /**
     * Navigate to create form
     */
    createNewRequest() {
        this.router.navigate(['/staff/leaves/create']);
    }

    /**
     * Edit request
     */
    editRequest(id: string) {
        this.router.navigate(['/staff/leaves/edit', id]);
    }

    /**
     * Delete request
     */
    deleteRequest(id: string, leaveType: string) {
        if (!confirm(`Bạn có chắc chắn muốn hủy yêu cầu nghỉ ${this.getLeaveTypeName(leaveType)} này?`)) {
            return;
        }

        this.deleting.set(id);
        this.leavesService.deleteLeaveRequest(id).subscribe({
            next: () => {
                alert('Đã hủy yêu cầu thành công');
                this.deleting.set(null);
                this.loadLeaveRequests(this.currentPage);
                this.loadLeaveBalance();
            },
            error: (error) => {
                this.deleting.set(null);
                const message = error.error?.message || 'Có lỗi xảy ra khi hủy yêu cầu';
                alert(message);
            }
        });
    }

    /**
     * Get leave type display name
     */
    getLeaveTypeName(type: string): string {
        const names: Record<string, string> = {
            'SICK': 'Nghỉ ốm',
            'EMERGENCY': 'Bất khả kháng',
            'PERSONAL': 'Cá nhân',
            'OTHER': 'Khác'
        };
        return names[type] || type;
    }

    /**
     * Get status display name
     */
    getStatusName(status: string): string {
        const names: Record<string, string> = {
            'PENDING': 'Chờ duyệt',
            'APPROVED': 'Đã duyệt',
            'REJECTED': 'Bị từ chối'
        };
        return names[status] || status;
    }

    /**
     * Get status badge class
     */
    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            'PENDING': 'badge-warning',
            'APPROVED': 'badge-success',
            'REJECTED': 'badge-danger'
        };
        return classes[status] || 'badge-secondary';
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
     * Pagination
     */
    get pages(): number[] {
        const totalPages = this.leaveRequests()?.totalPages || 1;
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    goToPage(page: number) {
        if (page >= 1 && page <= (this.leaveRequests()?.totalPages || 1)) {
            this.loadLeaveRequests(page);
        }
    }
}
