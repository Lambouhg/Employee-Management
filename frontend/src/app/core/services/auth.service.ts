import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError, catchError, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { TokenUtil } from '@features/auth/utils/token.util';
import { AUTH_CONSTANTS, AUTH_ROUTES_CONFIG } from '@features/auth/constants/auth.constants';
import { 
  LoginRequest, 
  LoginResponse, 
  User, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  LogoutResponse,
  UpdateProfileRequest,
  UpdateProfileResponse
} from '@core/models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = AUTH_CONSTANTS.STORAGE.TOKEN_KEY;
  private readonly REFRESH_TOKEN_KEY = AUTH_CONSTANTS.STORAGE.REFRESH_TOKEN_KEY;
  private readonly USER_KEY = AUTH_CONSTANTS.STORAGE.USER_KEY;
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
        // Setup auto-refresh if token has enough lifetime
        this.setupTokenRefresh(response.accessToken);
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
        console.error('Error refreshing user:', error);
        return throwError(() => error);
      })
    );
  }

  updateProfile(data: UpdateProfileRequest): Observable<UpdateProfileResponse> {
    return this.http.patch<UpdateProfileResponse>(`${this.API_URL}/auth/profile`, data).pipe(
      tap(user => {
        // Update user in storage and subject
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.patch<ChangePasswordResponse>(`${this.API_URL}/auth/change-password`, request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.API_URL}/auth/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.API_URL}/auth/reset-password`, request);
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
    this.router.navigate([AUTH_ROUTES_CONFIG.LOGIN]);
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
    const token = this.getToken();
    if (!token) return false;
    
    // Use TokenUtil for validation
    if (!TokenUtil.isValid(token)) {
      this.clearSession();
      return false;
    }
    
    return true;
  }

  /**
   * Setup automatic token refresh before expiration
   * @private
   */
  private setupTokenRefresh(token: string): void {
    const remainingTime = TokenUtil.getRemainingTime(token);
    const refreshBuffer = AUTH_CONSTANTS.TOKEN.REFRESH_BUFFER_SECONDS;
    
    if (remainingTime > refreshBuffer) {
      const timeout = (remainingTime - refreshBuffer) * 1000;
      setTimeout(() => {
        this.refreshToken().subscribe();
      }, timeout);
    }
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
