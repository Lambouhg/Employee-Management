import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="sidebar">
        <div class="logo">
          <h2>Employee Management</h2>
        </div>
        
        <nav class="nav-menu">
          <div class="user-info">
            <div class="avatar">{{ getUserInitials() }}</div>
            <div class="user-details">
              <h3>{{ currentUser?.fullName }}</h3>
              <p>{{ currentUser?.role.displayName }}</p>
            </div>
          </div>

          <div class="menu-section">
            <a (click)="navigateTo('/dashboard')" class="menu-item active">
              <span class="icon">📊</span>
              <span>Dashboard</span>
            </a>

            @if (hasPermission('manage_all_employees')) {
              <a (click)="navigateTo('/manager/employees')" class="menu-item">
                <span class="icon">👥</span>
                <span>Quản lý nhân viên</span>
              </a>
            }

            @if (hasRole('admin')) {
              <a (click)="navigateTo('/dashboard/admin')" class="menu-item">
                <span class="icon">⚙️</span>
                <span>Quản trị hệ thống</span>
              </a>
            }
          </div>

          <button (click)="logout()" class="logout-btn">
            <span class="icon">🚪</span>
            <span>Đăng xuất</span>
          </button>
        </nav>
      </div>

      <div class="main-content">
        <div class="welcome-section">
          <h1>Chào mừng, {{ currentUser?.fullName }}!</h1>
          <p>Vai trò: <strong>{{ currentUser?.role.displayName }}</strong></p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Email</h3>
              <p>{{ currentUser?.email }}</p>
            </div>
            <div class="stat-card">
              <h3>Loại hình</h3>
              <p>{{ getEmploymentType() }}</p>
            </div>
            <div class="stat-card">
              <h3>Trạng thái</h3>
              <p [class.active]="currentUser?.isActive">
                {{ currentUser?.isActive ? 'Hoạt động' : 'Không hoạt động' }}
              </p>
            </div>
            <div class="stat-card">
              <h3>Số quyền</h3>
              <p>{{ currentUser?.permissions?.length || 0 }} quyền</p>
            </div>
          </div>

          @if (currentUser?.permissions && currentUser.permissions.length > 0) {
            <div class="permissions-section">
              <h2>Quyền hạn của bạn</h2>
              <div class="permissions-list">
                @for (permission of currentUser.permissions; track permission) {
                  <span class="permission-badge">{{ formatPermission(permission) }}</span>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      min-height: 100vh;
      max-height: 100vh;
      overflow: hidden;
    }

    .sidebar {
      width: 280px;
      min-width: 280px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .logo {
      padding: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .logo h2 {
      font-size: 20px;
      margin: 0;
    }

    .nav-menu {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 20px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: white;
      color: #667eea;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
    }

    .user-details h3 {
      margin: 0;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }

    .user-details p {
      margin: 4px 0 0;
      font-size: 13px;
      opacity: 0.9;
    }

    .menu-section {
      flex: 1;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 8px;
      text-decoration: none;
      color: white;
    }

    .menu-item:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .menu-item.active {
      background: rgba(255, 255, 255, 0.2);
    }

    .menu-item .icon {
      font-size: 20px;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      font-size: 15px;
      width: 100%;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .main-content {
      flex: 1;
      padding: 40px;
      background: #f7fafc;
      overflow-y: auto;
      max-height: 100vh;
    }

    .welcome-section h1 {
      font-size: 32px;
      color: #1a202c;
      margin-bottom: 8px;
      word-wrap: break-word;
    }

    .welcome-section > p {
      font-size: 16px;
      color: #718096;
      margin-bottom: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .stat-card h3 {
      font-size: 14px;
      color: #718096;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .stat-card p {
      word-wrap: break-word;
      overflow-wrap: break-word;
      font-size: 20px;
      font-weight: 700;
      color: #1a202c;
      margin: 0;
    }

    .stat-card p.active {
      color: #48bb78;
    }

    .permissions-section {
      background: white;
      padding: 32px;
      max-width: 100%;
      overflow: hidden;
    }

    .permissions-section h2 {
      font-size: 20px;
      color: #1a202c;
      margin-bottom: 20px;
    }

    .permissions-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
      padding: 4px;
    }

    .permission-badge {
      padding: 8px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    /* Scrollbar styling */
    .permissions-list::-webkit-scrollbar {
      width: 6px;
    }

    .permissions-list::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    .permissions-list::-webkit-scrollbar-thumb {
      background: #667eea;
      border-radius: 10px;
    }

    .sidebar::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
    }

    .sidebar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 10px;
    }

    .main-content::-webkit-scrollbar {
      width: 8px;
    }

    .main-content::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .main-content::-webkit-scrollbar-thumb {
      background: #667eea;
      border-radius: 10px0px;
      font-size: 14px;
      font-weight: 500;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  currentUser: User | null = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Fetch full user details with permissions after dashboard loads
    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe({
        next: (user) => {
          console.log('User details loaded:', user);
        },
        error: (err) => {
          console.error('Failed to load user details:', err);
        }
      });
    }
  }

  getUserInitials(): string {
    if (!this.currentUser?.fullName) return '?';
    const names = this.currentUser.fullName.split(' ');
    return names.length > 1 
      ? names[0][0] + names[names.length - 1][0]
      : names[0][0];
  }

  getEmploymentType(): string {
    return this.currentUser?.employmentType === 'FULL_TIME' ? 'Toàn thời gian' : 'Bán thời gian';
  }

  formatPermission(permission: string): string {
    return permission.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
  }
}
