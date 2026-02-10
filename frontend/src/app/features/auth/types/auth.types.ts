/**
 * Employment type enum
 */
export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME'
}

/**
 * Role name enum for type-safe role checking
 */
export enum RoleName {
  MANAGER = 'MANAGER',
  DEPT_MANAGER = 'DEPT_MANAGER',
  STAFF = 'STAFF'
}

/**
 * Authentication status enum
 */
export enum AuthStatus {
  AUTHENTICATED = 'AUTHENTICATED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  LOADING = 'LOADING',
  ERROR = 'ERROR'
}

/**
 * Token type enum
 */
export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH'
}

/**
 * HTTP status codes for auth errors
 */
export enum AuthErrorCode {
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  TOO_MANY_REQUESTS = 429,
  LOCKED = 423,
  BAD_REQUEST = 400,
  SERVER_ERROR = 500
}

/**
 * Auth action types for audit logging
 */
export enum AuthActionType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS'
}
