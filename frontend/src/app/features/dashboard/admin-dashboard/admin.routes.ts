import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-dashboard.component').then(m => m.AdminDashboardComponent)
  }
  // Future routes:
  // { path: 'users', loadComponent: ... },
  // { path: 'roles', loadComponent: ... },
  // { path: 'settings', loadComponent: ... }
];
