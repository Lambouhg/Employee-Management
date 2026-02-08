import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CompleteDashboardDto } from '../../../core/models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DeptManagerDashboardService {
  private apiUrl = `${environment.apiUrl}/dept-manager/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Get complete dashboard data with all metrics
   */
  getCompleteDashboard(): Observable<CompleteDashboardDto> {
    return this.http.get<CompleteDashboardDto>(`${this.apiUrl}/complete`);
  }

  /**
   * Legacy method - get basic stats
   */
  getBasicStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  /**
   * Legacy method - get department info
   */
  getMyDepartment(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-department`);
  }
}
