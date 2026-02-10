import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@shared/services/toast.service';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div 
          [@toastAnimation]="'in'"
          [class]="getToastClasses(toast.type)"
          class="pointer-events-auto min-w-[300px] max-w-md rounded-lg shadow-lg p-4 flex items-start gap-3 backdrop-blur-sm">
          
          <!-- Icon -->
          <div class="flex-shrink-0 mt-0.5">
            @switch (toast.type) {
              @case ('success') {
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              }
              @case ('error') {
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              }
              @case ('info') {
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            }
          </div>

          <!-- Message -->
          <div class="flex-1 text-sm font-medium text-gray-900">
            {{ toast.message }}
          </div>

          <!-- Close Button -->
          <button 
            (click)="toastService.remove(toast.id)"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getToastClasses(type: string): string {
    const baseClasses = 'border-l-4';
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-500`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-500`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-500`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-500`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-500`;
    }
  }
}
