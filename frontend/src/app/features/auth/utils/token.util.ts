import { jwtDecode } from 'jwt-decode';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * JWT Token payload interface
 */
export interface TokenPayload {
  exp: number;
  iat: number;
  userId: string;
  role: string;
  email?: string;
}

/**
 * Utility class for JWT token operations
 */
export class TokenUtil {
  /**
   * Decode a JWT token
   * 
   * @param token JWT token string
   * @returns Decoded token payload or null if invalid
   */
  static decode(token: string): TokenPayload | null {
    if (!token) {
      return null;
    }

    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if a token is expired
   * 
   * @param token JWT token string
   * @returns true if expired, false otherwise
   */
  static isExpired(token: string): boolean {
    const decoded = this.decode(token);
    if (!decoded) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  /**
   * Get remaining time in seconds before token expires
   * 
   * @param token JWT token string
   * @returns Remaining seconds (0 if expired or invalid)
   */
  static getRemainingTime(token: string): number {
    const decoded = this.decode(token);
    if (!decoded) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - currentTime);
  }

  /**
   * Check if token needs refresh (within refresh buffer time)
   * Default buffer is 5 minutes before expiration
   * 
   * @param token JWT token string
   * @param bufferSeconds Buffer time in seconds (default: 5 minutes)
   * @returns true if token should be refreshed
   */
  static needsRefresh(token: string, bufferSeconds: number = AUTH_CONSTANTS.TOKEN.REFRESH_BUFFER_SECONDS): boolean {
    const remaining = this.getRemainingTime(token);
    return remaining > 0 && remaining < bufferSeconds;
  }

  /**
   * Extract user ID from token
   * 
   * @param token JWT token string
   * @returns User ID or null if not found
   */
  static getUserId(token: string): string | null {
    const decoded = this.decode(token);
    return decoded?.userId ?? null;
  }

  /**
   * Extract role from token
   * 
   * @param token JWT token string
   * @returns Role name or null if not found
   */
  static getRole(token: string): string | null {
    const decoded = this.decode(token);
    return decoded?.role ?? null;
  }

  /**
   * Extract email from token
   * 
   * @param token JWT token string
   * @returns Email or null if not found
   */
  static getEmail(token: string): string | null {
    const decoded = this.decode(token);
    return decoded?.email ?? null;
  }

  /**
   * Validate token format (basic check)
   * 
   * @param token JWT token string
   * @returns true if token has valid JWT format
   */
  static isValidFormat(token: string): boolean {
    if (!token) {
      return false;
    }

    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Get token expiration date
   * 
   * @param token JWT token string
   * @returns Date object or null if invalid
   */
  static getExpirationDate(token: string): Date | null {
    const decoded = this.decode(token);
    if (!decoded) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  }

  /**
   * Get token issued date
   * 
   * @param token JWT token string
   * @returns Date object or null if invalid
   */
  static getIssuedDate(token: string): Date | null {
    const decoded = this.decode(token);
    if (!decoded) {
      return null;
    }

    return new Date(decoded.iat * 1000);
  }

  /**
   * Check if token is valid (format + not expired)
   * 
   * @param token JWT token string
   * @returns true if valid and not expired
   */
  static isValid(token: string): boolean {
    return this.isValidFormat(token) && !this.isExpired(token);
  }
}
