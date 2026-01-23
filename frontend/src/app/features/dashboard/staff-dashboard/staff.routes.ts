import { Routes } from '@angular/router';

export const STAFF_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./staff-dashboard.component').then(m => m.StaffDashboardComponent)
  }
  // Future routes:
  // {
  //   path: 'profile',
  //   loadComponent: () => import('../../staff/pages/profile/profile.component').then(m => m.ProfileComponent)
  // },
  // {
  //   path: 'schedule',
  //   loadComponent: () => import('../../staff/pages/my-schedule/my-schedule.component').then(m => m.MyScheduleComponent)
  // },
  // {
  //   path: 'attendance',
  //   loadComponent: () => import('../../staff/pages/my-attendance/my-attendance.component').then(m => m.MyAttendanceComponent)
  // },
  // {
  //   path: 'leave-requests',
  //   children: [
  //     {
  //       path: '',
  //       loadComponent: () => import('../../staff/pages/leave-requests/leave-requests.component').then(m => m.LeaveRequestsComponent)
  //     },
  //     {
  //       path: 'new',
  //       loadComponent: () => import('../../staff/pages/leave-request-form/leave-request-form.component').then(m => m.LeaveRequestFormComponent)
  //     }
  //   ]
  // }
];
