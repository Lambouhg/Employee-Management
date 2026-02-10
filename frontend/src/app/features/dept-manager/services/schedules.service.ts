import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DeptWeeklyPlan, PlanStatus, ShiftOpening } from '@core/models/schedule.model';

export interface CreateScheduleDto {
    weekStartDate: string;
    notes?: string;
}

export interface UpdateScheduleStatusDto {
    status: 'PUBLISHED' | 'LOCKED';
}

export interface CreateShiftDto {
    date: string;
    shiftType: string; // 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'
    startTime: string;
    endTime: string;
    // Part-time settings
    isPTEnabled: boolean;
    ptCapacity: number;
    // Full-time settings
    isFTEnabled: boolean;
    notes?: string;
}

export interface UpdateShiftDto {
    date?: string;
    shiftType?: string; // 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'
    startTime?: string;
    endTime?: string;
    // Part-time settings
    isPTEnabled?: boolean;
    ptCapacity?: number;
    // Full-time settings
    isFTEnabled?: boolean;
    notes?: string;
}

@Injectable({
    providedIn: 'root'
})
export class DeptManagerSchedulesService {
    private http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/dept-manager/schedules`;

    /**
     * Lấy danh sách schedules của phòng ban
     * Query params: weekStartDate, status
     */
    getSchedules(params: any = {}): Observable<DeptWeeklyPlan[]> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                httpParams = httpParams.set(key, params[key]);
            }
        });
        return this.http.get<DeptWeeklyPlan[]>(this.baseUrl, { params: httpParams });
    }

    /**
     * Lấy chi tiết một schedule
     */
    getScheduleById(id: string): Observable<DeptWeeklyPlan> {
        return this.http.get<DeptWeeklyPlan>(`${this.baseUrl}/${id}`);
    }

    /**
     * Tạo schedule mới (status = DRAFT)
     */
    createSchedule(dto: CreateScheduleDto): Observable<DeptWeeklyPlan> {
        return this.http.post<DeptWeeklyPlan>(this.baseUrl, dto);
    }

    /**
     * Chuyển trạng thái schedule
     * - DRAFT -> PUBLISHED (công bố lịch)
     * - PUBLISHED -> LOCKED (chốt lịch)
     */
    updateScheduleStatus(id: string, dto: UpdateScheduleStatusDto): Observable<DeptWeeklyPlan> {
        return this.http.patch<DeptWeeklyPlan>(`${this.baseUrl}/${id}/status`, dto);
    }

    /**
     * Xóa schedule (chỉ khi DRAFT và chưa có shift)
     */
    deleteSchedule(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    /**
     * Tạo shift trong schedule
     */
    createShift(scheduleId: string, dto: CreateShiftDto): Observable<ShiftOpening> {
        return this.http.post<ShiftOpening>(`${this.baseUrl}/${scheduleId}/shifts`, dto);
    }

    /**
     * Cập nhật shift
     */
    updateShift(scheduleId: string, shiftId: string, dto: UpdateShiftDto): Observable<ShiftOpening> {
        return this.http.patch<ShiftOpening>(`${this.baseUrl}/${scheduleId}/shifts/${shiftId}`, dto);
    }

    /**
     * Xóa shift
     */
    deleteShift(scheduleId: string, shiftId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${scheduleId}/shifts/${shiftId}`);
    }
}
