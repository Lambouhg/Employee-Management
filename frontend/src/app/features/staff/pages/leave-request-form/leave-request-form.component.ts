import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StaffLeavesService, CreateLeaveRequest, StaffLeaveRequest } from '../../services/staff-leaves.service';
import { LoadingSpinnerComponent, ErrorMessageComponent } from '../../../../shared/components';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
    selector: 'app-leave-request-form',
    standalone: true,
    imports: [CommonModule, FormsModule, LoadingSpinnerComponent, ErrorMessageComponent],
    templateUrl: './leave-request-form.component.html',
    styleUrl: './leave-request-form.component.css'
})
export class LeaveRequestFormComponent implements OnInit {
    private leavesService = inject(StaffLeavesService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private toastService = inject(ToastService);
    private confirmDialog = inject(ConfirmDialogService);

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
                this.toastService.error('Cannot load leave request information');
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
            this.errors['leaveType'] = 'Please select leave type';
        }

        if (!this.startDate) {
            this.errors['startDate'] = 'Please select start date';
        }

        if (!this.endDate) {
            this.errors['endDate'] = 'Please select end date';
        }

        if (this.startDate && this.endDate) {
            const start = new Date(this.startDate);
            const end = new Date(this.endDate);

            if (end < start) {
                this.errors['endDate'] = 'End date must be after start date';
            }
        }

        if (!this.reason || this.reason.trim().length < 10) {
            this.errors['reason'] = 'Reason must be at least 10 characters';
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
                this.submitting.set(false);
                const message = this.isEditMode() 
                    ? 'Leave request updated successfully!' 
                    : this.isEmergencyLeave
                        ? 'Emergency leave request submitted successfully!'
                        : 'Leave request submitted successfully!';
                this.toastService.success(message);
                this.router.navigate(['/staff/leaves']);
            },
            error: (error) => {
                this.submitting.set(false);
                const message = error.error?.message || 'An error occurred. Please try again.';
                this.toastService.error(message);
            }
        });
    }

    /**
     * Cancel and go back
     */
    onCancel() {
        // Check if form has unsaved changes
        const hasChanges = this.leaveType !== 'PERSONAL' || 
                          this.startDate !== new Date().toISOString().split('T')[0] ||
                          this.endDate !== new Date().toISOString().split('T')[0] ||
                          this.reason.trim().length > 0;

        if (hasChanges) {
            this.confirmDialog.confirm({
                title: 'Discard Changes?',
                message: 'You have unsaved changes. Are you sure you want to leave without saving?',
                confirmText: 'Discard',
                cancelText: 'Continue Editing',
                type: 'warning'
            }).subscribe(confirmed => {
                if (confirmed) {
                    this.router.navigate(['/staff/leaves']);
                }
            });
        } else {
            this.router.navigate(['/staff/leaves']);
        }
    }

    /**
     * Get leave type name
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
     * Check if this is an emergency leave (within 2 days from today)
     */
    get isEmergencyLeave(): boolean {
        if (!this.startDate) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const emergencyThreshold = new Date(today);
        emergencyThreshold.setDate(emergencyThreshold.getDate() + 2);
        
        const requestStart = new Date(this.startDate);
        return requestStart <= emergencyThreshold;
    }

    /**
     * Get today's date for min attribute
     */
    get today(): string {
        return new Date().toISOString().split('T')[0];
    }
}
