import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ShiftRegistration,
  GetRegistrationsQuery,
  ReviewRegistrationDto,
  PaginatedRegistrationsResponse,
  RegistrationStats
} from '../models/shift-registration.model';

/**
 * Service để quản lý shift registration approvals
 * Thiết kế theo pattern có thể tái sử dụng cho leaves và attendance
 */
@Injectable({
  providedIn: 'root'
})
export class ShiftRegistrationsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dept-manager/shift-registrations`;

  /**
   * Lấy danh sách shift registrations cần duyệt
   * Mặc định lấy PENDING, có thể filter theo status/date
   */
  getRegistrations(query: GetRegistrationsQuery = {}): Observable<PaginatedRegistrationsResponse> {
    let params = new HttpParams();
    
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.date) {
      params = params.set('date', query.date);
    }
    if (query.page !== undefined) {
      params = params.set('page', query.page.toString());
    }
    if (query.limit !== undefined) {
      params = params.set('limit', query.limit.toString());
    }

    return this.http.get<PaginatedRegistrationsResponse>(this.baseUrl, { params });
  }

  /**
   * Lấy chi tiết một registration
   */
  getRegistrationDetail(id: string): Observable<ShiftRegistration> {
    return this.http.get<ShiftRegistration>(`${this.baseUrl}/${id}`);
  }

  /**
   * Duyệt hoặc từ chối registration
   * Trả về updated registration
   */
  reviewRegistration(id: string, review: ReviewRegistrationDto): Observable<ShiftRegistration> {
    return this.http.patch<ShiftRegistration>(`${this.baseUrl}/${id}/review`, review);
  }

  /**
   * Lấy thống kê số lượng registrations
   * Hữu ích cho dashboard và badge notifications
   */
  getStats(): Observable<RegistrationStats> {
    return this.http.get<RegistrationStats>(`${this.baseUrl}/stats`);
  }
}
