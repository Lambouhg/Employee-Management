import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [class]="getSkeletonClass()"
      [attr.aria-label]="'Loading ' + type"
      role="status"
    >
      <div class="animate-pulse">
        <!-- Text skeleton -->
        <div *ngIf="type === 'text'" class="space-y-3">
          <div *ngFor="let line of [].constructor(lines)" 
               class="h-4 bg-gray-200 rounded"
               [style.width.%]="line === lines - 1 ? 80 : 100">
          </div>
        </div>

        <!-- Card skeleton -->
        <div *ngIf="type === 'card'" class="space-y-4">
          <div class="h-48 bg-gray-200 rounded"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>

        <!-- Avatar skeleton -->
        <div *ngIf="type === 'avatar'" 
             class="rounded-full bg-gray-200"
             [style.width.px]="avatarSize"
             [style.height.px]="avatarSize">
        </div>

        <!-- Table skeleton -->
        <div *ngIf="type === 'table'" class="space-y-2">
          <div *ngFor="let row of [].constructor(rows)" 
               class="flex gap-4">
            <div *ngFor="let col of [].constructor(columns)" 
                 class="h-8 bg-gray-200 rounded flex-1">
            </div>
          </div>
        </div>

        <!-- Custom rectangle -->
        <div *ngIf="type === 'rect'" 
             class="bg-gray-200 rounded"
             [style.width.px]="width"
             [style.height.px]="height">
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() type: 'text' | 'card' | 'avatar' | 'table' | 'rect' = 'text';
  @Input() lines = 3;
  @Input() rows = 5;
  @Input() columns = 4;
  @Input() avatarSize = 48;
  @Input() width = 200;
  @Input() height = 100;
  @Input() className = '';

  getSkeletonClass(): string {
    return `w-full ${this.className}`;
  }
}
