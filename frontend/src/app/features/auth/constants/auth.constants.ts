/**
 * Authentication constants for storage, rate limiting, and validation
 */

export const AUTH_CONSTANTS = {
  /**
   * LocalStorage/SessionStorage keys
   */
  STORAGE: {
    TOKEN_KEY: 'auth_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    USER_KEY: 'auth_user'
  },

  /**
   * Rate limiting configuration for login attempts
   */
  RATE_LIMITING: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
    LOCKOUT_DURATION_MINUTES: 15
  },

  /**
   * Token lifecycle configuration
   */
  TOKEN: {
    ACCESS_TOKEN_LIFETIME_SECONDS: 15 * 60, // 15 minutes
    REFRESH_TOKEN_LIFETIME_SECONDS: 7 * 24 * 60 * 60, // 7 days
    REFRESH_BUFFER_SECONDS: 5 * 60 // Refresh 5 minutes before expiry
  },

  /**
   * Password validation rules
   */
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    EMAIL_PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  }
} as const;

/**
 * Standardized error messages for authentication
 */
export const AUTH_ERROR_MESSAGES = {
  // Login errors
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  ACCOUNT_LOCKED: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
  TOO_MANY_ATTEMPTS: 'Quá nhiều lần thử không thành công',
  TOO_MANY_REQUESTS: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
  
  // Session errors
  SESSION_EXPIRED: 'Phiên đăng nhập đã hết hạn',
  UNAUTHORIZED: 'Bạn không có quyền truy cập',
  TOKEN_INVALID: 'Token không hợp lệ',
  
  // Password errors
  PASSWORD_INCORRECT: 'Mật khẩu cũ không đúng',
  PASSWORD_INVALID: 'Mật khẩu mới không hợp lệ',
  PASSWORD_MISMATCH: 'Mật khẩu xác nhận không khớp',
  
  // Generic errors
  LOGIN_FAILED: 'Đăng nhập thất bại. Vui lòng thử lại.',
  CHANGE_PASSWORD_FAILED: 'Đổi mật khẩu thất bại. Vui lòng thử lại.',
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra mạng.',
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau.'
} as const;

/**
 * Success messages for authentication actions
 */
export const AUTH_SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  PASSWORD_CHANGED: 'Đổi mật khẩu thành công',
  PASSWORD_RESET_SENT: 'Email đặt lại mật khẩu đã được gửi',
  PASSWORD_RESET_SUCCESS: 'Mật khẩu đã được đặt lại thành công'
} as const;

/**
 * Route paths for authentication
 */
export const AUTH_ROUTES_CONFIG = {
  LOGIN: '/auth/login',
  FORGOT_PASSWORD: '/auth/forgot-password',
  CHANGE_PASSWORD: '/auth/change-password',
  RESET_PASSWORD: '/auth/reset-password',
  UNAUTHORIZED: '/unauthorized',
  
  // Default routes by role
  MANAGER_DEFAULT: '/manager',
  DEPT_MANAGER_DEFAULT: '/dept-manager',
  STAFF_DEFAULT: '/staff'
} as const;
