import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./features/auth/pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/pages/change-password/change-password.component').then(m => m.ChangePasswordComponent)
  },
  {
    path: 'manager',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    loadChildren: () => import('./features/manager/manager.routes').then(m => m.MANAGER_ROUTES)
  },
  {
    path: 'dept-manager',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DEPT_MANAGER'] },
    loadChildren: () => import('./features/dept-manager/dept-manager.routes').then(m => m.DEPT_MANAGER_ROUTES)
  },
  {
    path: 'staff',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['STAFF'] },
    loadChildren: () => import('./features/staff/staff.routes').then(m => m.STAFF_ROUTES)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
