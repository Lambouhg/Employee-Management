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
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/dashboard/admin-dashboard/admin.routes').then(m => m.ADMIN_ROUTES)
      },
      {
        path: 'manager',
        canActivate: [roleGuard],
        data: { roles: ['manager'] },
        loadChildren: () => import('./features/dashboard/manager-dashboard/manager.routes').then(m => m.MANAGER_ROUTES)
      },
      {
        path: 'staff',
        canActivate: [roleGuard],
        data: { roles: ['super_staff', 'staff'] },
        loadChildren: () => import('./features/dashboard/staff-dashboard/staff.routes').then(m => m.STAFF_ROUTES)
      }
    ]
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
