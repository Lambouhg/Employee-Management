import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DeptManagerLeavesService } from '../../services/leaves.service';
import {
    DeptLeaveRequest,
    DeptLeavesListResponse,
    DeptLeaveStatsResponse
} from '../../models/leave.model';

@Component({
    selector: 'app-dept-leaves',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dept-leaves.component.html',
    styleUrl: './dept-leaves.component.css'
})
export class DeptLeavesComponent implements OnInit {
    private leavesService = inject(DeptManagerLeavesService);
    private router = inject(Router);

    // Signals
    leaveRequests = signal<DeptLeavesListResponse | null>(null);
    stats = signal<DeptLeaveStatsResponse | null>(null);
    loading = signal(false);
    statsLoading = signal(false);

    // Filter state
    selectedStatus: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL';
    currentPage = 1;
    pageSize = 20;

    ngOnInit() {
        this.loadLeaveRequests();
        this.loadStats();
    }

    /**
     * Load leave requests
     */
    loadLeaveRequests(page: number = 1) {
        this.loading.set(true);
        this.currentPage = page;

        const query: any = {
            page: this.currentPage,
            limit: this.pageSize
        };

        if (this.selectedStatus !== 'ALL') {
            query.status = this.selectedStatus;
        }

        this.leavesService.getLeaveRequests(query).subscribe({
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
     * Load statistics
     */
    loadStats() {
        this.statsLoading.set(true);
        this.leavesService.getLeaveStats().subscribe({
            next: (data) => {
                this.stats.set(data);
                this.statsLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading stats:', error);
                this.statsLoading.set(false);
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
     * View leave detail
     */
    viewDetail(leave: DeptLeaveRequest) {
        this.router.navigate(['/dept-manager/leaves', leave.id]);
    }

    /**
     * Get status badge class
     */
    getStatusClass(status: string): string {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'APPROVED': return 'status-approved';
            case 'REJECTED': return 'status-rejected';
            default: return '';
        }
    }

    /**
     * Get status display text
     */
    getStatusText(status: string): string {
        switch (status) {
            case 'PENDING': return 'Chờ duyệt';
            case 'APPROVED': return 'Đã duyệt';
            case 'REJECTED': return 'Từ chối';
            default: return status;
        }
    }

    /**
     * Get leave type display text
     */
    getLeaveTypeText(type: string): string {
        switch (type) {
            case 'SICK': return 'Nghỉ ốm';
            case 'EMERGENCY': return 'Bất khả kháng';
            case 'PERSONAL': return 'Cá nhân';
            case 'OTHER': return 'Khác';
            default: return type;
        }
    }

    /**
     * Format date
     */
    formatDate(date: string | Date): string {
        return new Date(date).toLocaleDateString('vi-VN');
    }

    /**
     * Calculate day count
     */
    calculateDays(start: string | Date, end: string | Date): number {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    }

    /**
     * Pagination
     */
    goToPage(page: number) {
        if (page >= 1 && page <= (this.leaveRequests()?.totalPages || 1)) {
            this.loadLeaveRequests(page);
        }
    }

    getPaginationRange(): number[] {
        const total = this.leaveRequests()?.totalPages || 1;
        const current = this.currentPage;
        const range: number[] = [];
        
        const showPages = 5;
        let start = Math.max(1, current - Math.floor(showPages / 2));
        let end = Math.min(total, start + showPages - 1);
        
        if (end - start < showPages - 1) {
            start = Math.max(1, end - showPages + 1);
        }
        
        for (let i = start; i <= end; i++) {
            range.push(i);
        }
        
        return range;
    }
}
