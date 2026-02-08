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
            'MORNING': 'Ca sáng',
            'AFTERNOON': 'Ca chiều',
            'EVENING': 'Ca tối',
            'NIGHT': 'Ca đêm'
        };
        return names[type] || type;
    }

    /**
     * Get status name
     */
    getStatusName(status: string): string {
        const names: Record<string, string> = {
            'PENDING': 'Chờ duyệt',
            'APPROVED': 'Đã duyệt',
            'LOCKED': 'Đã khóa',
            'REJECTED': 'Bị từ chối'
        };
        return names[status] || status;
    }

    /**
     * Get status class
     */
    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            'PENDING': 'badge-warning',
            'APPROVED': 'badge-success',
            'LOCKED': 'badge-info',
            'REJECTED': 'badge-danger'
        };
        return classes[status] || 'badge-secondary';
    }

    /**
     * Format date
     */
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    /**
     * Format time
     */
    formatTime(timeString: string): string {
        const date = new Date(timeString);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get week range
     */
    getWeekRange(weekStartDate: string): string {
        const start = new Date(weekStartDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        return `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`;
    }
}
