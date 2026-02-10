import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiError } from '@core/models/common.model';

export interface ErrorMessage {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errorsSubject = new BehaviorSubject<ErrorMessage[]>([]);
  public errors$ = this.errorsSubject.asObservable();

  /**
   * Handle API errors and convert to user-friendly messages
   */
  handleError(error: any, context?: string): ErrorMessage {
    const errorMessage = this.createErrorMessage(error, context);
    this.addError(errorMessage);
    return errorMessage;
  }

  /**
   * Create error message from various error types
   */
  private createErrorMessage(error: any, context?: string): ErrorMessage {
    let message = 'An unexpected error occurred';
    let details = null;

    if (error?.error?.message) {
      message = error.error.message;
      details = error.error.details;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    if (context) {
      message = `${context}: ${message}`;
    }

    return {
      id: this.generateId(),
      message,
      type: 'error',
      timestamp: new Date(),
      details
    };
  }

  /**
   * Add error to the list
   */
  private addError(error: ErrorMessage): void {
    const currentErrors = this.errorsSubject.value;
    this.errorsSubject.next([...currentErrors, error]);
  }

  /**
   * Remove error by ID
   */
  removeError(id: string): void {
    const currentErrors = this.errorsSubject.value;
    this.errorsSubject.next(currentErrors.filter(e => e.id !== id));
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errorsSubject.next([]);
  }

  /**
   * Get user-friendly HTTP error message
   */
  getHttpErrorMessage(status: number): string {
    const messages: { [key: number]: string } = {
      400: 'Invalid request. Please check your input.',
      401: 'You are not authorized. Please login again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'A conflict occurred. The resource may already exist.',
      422: 'Unable to process your request. Please check your input.',
      500: 'Server error. Please try again later.',
      503: 'Service temporarily unavailable. Please try again later.'
    };

    return messages[status] || 'An unexpected error occurred';
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
