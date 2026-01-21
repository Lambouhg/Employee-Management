import { Routes } from '@angular/router';
import { ManagerLayoutComponent } from './layout/manager-layout.component';

export const MANAGER_ROUTES: Routes = [
  {
    path: '',
    component: ManagerLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'employees',
        loadComponent: () => import('./pages/employee-list/employee-list.component').then(m => m.EmployeeListComponent)
      },
      {
        path: 'departments',
        loadComponent: () => import('./pages/department-list/department-list.component').then(m => m.DepartmentListComponent)
      },
      {
        path: 'approvals/schedules',
        loadComponent: () => import('./pages/approvals/schedule-approval/schedule-approval.component').then(m => m.ScheduleApprovalComponent)
      },
      {
        path: 'approvals/leaves',
        loadComponent: () => import('./pages/approvals/leave-approval/leave-approval.component').then(m => m.LeaveApprovalComponent)
      },
      {
        path: 'reports/attendance',
        loadComponent: () => import('./pages/reports/attendance-report/attendance-report.component').then(m => m.AttendanceReportComponent)
      },
      {
        path: 'reports/productivity',
        loadComponent: () => import('./pages/reports/productivity-report/productivity-report.component').then(m => m.ProductivityReportComponent)
      }
    ]
  }
];
