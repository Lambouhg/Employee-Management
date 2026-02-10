// Core Models Barrel Export

// Auth models - User và các types liên quan
export type { 
  User, 
  UserBasic, 
  LoginRequest, 
  LoginResponse,
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
  UpdateProfileResponse,
  AuthState
} from './auth.model';

// Department models - Priority export (overrides auth.model definitions)
export * from './department.model';

// Role models - Priority export (overrides auth.model definitions)  
export * from './role.model';

// Employee models
export * from './employee.model';

// Attendance models
export * from './attendance.model';

// Leave request models
export * from './leave-request.model';

// Schedule models (includes ShiftType - this will be the primary)
export * from './schedule.model';

// Dashboard models
export * from './dashboard.model';

// Shift template models
export * from './shift-template.model';

// Pagination models
export * from './pagination.model';

// Common models
export * from './common.model';
