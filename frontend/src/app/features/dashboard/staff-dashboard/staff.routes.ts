import { Routes } from '@angular/router';

export const STAFF_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./staff-dashboard.component').then(m => m.StaffDashboardComponent)
  }
  // Future routes:
  // { path: 'my-schedule', loadComponent: ... },
  // { path: 'my-attendance', loadComponent: ... },
  // { path: 'profile', loadComponent: ... }
];
