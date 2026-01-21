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
  TrendingUp
} from 'lucide-angular';

@Component({
  selector: 'app-productivity-report',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex h-screen overflow-hidden">
     

      <div class="flex-1 flex flex-col bg-gray-50 overflow-auto">
        <div class="bg-white border-b border-gray-200 px-8 py-6">
          <h1 class="text-2xl font-semibold text-gray-900">Productivity Report</h1>
          <p class="text-sm text-gray-500 mt-1">Analyze team performance and productivity metrics</p>
        </div>

        <div class="flex-1 p-8">
          <div class="bg-white rounded-lg shadow">
            <div class="text-center py-20">
              <i-lucide [img]="TrendingUp" class="w-20 h-20 text-gray-300 mx-auto mb-6"></i-lucide>
              <h2 class="text-2xl font-semibold text-gray-900 mb-2">Productivity Report</h2>
              <p class="text-gray-500 mb-8">Coming soon - Track team performance metrics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductivityReportComponent implements OnInit {
  private authService = inject(AuthService);
  currentUser: User | null = null;

  readonly LayoutDashboard = LayoutDashboard;
  readonly Users = Users;
  readonly CheckCircle = CheckCircle;
  readonly FileText = FileText;
  readonly TrendingUp = TrendingUp;


  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
  }
}
