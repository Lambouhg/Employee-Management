import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent, NavMenuItem } from '@shared/components/navbar/navbar.component';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';
import { 
  LucideAngularModule, 
  LayoutDashboard, 
  Users, 
  Building2,
  ClipboardList,
  FileText,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-angular';

@Component({
  selector: 'app-schedule-approval',
  standalone: true,
  imports: [CommonModule,LucideAngularModule],
  template: `
    <div class="flex h-screen overflow-hidden">
      <div class="flex-1 flex flex-col bg-gray-50 overflow-auto">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-8 py-6">
          <h1 class="text-2xl font-semibold text-gray-900">Schedule Approvals</h1>
          <p class="text-sm text-gray-500 mt-1">Review and approve employee work schedules</p>
        </div>

        <!-- Content -->
        <div class="flex-1 p-8">
          <div class="bg-white rounded-lg shadow">
            <!-- Coming Soon Message -->
            <div class="text-center py-20">
              <i-lucide [img]="Calendar" class="w-20 h-20 text-gray-300 mx-auto mb-6"></i-lucide>
              <h2 class="text-2xl font-semibold text-gray-900 mb-2">Schedule Approval</h2>
              <p class="text-gray-500 mb-8">This feature is coming soon. You'll be able to review and approve employee work schedules here.</p>
              
              <div class="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 class="font-semibold text-blue-900 mb-2">What you'll be able to do:</h3>
                <ul class="text-left text-blue-800 space-y-2">
                  <li>• View pending schedule submissions from employees</li>
                  <li>• Review work schedules for the upcoming week</li>
                  <li>• Approve or reject schedules with comments</li>
                  <li>• Lock approved schedules for attendance tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ScheduleApprovalComponent implements OnInit {
  private authService = inject(AuthService);
  currentUser: User | null = null;

  readonly LayoutDashboard = LayoutDashboard;
  readonly Users = Users;
  readonly Building2 = Building2;
  readonly ClipboardList = ClipboardList;
  readonly FileText = FileText;
  readonly BarChart3 = BarChart3;
  readonly TrendingUp = TrendingUp;
  readonly Calendar = Calendar;

  menuItems: NavMenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, route: '/manager/dashboard' },
    { label: 'Quản lý nhân viên', icon: Users, route: '/manager/employees' },
    { label: 'Phòng ban', icon: Building2, route: '/manager/departments' },
    { label: 'Duyệt lịch', icon: ClipboardList, route: '/manager/approvals/schedules' },
    { label: 'Duyệt nghỉ phép', icon: FileText, route: '/manager/approvals/leaves' },
    { label: 'Báo cáo chấm công', icon: BarChart3, route: '/manager/reports/attendance' },
    { label: 'Báo cáo hiệu suất', icon: TrendingUp, route: '/manager/reports/productivity' }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
  }
}
