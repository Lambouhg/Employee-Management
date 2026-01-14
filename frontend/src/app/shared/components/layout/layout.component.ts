import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  currentUser: User | null = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe({
        next: (user) => console.log('User details loaded:', user),
        error: (err) => console.error('Failed to load user details:', err)
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

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    this.authService.logout();
  }
}
