import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    DeptLeaveRequest,
    DeptLeaveRequestDetail,
    DeptLeavesListResponse,
    DeptLeaveStatsResponse,
    ApproveLeaveRequest,
    GetDeptLeavesQuery
} from '../models/leave.model';

@Injectable({
    providedIn: 'root'
})
export class DeptManagerLeavesService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/dept-manager/leaves`;

    /**
     * Get list of leave requests for department
     */
    getLeaveRequests(query?: GetDeptLeavesQuery): Observable<DeptLeavesListResponse> {
        let params = new HttpParams();
        
        if (query) {
            if (query.status) params = params.set('status', query.status);
            if (query.startDate) params = params.set('startDate', query.startDate);
            if (query.endDate) params = params.set('endDate', query.endDate);
            if (query.page) params = params.set('page', query.page.toString());
            if (query.limit) params = params.set('limit', query.limit.toString());
        }

        return this.http.get<DeptLeavesListResponse>(this.API_URL, { params });
    }

    /**
     * Get leave statistics
     */
    getLeaveStats(): Observable<DeptLeaveStatsResponse> {
        return this.http.get<DeptLeaveStatsResponse>(`${this.API_URL}/stats`);
    }

    /**
     * Get leave request detail with conflicting shifts
     */
    getLeaveRequestById(id: string): Observable<DeptLeaveRequestDetail> {
        return this.http.get<DeptLeaveRequestDetail>(`${this.API_URL}/${id}`);
    }

    /**
     * Approve or reject leave request
     */
    approveOrReject(id: string, data: ApproveLeaveRequest): Observable<DeptLeaveRequest> {
        return this.http.patch<DeptLeaveRequest>(`${this.API_URL}/${id}/approve`, data);
    }
}
