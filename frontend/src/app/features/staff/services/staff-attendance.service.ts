import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    TodayAttendance,
    AttendanceRecord,
    AttendanceHistory,
    CheckInRequest,
    GetHistoryParams
} from '../../../core/models/attendance.model';

@Injectable({
    providedIn: 'root'
})
export class StaffAttendanceService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/staff/attendance`;

    /**
     * Lấy thông tin ca làm và trạng thái điểm danh hôm nay
     */
    getTodayAttendance(): Observable<TodayAttendance> {
        return this.http.get<TodayAttendance>(`${this.apiUrl}/today`);
    }

    /**
     * Điểm danh ca làm việc
     */
    checkIn(request: CheckInRequest): Observable<AttendanceRecord> {
        return this.http.post<AttendanceRecord>(`${this.apiUrl}/check-in`, request);
    }

    /**
     * Lấy lịch sử điểm danh
     */
    getHistory(params?: GetHistoryParams): Observable<AttendanceHistory> {
        let httpParams = new HttpParams();

        if (params) {
            if (params.startDate) {
                httpParams = httpParams.set('startDate', params.startDate);
            }
            if (params.endDate) {
                httpParams = httpParams.set('endDate', params.endDate);
            }
            if (params.page) {
                httpParams = httpParams.set('page', params.page.toString());
            }
            if (params.limit) {
                httpParams = httpParams.set('limit', params.limit.toString());
            }
        }

        return this.http.get<AttendanceHistory>(`${this.apiUrl}/history`, { params: httpParams });
    }
}
