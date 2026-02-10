import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface MySchedule {
    id: string;
    weekStartDate: string;
    status: string;
    shifts: Array<{
        id: string;
        date: string;
        shiftType: string;
        startTime: string;
        endTime: string;
        notes?: string;
    }>;
}

@Component({
    selector: 'app-my-schedule',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './my-schedule.component.html',
    styleUrl: './my-schedule.component.css'
})
export class MyScheduleComponent implements OnInit {
    private http = inject(HttpClient);

    schedules = signal<MySchedule[]>([]);
    loading = signal(false);
    currentWeek = new Date();

    ngOnInit() {
        this.loadSchedules();
    }

    /**
     * Load schedules
     */
    loadSchedules() {
        this.loading.set(true);
        this.http.get<MySchedule[]>(`${environment.apiUrl}/staff/schedules/my-schedules`).subscribe({
            next: (data) => {
                this.schedules.set(data);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading schedules:', error);
                this.loading.set(false);
            }
        });
    }

    /**
     * Get shift type name
     */
    getShiftTypeName(type: string): string {
        const names: Record<string, string> = {
            'MORNING': 'Morning',
            'AFTERNOON': 'Afternoon',
            'EVENING': 'Evening',
            'NIGHT': 'Night'
        };
        return names[type] || type;
    }

    /**
     * Get status name
     */
    getStatusName(status: string): string {
        const names: Record<string, string> = {
            'PENDING': 'Pending',
            'APPROVED': 'Approved',
            'LOCKED': 'Locked',
            'REJECTED': 'Rejected'
        };
        return names[status] || status;
    }

    /**
     * Get status badge class for Tailwind CSS
     */
    getStatusBadgeClass(status: string): string {
        const classes: Record<string, string> = {
            'PENDING': 'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800',
            'APPROVED': 'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800',
            'LOCKED': 'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800',
            'REJECTED': 'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800'
        };
        return classes[status] || 'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800';
    }

    /**
     * Format date
     */
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    }

    /**
     * Format time
     */
    formatTime(timeString: string): string {
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Get week range
     */
    getWeekRange(weekStartDate: string): string {
        const start = new Date(weekStartDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        return `${start.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
    }

    /**
     * Check if date is today
     */
    isToday(dateString: string): boolean {
        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    /**
     * Get total shifts count across all schedules
     */
    getTotalShiftsCount(): number {
        return this.schedules().reduce((total, schedule) => total + schedule.shifts.length, 0);
    }

    /**
     * Get upcoming shifts count (future dates only)
     */
    getUpcomingShiftsCount(): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.schedules().reduce((count, schedule) => {
            const futureShifts = schedule.shifts.filter(shift => {
                const shiftDate = new Date(shift.date);
                shiftDate.setHours(0, 0, 0, 0);
                return shiftDate >= today;
            });
            return count + futureShifts.length;
        }, 0);
    }

    /**
     * Calculate shift duration in hours
     */
    calculateDuration(startTime: string, endTime: string): number {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end.getTime() - start.getTime();
        const hours = diffMs / (1000 * 60 * 60);
        return Math.round(hours * 10) / 10; // Round to 1 decimal
    }

    /**
     * Get shift type color classes
     */
    getShiftTypeColor(type: string): string {
        const colors: Record<string, string> = {
            'MORNING': 'bg-amber-100 text-amber-800',
            'AFTERNOON': 'bg-orange-100 text-orange-800',
            'EVENING': 'bg-indigo-100 text-indigo-800',
            'NIGHT': 'bg-purple-100 text-purple-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    }

}
