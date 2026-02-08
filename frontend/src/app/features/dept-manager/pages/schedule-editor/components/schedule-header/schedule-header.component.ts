import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlanStatus } from '@core/models/schedule.model';

@Component({
  selector: 'app-schedule-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <a routerLink="/dept-manager/schedules" 
               class="bg-gray-50 p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 group">
              <svg xmlns="http://www.w3.org/2000/svg" 
                   class="h-4 w-4 group-hover:-translate-x-1 transition-transform" 
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <div>
              <h1 class="text-lg font-black text-gray-900 tracking-tight">
                Schedule Management
              </h1>
              <p class="text-[10px] text-gray-500 font-semibold mt-0.5">
                📅 {{ weekStartDate | date:'dd/MM/yyyy' }} - {{ weekEndDate | date:'dd/MM/yyyy' }}
              </p>
            </div>
            <span [class]="getStatusClass()" 
                  class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
              {{ getStatusText() }}
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <!-- Publish Button -->
            <button 
              *ngIf="status === PlanStatus.DRAFT && !isPublishing" 
              (click)="onPublish()"
              [disabled]="!canPublish"
              class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2 rounded-lg shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95 font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2">
              <svg *ngIf="!isPublishing" xmlns="http://www.w3.org/2000/svg" 
                   class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {{ isPublishing ? 'Publishing...' : '📢 Publish Schedule' }}
            </button>
            
            <!-- Lock Button -->
            <button 
              *ngIf="status === PlanStatus.PUBLISHED && !isLocking" 
              (click)="onLock()"
              class="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-5 py-2 rounded-lg shadow-lg shadow-rose-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95 font-bold text-xs flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" 
                   class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {{ isLocking ? 'Locking...' : '🔒 Lock Schedule' }}
            </button>
            
            <!-- Locked State -->
            <div *ngIf="status === PlanStatus.LOCKED" 
                 class="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" 
                   class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Locked</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ScheduleHeaderComponent {
  PlanStatus = PlanStatus; // Expose enum to template
  
  @Input() status: PlanStatus | undefined;
  @Input() weekStartDate: string = '';
  @Input() weekEndDate: Date = new Date();
  @Input() canPublish: boolean = false;
  @Input() isPublishing: boolean = false;
  @Input() isLocking: boolean = false;
  
  @Output() publish = new EventEmitter<void>();
  @Output() lock = new EventEmitter<void>();

  onPublish() {
    this.publish.emit();
  }

  onLock() {
    this.lock.emit();
  }

  getStatusClass(): string {
    return 'status-' + (this.status?.toLowerCase() || 'draft');
  }

  getStatusText(): string {
    const map: Record<string, string> = {
      [PlanStatus.DRAFT]: 'Draft',
      [PlanStatus.PUBLISHED]: 'Published',
      [PlanStatus.LOCKED]: 'Locked'
    };
    return map[this.status as string] || this.status as string;
  }
}
