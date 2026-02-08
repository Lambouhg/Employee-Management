import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  resetSuccess = false;
  token: string | null = null;
  showPassword = false;
  showConfirmPassword = false;

  constructor() {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Get token from URL query parameters
    this.token = this.route.snapshot.queryParamMap.get('token');
    
    if (!this.token) {
      this.errorMessage = 'Token không hợp lệ. Vui lòng thử lại từ email.';
    }
  }

  get newPassword() {
    return this.resetPasswordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid || !this.token) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = {
      token: this.token,
      newPassword: this.resetPasswordForm.value.newPassword
    };

    this.authService.resetPassword(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.resetSuccess = true;
        this.successMessage = response.message;
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  requestNewToken() {
    this.router.navigate(['/auth/forgot-password']);
  }
}
