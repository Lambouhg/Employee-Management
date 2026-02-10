import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  EmployeeDetail, 
  EmployeeSelection, 
  PaginatedEmployeesResponse,
  GetEmployeesParams 
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DeptManagerEmployeesService {
    private http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/dept-manager/employees`;

    /**
     * Get paginated list of employees in the department
     */
    getEmployees(params: GetEmployeesParams = {}): Observable<PaginatedEmployeesResponse> {
        let httpParams = new HttpParams();
        
        if (params.page !== undefined) {
            httpParams = httpParams.set('page', params.page.toString());
        }
        if (params.limit !== undefined) {
            httpParams = httpParams.set('limit', params.limit.toString());
        }
        if (params.search) {
            httpParams = httpParams.set('search', params.search);
        }

        return this.http.get<PaginatedEmployeesResponse>(this.baseUrl, { params: httpParams });
    }

    /**
     * Get detailed information of a specific employee
     */
    getEmployeeDetail(id: string): Observable<EmployeeDetail> {
        return this.http.get<EmployeeDetail>(`${this.baseUrl}/${id}`);
    }

    /**
     * Get simplified list for dropdowns/selection with optional weekly statistics
     * @param weekStartDate Optional ISO date string for week start date
     */
    getSelectionList(weekStartDate?: string): Observable<EmployeeSelection[]> {
        let httpParams = new HttpParams();

        if (weekStartDate) {
            httpParams = httpParams.set('weekStartDate', weekStartDate);
        }

        return this.http.get<EmployeeSelection[]>(`${this.baseUrl}/selection-list`, { params: httpParams });
    }
}
