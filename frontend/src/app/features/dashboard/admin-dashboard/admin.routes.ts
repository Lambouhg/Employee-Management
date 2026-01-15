import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-dashboard.component').then(m => m.AdminDashboardComponent)
  }
  // Future routes:
  // {
  //   path: 'users',
  //   loadComponent: () => import('../../admin/pages/user-management/user-management.component').then(m => m.UserManagementComponent)
  // },
  // {
  //   path: 'roles',
  //   loadComponent: () => import('../../admin/pages/role-list/role-list.component').then(m => m.RoleListComponent)
  // },
  // {
  //   path: 'roles/:id/permissions',
  //   loadComponent: () => import('../../admin/pages/role-permissions/role-permissions.component').then(m => m.RolePermissionsComponent)
  // },
  // {
  //   path: 'settings',
  //   loadComponent: () => import('../../admin/pages/system-settings/system-settings.component').then(m => m.SystemSettingsComponent)
  // }
];
