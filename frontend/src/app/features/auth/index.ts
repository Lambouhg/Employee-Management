/**
 * Auth Feature Barrel Export
 * Centralizes all auth-related exports for clean imports
 */

// Routes
export * from './auth.routes';

// Constants
export * from './constants/auth.constants';

// Validators
export * from './validators/auth.validators';

// Utils
export * from './utils/token.util';

// Types
export * from './types/auth.types';

// Components (lazy-loaded, but can be imported for testing)
export { LoginComponent } from './pages/login/login.component';
export { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
export { ChangePasswordComponent } from './pages/change-password/change-password.component';
export { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
