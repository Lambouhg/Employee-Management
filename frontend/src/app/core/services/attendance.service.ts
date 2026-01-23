import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Attendance,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  AttendanceFilterDto,
  AttendanceReport
} from '@core/models/attendance.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/manager/attendances`;

  /**
   * Get all attendances with optional filters
   */
  getAttendances(filters?: AttendanceFilterDto): Observable<Attendance[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.employeeId) params = params.set('employeeId', filters.employeeId);
      if (filters.departmentId) params = params.set('departmentId', filters.departmentId);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.status) params = params.set('status', filters.status);
    }

    return this.http.get<Attendance[]>(this.apiUrl, { params });
  }

  /**
   * Get attendance by ID
   */
  getAttendanceById(id: string): Observable<Attendance> {
    return this.http.get<Attendance>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create attendance record
   */
  createAttendance(data: CreateAttendanceDto): Observable<Attendance> {
    return this.http.post<Attendance>(this.apiUrl, data);
  }

  /**
   * Update attendance record
   */
  updateAttendance(id: string, data: UpdateAttendanceDto): Observable<Attendance> {
    return this.http.patch<Attendance>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete attendance record
   */
  deleteAttendance(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get attendance report
   */
  getAttendanceReport(filters?: AttendanceFilterDto): Observable<AttendanceReport[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.employeeId) params = params.set('employeeId', filters.employeeId);
      if (filters.departmentId) params = params.set('departmentId', filters.departmentId);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.status) params = params.set('status', filters.status);
    }

    return this.http.get<AttendanceReport[]>(`${this.apiUrl}/report`, { params });
  }

  /**
   * Get employee's attendance records
   */
  getEmployeeAttendances(employeeId: string, startDate?: string, endDate?: string): Observable<Attendance[]> {
    return this.getAttendances({ employeeId, startDate, endDate });
  }

  /**
   * Check in
   */
  checkIn(shiftId: string): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.apiUrl}/check-in`, { shiftId });
  }

  /**
   * Check out
   */
  checkOut(attendanceId: string): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.apiUrl}/${attendanceId}/check-out`, {});
  }
}
