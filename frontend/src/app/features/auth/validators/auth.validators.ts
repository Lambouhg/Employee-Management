import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Custom validators for authentication forms
 */
export class AuthValidators {
  /**
   * Validates password strength
   * Requirements:
   * - At least 8 characters
   * - Contains at least one uppercase letter
   * - Contains at least one lowercase letter
   * - Contains at least one number
   * 
   * @returns Validator function
   */
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Let required validator handle empty values
      }

      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const isLongEnough = value.length >= AUTH_CONSTANTS.VALIDATION.MIN_PASSWORD_LENGTH;

      const passwordValid = hasUpperCase && hasLowerCase && hasNumber && isLongEnough;

      if (!passwordValid) {
        return {
          strongPassword: {
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            isLongEnough,
            minLength: AUTH_CONSTANTS.VALIDATION.MIN_PASSWORD_LENGTH
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates that password and confirm password fields match
   * Use this as a form-level validator, not field-level
   * 
   * @param passwordField Name of password field (default: 'newPassword')
   * @param confirmField Name of confirm password field (default: 'confirmPassword')
   * @returns Validator function
   */
  static passwordMatch(
    passwordField: string = 'newPassword',
    confirmField: string = 'confirmPassword'
  ): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get(passwordField)?.value;
      const confirm = formGroup.get(confirmField)?.value;

      // Only validate if both fields have values
      if (!password || !confirm) {
        return null;
      }

      return password === confirm ? null : { passwordMismatch: true };
    };
  }

  /**
   * Enhanced email validator with additional checks
   * Validates:
   * - Standard email format
   * - Valid TLD (at least 2 characters)
   * - No consecutive dots
   * 
   * @returns Validator function
   */
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Let required validator handle empty values
      }

      // Check basic pattern
      const isValid = AUTH_CONSTANTS.VALIDATION.EMAIL_PATTERN.test(value);
      
      // Check for consecutive dots
      const hasConsecutiveDots = /\.\./.test(value);
      
      if (!isValid || hasConsecutiveDots) {
        return { email: true };
      }

      return null;
    };
  }

  /**
   * Validates that old password is different from new password
   * 
   * @param oldPasswordField Name of old password field (default: 'oldPassword')
   * @param newPasswordField Name of new password field (default: 'newPassword')
   * @returns Validator function
   */
  static passwordDifferent(
    oldPasswordField: string = 'oldPassword',
    newPasswordField: string = 'newPassword'
  ): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const oldPassword = formGroup.get(oldPasswordField)?.value;
      const newPassword = formGroup.get(newPasswordField)?.value;

      // Only validate if both fields have values
      if (!oldPassword || !newPassword) {
        return null;
      }

      return oldPassword !== newPassword ? null : { passwordSame: true };
    };
  }

  /**
   * Validates minimum length
   * 
   * @param minLength Minimum length required
   * @returns Validator function
   */
  static minLength(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }

      return value.length >= minLength ? null : {
        minLength: {
          requiredLength: minLength,
          actualLength: value.length
        }
      };
    };
  }
}
