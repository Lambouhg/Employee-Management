import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Shift, ShiftType } from '@core/models/schedule.model';

export interface AssignShiftDto {
    employeeId: string;
    openingId: string;
    date: string;
    shiftType: ShiftType;
    notes?: string;
}

export interface BulkAssignShiftDto {
    shifts: AssignShiftDto[];
}

export interface BulkAssignResult {
    success: Array<{
        employeeId: string;
        date: string;
        shiftType: ShiftType;
        shift: Shift;
    }>;
    failed: Array<{
        employeeId: string;
        date: string;
        shiftType: ShiftType;
        error: string;
    }>;
}

@Injectable({
    providedIn: 'root'
})
export class DeptManagerShiftsService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl;

    /**
     * Gán ca cho một nhân viên
     */
    assignShift(planId: string, dto: AssignShiftDto): Observable<Shift> {
        return this.http.post<Shift>(
            `${this.baseUrl}/dept-manager/plans/${planId}/shifts`,
            dto
        );
    }

    /**
     * Gán nhiều ca cùng lúc (bulk assign)
     */
    bulkAssignShifts(planId: string, dto: BulkAssignShiftDto): Observable<BulkAssignResult> {
        return this.http.post<BulkAssignResult>(
            `${this.baseUrl}/dept-manager/plans/${planId}/shifts/bulk`,
            dto
        );
    }

    /**
     * Lấy danh sách ca đã gán trong plan
     */
    getAssignedShifts(planId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/dept-manager/plans/${planId}/shifts`
        );
    }

    /**
     * Xóa ca đã gán (unassign)
     */
    unassignShift(planId: string, shiftId: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(
            `${this.baseUrl}/dept-manager/plans/${planId}/shifts/${shiftId}`
        );
    }
}
