import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';
import {
  LucideAngularModule,
  Settings,
  LogOut,
  ChevronDown,
  HelpCircle,
  PanelLeft
} from 'lucide-angular';

export interface NavMenuItem {
  label: string;
  icon: any;
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

  // Collapse state
  isCollapsed = false;

  // Lucide icons
  readonly Settings = Settings;
  readonly HelpCircle = HelpCircle;
  readonly ChevronDown = ChevronDown;
  readonly PanelLeft = PanelLeft;
  readonly LogOut = LogOut;

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.activeRoute === route || this.router.url === route;
  }

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
    return (
      this.hasPermission(item.requiredPermission) &&
      this.hasRole(item.requiredRole)
    );
  }

  logout(): void {
    this.authService.logout();
  }
}
