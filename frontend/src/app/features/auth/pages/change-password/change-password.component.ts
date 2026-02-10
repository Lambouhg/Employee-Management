import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { AuthValidators, AUTH_ERROR_MESSAGES, AUTH_SUCCESS_MESSAGES } from '@features/auth';

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
    newPassword: ['', [
      Validators.required,
      AuthValidators.strongPassword()
    ]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: [
      AuthValidators.passwordMatch('newPassword', 'confirmPassword'),
      AuthValidators.passwordDifferent('oldPassword', 'newPassword')
    ]
  });

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
        this.successMessage = response.message || AUTH_SUCCESS_MESSAGES.PASSWORD_CHANGED;
        
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
        this.isLoading = false;
        
        // Generic error messages for security
        if (error.status === 401) {
          this.errorMessage = AUTH_ERROR_MESSAGES.PASSWORD_INCORRECT;
        } else if (error.status === 400) {
          this.errorMessage = AUTH_ERROR_MESSAGES.PASSWORD_INVALID;
        } else {
          this.errorMessage = AUTH_ERROR_MESSAGES.CHANGE_PASSWORD_FAILED;
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