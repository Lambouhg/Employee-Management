import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  changePasswordForm = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: this.passwordMatchValidator
  });

  // Custom validator to check if passwords match
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.changePasswordForm.value;
    const request = {
      oldPassword: formValue.oldPassword!,
      newPassword: formValue.newPassword!
    };

    this.authService.changePassword(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Đổi mật khẩu thành công';
        
        // Clear form
        this.changePasswordForm.reset();
        
        // Redirect after 2 seconds
        setTimeout(() => {
          // Go back or to dashboard
          const returnUrl = this.router.url.includes('/profile') 
            ? '/profile' 
            : '/manager/dashboard';
          this.router.navigate([returnUrl]);
        }, 2000);
      },
      error: (error) => {
        console.error('Change password error', error);
        this.isLoading = false;
        
        // Handle array of messages or single message
        const errorMsg = error.error?.message;
        if (Array.isArray(errorMsg)) {
          this.errorMessage = errorMsg.join(', ') || 'Đổi mật khẩu thất bại';
        } else {
          this.errorMessage = errorMsg || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.';
        }
      }
    });
  }

  get oldPassword() {
    return this.changePasswordForm.get('oldPassword');
  }

  get newPassword() {
    return this.changePasswordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.changePasswordForm.get('confirmPassword');
  }

  get passwordMismatch() {
    return this.changePasswordForm.hasError('passwordMismatch') && 
           this.confirmPassword?.touched;
  }

  cancel(): void {
    // Go back or to dashboard
    const returnUrl = this.router.url.includes('/profile') 
      ? '/profile' 
      : '/manager/dashboard';
    this.router.navigate([returnUrl]);
  }
}