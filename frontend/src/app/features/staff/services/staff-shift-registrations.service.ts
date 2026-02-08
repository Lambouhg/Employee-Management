import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ShiftOpening {
  id: string;
  planId: string;
  date: Date;
  shiftType: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  startTime: string;
  endTime: string;
  isPTEnabled: boolean;
  ptCapacity: number;
  ptRegistered: number;
  isFTEnabled: boolean;
  notes?: string;
  plan?: {
    weekStartDate: Date;
    status: string;
  };
  // Fields from backend for registration status
  availableSlots?: number | null;
  canRegister: boolean;
  myRegistration?: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
  } | null;
}

export interface ShiftRegistration {
  id: string;
  employeeId: string;
  openingId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  registeredAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
  opening?: ShiftOpening;
}

export interface RegisterShiftDto {
  openingId: string;
  notes?: string;
}

export interface GetAvailableShiftsQuery {
  startDate?: string;
  endDate?: string;
  shiftType?: string;
}

export interface MyRegistrationsQuery {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  startDate?: string;
  endDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StaffShiftRegistrationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/staff/shift-registrations`;

  /**
   * Lấy danh sách ca có sẵn để đăng ký
   */
  getAvailableShifts(query?: GetAvailableShiftsQuery): Observable<ShiftOpening[]> {
    let params = new HttpParams();
    if (query?.startDate) {
      params = params.set('startDate', query.startDate);
    }
    if (query?.endDate) {
      params = params.set('endDate', query.endDate);
    }
    if (query?.shiftType) {
      params = params.set('shiftType', query.shiftType);
    }
    
    return this.http.get<ShiftOpening[]>(`${this.baseUrl}/available`, { params });
  }

  /**
   * Đăng ký ca làm việc
   */
  registerForShift(dto: RegisterShiftDto): Observable<ShiftRegistration> {
    return this.http.post<ShiftRegistration>(this.baseUrl, dto);
  }

  /**
   * Lấy danh sách ca đã đăng ký của mình
   */
  getMyRegistrations(query?: MyRegistrationsQuery): Observable<ShiftRegistration[]> {
    let params = new HttpParams();
    if (query?.status) {
      params = params.set('status', query.status);
    }
    if (query?.startDate) {
      params = params.set('startDate', query.startDate);
    }
    if (query?.endDate) {
      params = params.set('endDate', query.endDate);
    }
    
    return this.http.get<ShiftRegistration[]>(`${this.baseUrl}/my-registrations`, { params });
  }

  /**
   * Hủy đăng ký ca
   */
  cancelRegistration(registrationId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${registrationId}`);
  }
}
