import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DeptManagerLeavesService } from '../../services/leaves.service';
import { DeptLeaveRequestDetail } from '../../models/leave.model';

@Component({
    selector: 'app-dept-leave-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './dept-leave-detail.component.html',
    styleUrl: './dept-leave-detail.component.css'
})
export class DeptLeaveDetailComponent implements OnInit {
    private leavesService = inject(DeptManagerLeavesService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);

    // Signals
    leaveRequest = signal<DeptLeaveRequestDetail | null>(null);
    loading = signal(false);
    processing = signal(false);
    showRejectForm = signal(false);

    rejectForm: FormGroup;
    leaveId = '';

    constructor() {
        this.rejectForm = this.fb.group({
            rejectionReason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
        });
    }

    ngOnInit() {
        this.leaveId = this.route.snapshot.params['id'];
        this.loadLeaveDetail();
    }

    /**
     * Load leave request detail
     */
    loadLeaveDetail() {
        this.loading.set(true);
        this.leavesService.getLeaveRequestById(this.leaveId).subscribe({
            next: (data) => {
                this.leaveRequest.set(data);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading leave detail:', error);
                this.loading.set(false);
                alert('Không thể tải thông tin nghỉ phép');
                this.goBack();
            }
        });
    }

    /**
     * Approve leave request
     */
    approve() {
        const leave = this.leaveRequest();
        if (!leave) return;

        const hasConflicts = leave.conflictingShifts && leave.conflictingShifts.length > 0;
        
        let confirmMessage = 'Bạn có chắc chắn muốn duyệt yêu cầu nghỉ phép này?';
        if (hasConflicts) {
            confirmMessage = `Yêu cầu này có ${leave.conflictingShifts.length} ca làm việc conflict.\n` +
                'Các ca này sẽ tự động bị XÓA sau khi duyệt.\n\n' +
                'Bạn có chắc chắn muốn tiếp tục?';
        }

        if (!confirm(confirmMessage)) return;

        this.processing.set(true);
        this.leavesService.approveOrReject(this.leaveId, { action: 'APPROVE' }).subscribe({
            next: () => {
                this.processing.set(false);
                alert('Đã duyệt nghỉ phép thành công!');
                this.goBack();
            },
            error: (error) => {
                console.error('Error approving leave:', error);
                this.processing.set(false);
                alert(error?.error?.message || 'Có lỗi xảy ra khi duyệt nghỉ phép');
            }
        });
    }

    /**
     * Show reject form
     */
    openRejectForm() {
        this.showRejectForm.set(true);
    }

    /**
     * Cancel reject
     */
    cancelReject() {
        this.showRejectForm.set(false);
        this.rejectForm.reset();
    }

    /**
     * Reject leave request
     */
    reject() {
        if (this.rejectForm.invalid) {
            this.rejectForm.markAllAsTouched();
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn từ chối yêu cầu nghỉ phép này?')) return;

        this.processing.set(true);
        const rejectionReason = this.rejectForm.value.rejectionReason;

        this.leavesService.approveOrReject(this.leaveId, {
            action: 'REJECT',
            rejectionReason
        }).subscribe({
            next: () => {
                this.processing.set(false);
                alert('Đã từ chối yêu cầu nghỉ phép');
                this.goBack();
            },
            error: (error) => {
                console.error('Error rejecting leave:', error);
                this.processing.set(false);
                alert(error?.error?.message || 'Có lỗi xảy ra khi từ chối nghỉ phép');
            }
        });
    }

    /**
     * Go back to list
     */
    goBack() {
        this.router.navigate(['/dept-manager/leaves']);
    }

    /**
     * Format helpers
     */
    formatDate(date: string | Date): string {
        return new Date(date).toLocaleDateString('vi-VN');
    }

    getLeaveTypeText(type: string): string {
        switch (type) {
            case 'SICK': return 'Nghỉ ốm';
            case 'EMERGENCY': return 'Bất khả kháng';
            case 'PERSONAL': return 'Cá nhân';
            case 'OTHER': return 'Khác';
            default: return type;
        }
    }

    getStatusText(status: string): string {
        switch (status) {
            case 'PENDING': return 'Chờ duyệt';
            case 'APPROVED': return 'Đã duyệt';
            case 'REJECTED': return 'Từ chối';
            default: return status;
        }
    }

    getShiftTypeText(type: string): string {
        switch (type) {
            case 'MORNING': return 'Sáng';
            case 'AFTERNOON': return 'Chiều';
            case 'EVENING': return 'Tối';
            case 'NIGHT': return 'Đêm';
            default: return type;
        }
    }

    getScheduleStatusText(status: string): string {
        switch (status) {
            case 'PENDING': return 'Chờ duyệt';
            case 'APPROVED': return 'Đã duyệt';
            case 'LOCKED': return 'Đã khóa';
            default: return status;
        }
    }

    calculateDays(start: string | Date, end: string | Date): number {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    }

    getErrorMessage(fieldName: string): string {
        const control = this.rejectForm.get(fieldName);
        if (!control || !control.errors || !control.touched) return '';

        if (control.errors['required']) return 'Vui lòng nhập lý do từ chối';
        if (control.errors['minlength']) return 'Lý do phải có ít nhất 10 ký tự';
        if (control.errors['maxlength']) return 'Lý do không được vượt quá 500 ký tự';

        return 'Giá trị không hợp lệ';
    }
}
