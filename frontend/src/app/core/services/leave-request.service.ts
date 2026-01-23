import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LeaveRequest,
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
  LeaveRequestFilterDto,
  LeaveStatus
} from '@core/models/leave-request.model';

@Injectable({
  providedIn: 'root'
})
export class LeaveRequestService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/manager/leave-requests`;

  /**
   * Get all leave requests with optional filters
   */
  getLeaveRequests(filters?: LeaveRequestFilterDto): Observable<LeaveRequest[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.employeeId) params = params.set('employeeId', filters.employeeId);
      if (filters.departmentId) params = params.set('departmentId', filters.departmentId);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.leaveType) params = params.set('leaveType', filters.leaveType);
    }

    return this.http.get<LeaveRequest[]>(this.apiUrl, { params });
  }

  /**
   * Get pending leave requests (waiting for approval)
   */
  getPendingLeaveRequests(): Observable<LeaveRequest[]> {
    return this.getLeaveRequests({ status: LeaveStatus.PENDING });
  }

  /**
   * Get leave request by ID
   */
  getLeaveRequestById(id: string): Observable<LeaveRequest> {
    return this.http.get<LeaveRequest>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new leave request (usually by employee, but manager can also create)
   */
  createLeaveRequest(data: CreateLeaveRequestDto): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(this.apiUrl, data);
  }

  /**
   * Update leave request
   */
  updateLeaveRequest(id: string, data: UpdateLeaveRequestDto): Observable<LeaveRequest> {
    return this.http.patch<LeaveRequest>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Approve leave request
   */
  approveLeaveRequest(id: string, approverId: string): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(`${this.apiUrl}/${id}/approve`, { approverId });
  }

  /**
   * Reject leave request
   */
  rejectLeaveRequest(id: string, approverId: string, reason: string): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(`${this.apiUrl}/${id}/reject`, { 
      approverId,
      rejectionReason: reason 
    });
  }

  /**
   * Delete leave request
   */
  deleteLeaveRequest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get employee's leave requests
   */
  getEmployeeLeaveRequests(employeeId: string, startDate?: string, endDate?: string): Observable<LeaveRequest[]> {
    return this.getLeaveRequests({ employeeId, startDate, endDate });
  }
}
