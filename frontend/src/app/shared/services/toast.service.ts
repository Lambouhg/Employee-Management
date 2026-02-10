import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  private idCounter = 0;

  readonly toasts$ = this.toasts.asReadonly();

  success(message: string, duration = 3000): void {
    this.show({ type: 'success', message, duration });
  }

  error(message: string, duration = 5000): void {
    this.show({ type: 'error', message, duration });
  }

  warning(message: string, duration = 4000): void {
    this.show({ type: 'warning', message, duration });
  }

  info(message: string, duration = 3000): void {
    this.show({ type: 'info', message, duration });
  }

  private show(toast: Omit<Toast, 'id'>): void {
    const id = `toast-${++this.idCounter}`;
    const newToast: Toast = { ...toast, id };
    
    this.toasts.update(toasts => [...toasts, newToast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.remove(id), toast.duration);
    }
  }

  remove(id: string): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
