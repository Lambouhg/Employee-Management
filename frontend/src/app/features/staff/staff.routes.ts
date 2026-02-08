import { Routes } from '@angular/router';
import { StaffLayoutComponent } from './layout/staff-layout.component';

export const STAFF_ROUTES: Routes = [
    {
        path: '',
        component: StaffLayoutComponent,
        children: [
            { path: '', redirectTo: 'my-schedule', pathMatch: 'full' },
            {
                path: 'my-schedule',
                loadComponent: () => import('./pages/my-schedule/my-schedule.component').then(m => m.MyScheduleComponent)
            },
            {
                path: 'available-shifts',
                loadComponent: () => import('./pages/available-shifts/available-shifts.component').then(m => m.AvailableShiftsComponent)
            },
            {
                path: 'my-registrations',
                loadComponent: () => import('./pages/my-registrations/my-registrations.component').then(m => m.MyRegistrationsComponent)
            },
            {
                path: 'attendance',
                loadComponent: () => import('./pages/attendance/attendance.component').then(m => m.AttendanceComponent)
            },
            {
                path: 'leaves',
                loadComponent: () => import('./pages/leave-requests/leave-requests.component').then(m => m.LeaveRequestsComponent)
            },
            {
                path: 'leaves/create',
                loadComponent: () => import('./pages/leave-request-form/leave-request-form.component').then(m => m.LeaveRequestFormComponent)
            },
            {
                path: 'leaves/edit/:id',
                loadComponent: () => import('./pages/leave-request-form/leave-request-form.component').then(m => m.LeaveRequestFormComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
            }
        ]
    }
];
