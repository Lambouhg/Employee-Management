import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'error' | 'success' | 'info' | 'warning';

@Component({
  selector: 'app-alert-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" 
         class="mb-4 p-4 border rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
         [ngClass]="getAlertClasses()">
      <svg xmlns="http://www.w3.org/2000/svg" 
           class="h-5 w-5 mt-0.5 flex-shrink-0" 
           [ngClass]="getIconColor()"
           fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path *ngIf="type === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path *ngIf="type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path *ngIf="type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        <path *ngIf="type === 'info'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div class="flex-1">
        <p class="font-bold text-sm" [ngClass]="getTextColor()">{{ message }}</p>
      </div>
      <button (click)="onClose()" 
              class="transition"
              [ngClass]="getCloseButtonColor()">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  `
})
export class AlertMessageComponent {
  @Input() message: string = '';
  @Input() type: AlertType = 'info';
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  getAlertClasses(): string {
    const classes = {
      'error': 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200',
      'success': 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
      'warning': 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200',
      'info': 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
    };
    return classes[this.type];
  }

  getIconColor(): string {
    const colors = {
      'error': 'text-red-600',
      'success': 'text-green-600',
      'warning': 'text-amber-600',
      'info': 'text-blue-600'
    };
    return colors[this.type];
  }

  getTextColor(): string {
    const colors = {
      'error': 'text-red-800',
      'success': 'text-green-800',
      'warning': 'text-amber-800',
      'info': 'text-blue-800'
    };
    return colors[this.type];
  }

  getCloseButtonColor(): string {
    const colors = {
      'error': 'text-red-400 hover:text-red-600',
      'success': 'text-green-400 hover:text-green-600',
      'warning': 'text-amber-400 hover:text-amber-600',
      'info': 'text-blue-400 hover:text-blue-600'
    };
    return colors[this.type];
  }
}
