import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, AlertCircle, AlertTriangle, Info } from 'lucide-angular';

export type ErrorType = 'error' | 'warning' | 'info' | 'success';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div 
      *ngIf="message" 
      [class]="getContainerClass()"
      [ngClass]="compact ? 'p-2 mb-2' : 'p-4 mb-4'"
      class="rounded-lg flex items-start gap-2 animate-fadeIn"
      role="alert"
    >
      <!-- Icon -->
      <div [class]="getIconClass()">
        <lucide-icon 
          *ngIf="type === 'error'" 
          [img]="AlertCircle" 
          [size]="compact ? 16 : 20"
        ></lucide-icon>
        <lucide-icon 
          *ngIf="type === 'warning'" 
          [img]="AlertTriangle" 
          [size]="compact ? 16 : 20"
        ></lucide-icon>
        <lucide-icon 
          *ngIf="type === 'info' || type === 'success'" 
          [img]="Info" 
          [size]="compact ? 16 : 20"
        ></lucide-icon>
      </div>

      <!-- Content -->
      <div class="flex-1">
        <h4 *ngIf="title && !compact" class="font-semibold mb-1">{{ title }}</h4>
        <p [ngClass]="compact ? 'text-xs' : 'text-sm'">{{ message }}</p>
        <div *ngIf="details && !compact" class="mt-2 text-xs opacity-75">
          <details>
            <summary class="cursor-pointer hover:underline">Show details</summary>
            <pre class="mt-2 p-2 bg-black/10 rounded overflow-auto">{{ details | json }}</pre>
          </details>
        </div>
      </div>

      <!-- Close button -->
      <button 
        *ngIf="dismissible && !compact"
        type="button"
        (click)="onDismiss()"
        class="text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Close"
      >
        <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
      </button>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
  `]
})
export class ErrorMessageComponent {
  @Input() type: ErrorType = 'error';
  @Input() title?: string;
  @Input() message?: string;
  @Input() details?: any;
  @Input() dismissible = true;
  @Input() compact = false;
  @Output() dismiss = new EventEmitter<void>();

  readonly AlertCircle = AlertCircle;
  readonly AlertTriangle = AlertTriangle;
  readonly Info = Info;
  readonly XIcon = X;

  getContainerClass(): string {
    const baseClasses = 'border';
    const typeClasses = {
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      success: 'bg-green-50 border-green-200 text-green-800'
    };
    return `${baseClasses} ${typeClasses[this.type] || typeClasses.error}`;
  }

  getIconClass(): string {
    const typeClasses = {
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600',
      success: 'text-green-600'
    };
    return typeClasses[this.type] || typeClasses.error;
  }

  onDismiss(): void {
    this.dismiss.emit();
  }
}
