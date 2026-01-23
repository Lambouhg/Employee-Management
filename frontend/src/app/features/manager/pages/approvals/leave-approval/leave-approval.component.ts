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
  UserCheck
} from 'lucide-angular';

@Component({
  selector: 'app-leave-approval',
  standalone: true,
  imports: [CommonModule,  LucideAngularModule],
  template: `
    <div class="flex h-screen overflow-hidden">
     
      <div class="flex-1 flex flex-col bg-gray-50 overflow-auto">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-8 py-6">
          <h1 class="text-2xl font-semibold text-gray-900">Leave Request Approvals</h1>
          <p class="text-sm text-gray-500 mt-1">Review and approve employee leave requests</p>
        </div>

        <!-- Content -->
        <div class="flex-1 p-8">
          <div class="bg-white rounded-lg shadow">
            <!-- Coming Soon Message -->
            <div class="text-center py-20">
              <i-lucide [img]="UserCheck" class="w-20 h-20 text-gray-300 mx-auto mb-6"></i-lucide>
              <h2 class="text-2xl font-semibold text-gray-900 mb-2">Leave Request Approval</h2>
              <p class="text-gray-500 mb-8">This feature is coming soon. You'll be able to review and approve leave requests here.</p>
              
              <div class="max-w-2xl mx-auto bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 class="font-semibold text-purple-900 mb-2">What you'll be able to do:</h3>
                <ul class="text-left text-purple-800 space-y-2">
                  <li>• View pending leave requests from your team</li>
                  <li>• Check leave balances and history</li>
                  <li>• Approve or reject requests with reasons</li>
                  <li>• Track team availability and coverage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LeaveApprovalComponent implements OnInit {
  private authService = inject(AuthService);
  currentUser: User | null = null;

  readonly LayoutDashboard = LayoutDashboard;
  readonly Users = Users;
  readonly CheckCircle = CheckCircle;
  readonly FileText = FileText;
  readonly UserCheck = UserCheck;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
  }
}
