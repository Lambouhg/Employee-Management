import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      },
      {
        path: 'change-password',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/change-password/change-password.component').then(m => m.ChangePasswordComponent)
      }
    ]
  }
];
