import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  WorkSchedule,
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleFilterDto,
  ScheduleStatus
} from '@core/models/schedule.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/manager/schedules`;

  /**
   * Get all schedules with optional filters
   */
  getSchedules(filters?: ScheduleFilterDto): Observable<WorkSchedule[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.employeeId) params = params.set('employeeId', filters.employeeId);
      if (filters.departmentId) params = params.set('departmentId', filters.departmentId);
      if (filters.weekStartDate) params = params.set('weekStartDate', filters.weekStartDate);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }

    return this.http.get<WorkSchedule[]>(this.apiUrl, { params });
  }

  /**
   * Get pending schedules (waiting for approval)
   */
  getPendingSchedules(): Observable<WorkSchedule[]> {
    return this.getSchedules({ status: ScheduleStatus.PENDING });
  }

  /**
   * Get schedule by ID
   */
  getScheduleById(id: string): Observable<WorkSchedule> {
    return this.http.get<WorkSchedule>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new schedule with shifts
   */
  createSchedule(data: CreateScheduleDto): Observable<WorkSchedule> {
    return this.http.post<WorkSchedule>(this.apiUrl, data);
  }

  /**
   * Update schedule
   */
  updateSchedule(id: string, data: UpdateScheduleDto): Observable<WorkSchedule> {
    return this.http.patch<WorkSchedule>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Approve schedule
   */
  approveSchedule(id: string, approverId: string): Observable<WorkSchedule> {
    return this.http.post<WorkSchedule>(`${this.apiUrl}/${id}/approve`, { approverId });
  }

  /**
   * Reject schedule
   */
  rejectSchedule(id: string, reason?: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  /**
   * Lock schedule (prevent editing, ready for attendance)
   */
  lockSchedule(id: string): Observable<WorkSchedule> {
    return this.http.post<WorkSchedule>(`${this.apiUrl}/${id}/lock`, {});
  }

  /**
   * Delete schedule
   */
  deleteSchedule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get schedules by week
   */
  getSchedulesByWeek(weekStartDate: string): Observable<WorkSchedule[]> {
    return this.getSchedules({ weekStartDate });
  }

  /**
   * Get employee's schedules
   */
  getEmployeeSchedules(employeeId: string, startDate?: string, endDate?: string): Observable<WorkSchedule[]> {
    return this.getSchedules({ employeeId, startDate, endDate });
  }
}
