import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StaffLeavesService, StaffLeaveRequest, LeaveBalance, LeaveRequestList } from '../../services/staff-leaves.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

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
    private toastService = inject(ToastService);
    private confirmDialog = inject(ConfirmDialogService);

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
        this.confirmDialog.confirm({
            title: 'Cancel Leave Request?',
            message: `Are you sure you want to cancel this ${this.getLeaveTypeName(leaveType)} request?`,
            confirmText: 'Cancel Request',
            cancelText: 'Keep It',
            type: 'danger'
        }).subscribe(confirmed => {
            if (!confirmed) return;

            this.deleting.set(id);
            this.leavesService.deleteLeaveRequest(id).subscribe({
                next: () => {
                    this.toastService.success('Leave request canceled successfully!');
                    this.deleting.set(null);
                    this.loadLeaveRequests(this.currentPage);
                    this.loadLeaveBalance();
                },
                error: (error) => {
                    this.deleting.set(null);
                    const message = error.error?.message || 'Failed to cancel leave request';
                    this.toastService.error(message);
                }
            });
        });
    }

    /**
     * Get leave type display name
     */
    getLeaveTypeName(type: string): string {
        const names: Record<string, string> = {
            'SICK': 'Sick Leave',
            'EMERGENCY': 'Emergency Leave',
            'PERSONAL': 'Personal Leave',
            'OTHER': 'Other'
        };
        return names[type] || type;
    }

    /**
     * Get status display name
     */
    getStatusName(status: string): string {
        const names: Record<string, string> = {
            'PENDING': 'Pending',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected'
        };
        return names[status] || status;
    }

    /**
     * Get status badge class for Tailwind CSS
     */
    getStatusBadgeClass(status: string): string {
        const classes: Record<string, string> = {
            'PENDING': 'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800',
            'APPROVED': 'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800',
            'REJECTED': 'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800'
        };
        return classes[status] || 'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800';
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
