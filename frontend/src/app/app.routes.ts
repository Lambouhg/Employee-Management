import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  // Backward compatibility - redirect old login path
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full'
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
