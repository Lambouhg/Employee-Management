import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CompleteDashboardDto } from '@core/models/dashboard.model';

@Injectable({
    providedIn: 'root'
})
export class DeptManagerDashboardService {
    private http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/dept-manager/dashboard`;

    /**
     * Get complete dashboard data with all metrics
     */
    getCompleteDashboard(): Observable<CompleteDashboardDto> {
        return this.http.get<CompleteDashboardDto>(`${this.apiUrl}/complete`);
    }

    /**
     * Get basic dashboard stats
     */
    getDashboardStats(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/stats`);
    }

    /**
     * Get current user's department information
     */
    getMyDepartment(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/my-department`);
    }
}
