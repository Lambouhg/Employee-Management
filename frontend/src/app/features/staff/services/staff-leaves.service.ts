import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Interfaces for staff leave requests
export interface LeaveBalance {
    totalAnnualLeave: number;
    usedLeave: number;
    remainingLeave: number;
    pendingLeave: number;
}

export interface StaffLeaveRequest {
    id: string;
    employeeId: string;
    leaveType: 'SICK' | 'EMERGENCY' | 'PERSONAL' | 'OTHER';
    startDate: string;
    endDate: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedById: string | null;
    approvedBy: {
        id: string;
        fullName: string;
        email: string;
    } | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
    dayCount: number;
}

export interface LeaveRequestList {
    data: StaffLeaveRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateLeaveRequest {
    leaveType: 'SICK' | 'EMERGENCY' | 'PERSONAL' | 'OTHER';
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    reason: string;
}

export interface UpdateLeaveRequest {
    leaveType?: 'SICK' | 'EMERGENCY' | 'PERSONAL' | 'OTHER';
    startDate?: string;
    endDate?: string;
    reason?: string;
}

export interface GetLeaveParams {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

@Injectable({
    providedIn: 'root'
})
export class StaffLeavesService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/staff/leaves`;

    /**
     * Create new leave request
     */
    createLeaveRequest(request: CreateLeaveRequest): Observable<StaffLeaveRequest> {
        return this.http.post<StaffLeaveRequest>(this.apiUrl, request);
    }

    /**
     * Get list of leave requests
     */
    getMyLeaveRequests(params?: GetLeaveParams): Observable<LeaveRequestList> {
        let httpParams = new HttpParams();

        if (params) {
            if (params.status) httpParams = httpParams.set('status', params.status);
            if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
            if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
            if (params.page) httpParams = httpParams.set('page', params.page.toString());
            if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        }

        return this.http.get<LeaveRequestList>(this.apiUrl, { params: httpParams });
    }

    /**
     * Get leave balance
     */
    getLeaveBalance(): Observable<LeaveBalance> {
        return this.http.get<LeaveBalance>(`${this.apiUrl}/balance`);
    }

    /**
     * Lấy chi tiết một yêu cầu
     */
    getLeaveRequestById(id: string): Observable<StaffLeaveRequest> {
        return this.http.get<StaffLeaveRequest>(`${this.apiUrl}/${id}`);
    }

    /**
     * Cập nhật yêu cầu nghỉ phép
     */
    updateLeaveRequest(id: string, request: UpdateLeaveRequest): Observable<StaffLeaveRequest> {
        return this.http.put<StaffLeaveRequest>(`${this.apiUrl}/${id}`, request);
    }

    /**
     * Xóa/Hủy yêu cầu nghỉ phép
     */
    deleteLeaveRequest(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }
}
