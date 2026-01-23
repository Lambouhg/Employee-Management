import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';
import { 
  LucideAngularModule, 
  LayoutDashboard, 
  Users, 
  CheckCircle, 
  FileText,
  Clock,
  Download
} from 'lucide-angular';

@Component({
  selector: 'app-attendance-report',
  standalone: true,
  imports: [CommonModule,  LucideAngularModule],
  template: `
    <div class="flex h-screen overflow-hidden">

      <div class="flex-1 flex flex-col bg-gray-50 overflow-auto">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-semibold text-gray-900">Attendance Report</h1>
              <p class="text-sm text-gray-500 mt-1">View and export attendance data</p>
            </div>
            <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
              <i-lucide [img]="Download" class="w-4 h-4"></i-lucide>
              <span>Export Report</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 p-8">
          <div class="bg-white rounded-lg shadow">
            <!-- Coming Soon Message -->
            <div class="text-center py-20">
              <i-lucide [img]="Clock" class="w-20 h-20 text-gray-300 mx-auto mb-6"></i-lucide>
              <h2 class="text-2xl font-semibold text-gray-900 mb-2">Attendance Report</h2>
              <p class="text-gray-500 mb-8">This feature is coming soon. You'll be able to view attendance reports here.</p>
              
              <div class="max-w-2xl mx-auto bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 class="font-semibold text-green-900 mb-2">What you'll be able to do:</h3>
                <ul class="text-left text-green-800 space-y-2">
                  <li>• View attendance summary by employee and department</li>
                  <li>• Track present, absent, late arrivals, and early leaves</li>
                  <li>• Calculate total working hours and overtime</li>
                  <li>• Export reports to Excel for further analysis</li>
                  <li>• Filter by date range, department, or employee</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceReportComponent implements OnInit {
  private authService = inject(AuthService);
  currentUser: User | null = null;

  readonly LayoutDashboard = LayoutDashboard;
  readonly Users = Users;
  readonly CheckCircle = CheckCircle;
  readonly FileText = FileText;
  readonly Clock = Clock;
  readonly Download = Download;


  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
  }
}
