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
  // {
  //   path: 'employees/:id',
  //   loadComponent: () => import('../../manager/pages/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent)
  // },
  // {
  //   path: 'departments',
  //   loadComponent: () => import('../../manager/pages/department-list/department-list.component').then(m => m.DepartmentListComponent)
  // },
  // {
  //   path: 'departments/:id',
  //   loadComponent: () => import('../../manager/pages/department-detail/department-detail.component').then(m => m.DepartmentDetailComponent)
  // },
  // { path: 'schedules', loadComponent: ... },
  // { path: 'attendance', loadComponent: ... },
  // { path: 'leave-requests', loadComponent: ... },
  // { path: 'reports', loadComponent: ... }
];
