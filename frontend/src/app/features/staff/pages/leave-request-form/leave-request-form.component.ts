import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StaffLeavesService, CreateLeaveRequest, StaffLeaveRequest } from '../../services/staff-leaves.service';

@Component({
    selector: 'app-leave-request-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './leave-request-form.component.html',
    styleUrl: './leave-request-form.component.css'
})
export class LeaveRequestFormComponent implements OnInit {
    private leavesService = inject(StaffLeavesService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    // Signals
    loading = signal(false);
    submitting = signal(false);
    isEditMode = signal(false);

    // Form data
    leaveRequestId: string | null = null;
    leaveType: 'SICK' | 'EMERGENCY' | 'PERSONAL' | 'OTHER' = 'PERSONAL';
    startDate: string = '';
    endDate: string = '';
    reason: string = '';

    // Validation errors
    errors: { [key: string]: string } = {};

    ngOnInit() {
        // Check if edit mode
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.leaveRequestId = params['id'];
                this.isEditMode.set(true);
                this.loadLeaveRequest();
            }
        });

        // Set min date to today
        const today = new Date();
        this.startDate = today.toISOString().split('T')[0];
        this.endDate = today.toISOString().split('T')[0];
    }

    /**
     * Load existing leave request for editing
     */
    loadLeaveRequest() {
        if (!this.leaveRequestId) return;

        this.loading.set(true);
        this.leavesService.getLeaveRequestById(this.leaveRequestId).subscribe({
            next: (request) => {
                this.leaveType = request.leaveType;
                this.startDate = request.startDate.split('T')[0];
                this.endDate = request.endDate.split('T')[0];
                this.reason = request.reason;
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading leave request:', error);
                alert('Không thể tải thông tin yêu cầu');
                this.router.navigate(['/staff/leaves']);
                this.loading.set(false);
            }
        });
    }

    /**
     * Validate form
     */
    validateForm(): boolean {
        this.errors = {};

        if (!this.leaveType) {
            this.errors['leaveType'] = 'Vui lòng chọn loại nghỉ';
        }

        if (!this.startDate) {
            this.errors['startDate'] = 'Vui lòng chọn ngày bắt đầu';
        }

        if (!this.endDate) {
            this.errors['endDate'] = 'Vui lòng chọn ngày kết thúc';
        }

        if (this.startDate && this.endDate) {
            const start = new Date(this.startDate);
            const end = new Date(this.endDate);

            if (end < start) {
                this.errors['endDate'] = 'Ngày kết thúc phải sau ngày bắt đầu';
            }
        }

        if (!this.reason || this.reason.trim().length < 10) {
            this.errors['reason'] = 'Lý do phải có ít nhất 10 ký tự';
        }

        return Object.keys(this.errors).length === 0;
    }

    /**
     * Submit form
     */
    onSubmit() {
        if (!this.validateForm()) {
            return;
        }

        this.submitting.set(true);

        const request: CreateLeaveRequest = {
            leaveType: this.leaveType,
            startDate: this.startDate,
            endDate: this.endDate,
            reason: this.reason.trim()
        };

        const observable = this.isEditMode()
            ? this.leavesService.updateLeaveRequest(this.leaveRequestId!, request)
            : this.leavesService.createLeaveRequest(request);

        observable.subscribe({
            next: () => {
                const message = this.isEditMode() 
                    ? 'Đã cập nhật yêu cầu thành công' 
                    : 'Đã tạo yêu cầu nghỉ phép thành công';
                alert(message);
                this.router.navigate(['/staff/leaves']);
            },
            error: (error) => {
                this.submitting.set(false);
                const message = error.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại';
                alert(message);
            }
        });
    }

    /**
     * Cancel and go back
     */
    onCancel() {
        if (confirm('Bạn có chắc chắn muốn hủy? Các thay đổi sẽ không được lưu.')) {
            this.router.navigate(['/staff/leaves']);
        }
    }

    /**
     * Get leave type name
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
     * Calculate day count
     */
    get dayCount(): number {
        if (!this.startDate || !this.endDate) return 0;

        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    }

    /**
     * Get today's date for min attribute
     */
    get today(): string {
        return new Date().toISOString().split('T')[0];
    }
}
