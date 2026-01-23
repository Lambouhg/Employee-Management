import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError, catchError, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { 
  LoginRequest, 
  LoginResponse, 
  User, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  LogoutResponse
} from '@core/models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'auth_user';
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Load user from storage on init
    const user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        this.setSession(response);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/auth/refresh`, request).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.accessToken);
      }),
      catchError(error => {
        // If refresh fails, logout user
        this.logout();
        return throwError(() => error);
      })
    );
  }

  refreshCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/me`).pipe(
      tap(user => {
        // Update user in storage and subject
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        // If getMe fails, try to refresh token
        if (error.status === 401) {
          return this.refreshToken().pipe(
            switchMap(() => this.http.get<User>(`${this.API_URL}/auth/me`)),
            tap(user => {
              localStorage.setItem(this.USER_KEY, JSON.stringify(user));
              this.currentUserSubject.next(user);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.patch<ChangePasswordResponse>(`${this.API_URL}/auth/change-password`, request);
  }

  logout(): void {
    const token = this.getToken();
    
    // If token exists, call logout API (fire and forget)
    if (token) {
      this.http.post<LogoutResponse>(`${this.API_URL}/auth/logout`, {}).subscribe({
        next: () => {
          this.clearSession();
        },
        error: () => {
          // Even if API call fails, clear local session
          this.clearSession();
        }
      });
    } else {
      // No token, just clear local session
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions?.includes(permission) ?? false;
  }

  hasRole(roleName: string): boolean {
    const user = this.getCurrentUser();
    return user?.role?.name?.toLowerCase() === roleName.toLowerCase();
  }

  hasAnyRole(roleNames: string[]): boolean {
    const user = this.getCurrentUser();
    const userRole = user?.role?.name?.toLowerCase();
    return roleNames.some(role => role.toLowerCase() === userRole);
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.accessToken);
    if (authResult.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
    }
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }
}
