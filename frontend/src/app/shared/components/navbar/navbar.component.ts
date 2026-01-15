import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';
import { LucideAngularModule, LayoutDashboard, Users, Settings, LogOut, ChevronRight, ChevronDown, HelpCircle } from 'lucide-angular';

export interface NavMenuItem {
  label: string;
  icon: any; // Lucide icon component
  route: string;
  requiredPermission?: string;
  requiredRole?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Input() currentUser: User | null = null;
  @Input() menuItems: NavMenuItem[] = [];
  @Input() activeRoute: string = '';

  // Lucide icons
  readonly LogOut = LogOut;
  readonly Settings = Settings;
  readonly HelpCircle = HelpCircle;
  readonly ChevronDown = ChevronDown;

 

  getUserInitials(): string {
    if (!this.currentUser?.fullName) return '?';
    const names = this.currentUser.fullName.split(' ');
    return names.length > 1 
      ? names[0][0] + names[names.length - 1][0]
      : names[0][0];
  }

  hasPermission(permission?: string): boolean {
    if (!permission) return true;
    return this.authService.hasPermission(permission);
  }

  hasRole(role?: string): boolean {
    if (!role) return true;
    return this.authService.hasRole(role);
  }

  shouldShowMenuItem(item: NavMenuItem): boolean {
    const hasPermission = this.hasPermission(item.requiredPermission);
    const hasRole = this.hasRole(item.requiredRole);
    return hasPermission && hasRole;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.activeRoute === route || this.router.url === route;
  }

  logout(): void {
    this.authService.logout();
  }
}
