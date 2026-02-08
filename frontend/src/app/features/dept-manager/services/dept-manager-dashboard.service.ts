import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DeptManagerDashboardService {
    private http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/dept-manager/dashboard`;

    getDashboardStats(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/stats`);
    }

    getMyDepartment(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/my-department`);
    }
}
