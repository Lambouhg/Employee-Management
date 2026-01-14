import { Routes } from '@angular/router';

export const MANAGER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./manager-dashboard.component').then(m => m.ManagerDashboardComponent)
  },
  {
    path: 'employees',
    loadComponent: () => import('../../manager/pages/employee-list/employee-list.component').then(m => m.EmployeeListComponent)
  }
  // Future routes:
  // { path: 'schedules', loadComponent: ... },
  // { path: 'attendance', loadComponent: ... },
  // { path: 'reports', loadComponent: ... }
];
