import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (dialogService.dialogData$(); as dialog) {
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
        [@fadeIn]
        (click)="onBackdropClick()">
        
        <!-- Dialog -->
        <div 
          class="bg-white rounded-xl shadow-2xl max-w-md w-full transform"
          [@scaleIn]
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'dialog-title-' + dialog.id">
          
          <!-- Icon & Title -->
          <div class="p-6 pb-4">
            <div class="flex items-start gap-4">
              <!-- Icon -->
              <div [class]="getIconContainerClass(dialog.type)" class="flex-shrink-0 rounded-full p-3">
                @switch (dialog.type) {
                  @case ('danger') {
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  }
                  @case ('warning') {
                    <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  }
                  @default {
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  }
                }
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h3 
                  [id]="'dialog-title-' + dialog.id"
                  class="text-lg font-bold text-gray-900 mb-2">
                  {{ dialog.title }}
                </h3>
                <p class="text-sm text-gray-600 leading-relaxed">
                  {{ dialog.message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center gap-3 justify-end">
            <button
              type="button"
              (click)="onCancel()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
              {{ dialog.cancelText }}
            </button>
            <button
              type="button"
              (click)="onConfirm()"
              [class]="getConfirmButtonClass(dialog.type)"
              class="px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors">
              {{ dialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('150ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 }))
      ])
    ])
  ]
})
export class ConfirmDialogComponent {
  dialogService = inject(ConfirmDialogService);

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.onCancel();
  }

  onConfirm(): void {
    this.dialogService.respond(true);
  }

  onCancel(): void {
    this.dialogService.respond(false);
  }

  onBackdropClick(): void {
    this.onCancel();
  }

  getIconContainerClass(type: string): string {
    switch (type) {
      case 'danger':
        return 'bg-red-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'info':
        return 'bg-blue-100';
      default:
        return 'bg-blue-100';
    }
  }

  getConfirmButtonClass(type: string): string {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';
    }
  }
}
