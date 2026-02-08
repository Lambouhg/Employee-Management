import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  forgotPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  emailSent = false;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(this.forgotPasswordForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.emailSent = true;
        this.successMessage = response.message;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      }
    });
  }

  backToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
