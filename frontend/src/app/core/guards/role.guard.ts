import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[];
  const requiredPermissions = route.data['permissions'] as string[];

  // Check roles (case-insensitive for flexibility)
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = authService.getCurrentUser()?.role?.name?.toUpperCase();
    const hasRole = requiredRoles.some(role => role.toUpperCase() === userRole);
    
    if (!hasRole) {
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  // Check permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission => 
      authService.hasPermission(permission)
    );
    
    if (!hasPermission) {
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  return true;
};
