import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
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
        console.log('Login successful', response.user);
        this.isLoading = false;
        
        // Redirect based on return URL or role
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || this.getDefaultRoute(response.user.role.name);
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        console.error('Login error', error);
        this.isLoading = false;
        // Handle array of messages or single message
        const errorMsg = error.error?.message;
        if (Array.isArray(errorMsg)) {
          this.errorMessage = errorMsg.join(', ') || 'Email hoặc mật khẩu không đúng';
        } else {
          this.errorMessage = errorMsg || 'Email hoặc mật khẩu không đúng';
        }
      }
    });
  }

  private getDefaultRoute(roleName: string): string {
    const role = roleName.toUpperCase();
    switch (role) {
      case 'MANAGER':
        return '/manager';
      case 'DEPT_MANAGER':
        return '/manager'; // Department managers cũng dùng manager dashboard
      case 'STAFF':
        return '/staff';
      default:
        return '/login';
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
