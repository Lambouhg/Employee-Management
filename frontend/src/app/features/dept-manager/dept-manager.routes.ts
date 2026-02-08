import { Routes } from '@angular/router';
import { DeptManagerLayoutComponent } from './layout/dept-manager-layout.component';

export const DEPT_MANAGER_ROUTES: Routes = [
    {
        path: '',
        component: DeptManagerLayoutComponent,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () => import('@features/dept-manager/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'employees',
                loadComponent: () => import('@features/dept-manager/pages/employee-list/employee-list.component').then(m => m.EmployeeListComponent)
            },
            {
                path: 'employees/:id',
                loadComponent: () => import('@features/dept-manager/pages/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent)
            },
            // Schedules (NEW API)
            {
                path: 'schedules',
                loadComponent: () => import('@features/dept-manager/pages/schedule-manager/schedule-manager.component').then(m => m.ScheduleManagerComponent)
            },
            {
                path: 'schedules/:id',
                loadComponent: () => import('@features/dept-manager/pages/schedule-editor/schedule-editor.component').then(m => m.ScheduleEditorComponent)
            },
            // Shift Assignment (Gán ca cho nhân viên)
            {
                path: 'shift-assignment',
                loadComponent: () => import('./pages/shift-assignment/shift-assignment.component').then(m => m.ShiftAssignmentComponent)
            },
            // Shift Registrations Approval (Duyệt đăng ký ca từ PT)
            {
                path: 'shift-registrations',
                loadComponent: () => import('./pages/shift-registrations/shift-registrations.component').then(m => m.ShiftRegistrationsComponent)
            },
            // Leave Requests Management
            {
                path: 'leaves',
                loadComponent: () => import('./pages/dept-leaves/dept-leaves.component').then(m => m.DeptLeavesComponent)
            },
            {
                path: 'leaves/:id',
                loadComponent: () => import('./pages/dept-leave-detail/dept-leave-detail.component').then(m => m.DeptLeaveDetailComponent)
            },
            // Legacy route redirect
            {
                path: 'plans',
                redirectTo: 'schedules',
                pathMatch: 'full'
            },
            {
                path: 'plans/:id',
                redirectTo: 'schedules/:id',
                pathMatch: 'full'
            }
        ]
    }
];

