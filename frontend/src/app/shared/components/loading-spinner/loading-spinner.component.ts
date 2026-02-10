import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2 } from 'lucide-angular';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div [class]="getContainerClass()" [attr.aria-label]="message || 'Loading...'">
      <!-- Spinner -->
      <div class="inline-flex items-center justify-center">
        <lucide-icon 
          [img]="Loader2Icon" 
          [size]="getIconSize()"
          class="animate-spin"
          [class]="color"
        ></lucide-icon>
      </div>
      
      <!-- Message -->
      <p *ngIf="message" [class]="getMessageClass()">
        {{ message }}
      </p>
    </div>
  `,
  styles: [`
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() message?: string;
  @Input() overlay = false;
  @Input() fullScreen = false;
  @Input() color = 'text-blue-600';

  readonly Loader2Icon = Loader2;

  getContainerClass(): string {
    const baseClasses = 'flex flex-col items-center justify-center gap-3';
    
    if (this.fullScreen) {
      return `${baseClasses} fixed inset-0 bg-white/80 backdrop-blur-sm z-50`;
    }
    
    if (this.overlay) {
      return `${baseClasses} absolute inset-0 bg-white/80 backdrop-blur-sm z-10`;
    }
    
    return baseClasses;
  }

  getIconSize(): number {
    const sizes = {
      sm: 16,
      md: 24,
      lg: 32,
      xl: 48
    };
    return sizes[this.size] || sizes.md;
  }

  getMessageClass(): string {
    const sizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg'
    };
    return `${sizes[this.size] || sizes.md} ${this.color} font-medium`;
  }
}
