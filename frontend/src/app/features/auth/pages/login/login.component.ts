import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { AUTH_CONSTANTS, AUTH_ERROR_MESSAGES, AUTH_ROUTES_CONFIG } from '@features/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = false;
  errorMessage = '';
  
  // Rate limiting from constants
  private readonly MAX_ATTEMPTS = AUTH_CONSTANTS.RATE_LIMITING.MAX_LOGIN_ATTEMPTS;
  private readonly LOCKOUT_TIME = AUTH_CONSTANTS.RATE_LIMITING.LOCKOUT_DURATION_MS;
  private loginAttempts = 0;
  private lockoutUntil: number | null = null;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]  // No minLength - backend validates
  });

  onSubmit(): void {
    // Check if locked out
    if (this.lockoutUntil && Date.now() < this.lockoutUntil) {
      const remainingTime = Math.ceil((this.lockoutUntil - Date.now()) / 1000 / 60);
      this.errorMessage = `${AUTH_ERROR_MESSAGES.TOO_MANY_ATTEMPTS}. Vui lòng thử lại sau ${remainingTime} phút.`;
      return;
    }
    
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        // Reset attempts on success
        this.loginAttempts = 0;
        this.lockoutUntil = null;
        this.isLoading = false;

        // Redirect based on return URL or role
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || this.getDefaultRoute(response.user.role.name);
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        this.isLoading = false;
        this.loginAttempts++;
        
        // Generic error messages for security
        if (error.status === 401) {
          if (this.loginAttempts >= this.MAX_ATTEMPTS) {
            this.lockoutUntil = Date.now() + this.LOCKOUT_TIME;
            this.errorMessage = `${AUTH_ERROR_MESSAGES.TOO_MANY_ATTEMPTS}. Tài khoản tạm khóa ${AUTH_CONSTANTS.RATE_LIMITING.LOCKOUT_DURATION_MINUTES} phút.`;
          } else {
            const remaining = this.MAX_ATTEMPTS - this.loginAttempts;
            this.errorMessage = `${AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS}. Còn ${remaining} lần thử.`;
          }
        } else if (error.status === 429) {
          this.errorMessage = AUTH_ERROR_MESSAGES.TOO_MANY_REQUESTS;
        } else if (error.status === 423) {
          this.errorMessage = AUTH_ERROR_MESSAGES.ACCOUNT_LOCKED;
        } else {
          this.errorMessage = AUTH_ERROR_MESSAGES.LOGIN_FAILED;
        }
      }
    });
  }

  private getDefaultRoute(roleName: string): string {
    const role = roleName.toUpperCase();
    switch (role) {
      case 'MANAGER':
        return AUTH_ROUTES_CONFIG.MANAGER_DEFAULT;
      case 'DEPT_MANAGER':
        return AUTH_ROUTES_CONFIG.DEPT_MANAGER_DEFAULT;
      case 'STAFF':
        return AUTH_ROUTES_CONFIG.STAFF_DEFAULT;
      default:
        return AUTH_ROUTES_CONFIG.LOGIN;
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
