import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { UpdateProfileRequest, User } from '@core/models/auth.model';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);

    // Signals
    user = signal<User | null>(null);
    loading = signal(false);
    saving = signal(false);
    successMessage = signal<string | null>(null);
    errorMessage = signal<string | null>(null);

    profileForm: FormGroup;

    constructor() {
        this.profileForm = this.fb.group({
            fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            phone: ['', [Validators.pattern(/^(0|\+84)[0-9]{9}$/)]]
        });
    }

    ngOnInit() {
        this.loadProfile();
    }

    /**
     * Load user profile
     */
    loadProfile() {
        this.loading.set(true);
        this.authService.currentUser$.subscribe({
            next: (user) => {
                if (user) {
                    this.user.set(user);
                    this.profileForm.patchValue({
                        fullName: user.fullName,
                        phone: user.phone || ''
                    });
                }
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading profile:', error);
                this.errorMessage.set('Không thể tải thông tin hồ sơ');
                this.loading.set(false);
            }
        });
    }

    /**
     * Submit form
     */
    onSubmit() {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        const updateData: UpdateProfileRequest = {
            fullName: this.profileForm.value.fullName,
            phone: this.profileForm.value.phone || undefined
        };

        this.authService.updateProfile(updateData).subscribe({
            next: (updatedUser) => {
                this.user.set(updatedUser);
                this.successMessage.set('Cập nhật thông tin thành công!');
                this.saving.set(false);
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    this.successMessage.set(null);
                }, 3000);
            },
            error: (error) => {
                console.error('Error updating profile:', error);
                this.errorMessage.set(error?.error?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
                this.saving.set(false);
            }
        });
    }

    /**
     * Reset form to original values
     */
    resetForm() {
        const user = this.user();
        if (user) {
            this.profileForm.patchValue({
                fullName: user.fullName,
                phone: user.phone || ''
            });
            this.errorMessage.set(null);
            this.successMessage.set(null);
        }
    }

    /**
     * Get form control error message
     */
    getErrorMessage(fieldName: string): string {
        const control = this.profileForm.get(fieldName);
        if (!control || !control.errors || !control.touched) {
            return '';
        }

        if (control.errors['required']) {
            return 'Trường này là bắt buộc';
        }
        if (control.errors['minlength']) {
            return `Tối thiểu ${control.errors['minlength'].requiredLength} ký tự`;
        }
        if (control.errors['maxlength']) {
            return `Tối đa ${control.errors['maxlength'].requiredLength} ký tự`;
        }
        if (control.errors['pattern']) {
            return 'Số điện thoại không hợp lệ (VD: 0901234567)';
        }

        return 'Giá trị không hợp lệ';
    }

    /**
     * Helper to get role display name
     */
    getRoleDisplay(): string {
        const user = this.user();
        return user?.role?.displayName || 'N/A';
    }

    /**
     * Helper to get department name
     */
    getDepartmentDisplay(): string {
        const user = this.user();
        return user?.department?.name || 'Chưa phân bổ';
    }

    /**
     * Helper to get employment type display
     */
    getEmploymentTypeDisplay(): string {
        const user = this.user();
        if (!user) return 'N/A';
        return user.employmentType === 'FULL_TIME' ? 'Toàn thời gian' : 'Bán thời gian';
    }
}
