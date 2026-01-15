import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Department, 
  DepartmentDetail, 
  DepartmentEmployee, 
  DepartmentManager 
} from '../models/department.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/manager/employees/departments`;

  /**
   * Lấy danh sách phòng ban
   * @param includeEmployees - True để lấy cả thông tin employees, false chỉ lấy thông tin cơ bản
   */
  getDepartments(includeEmployees: boolean = false): Observable<Department[]> {
    let params = new HttpParams();
    if (includeEmployees) {
      params = params.set('includeEmployees', 'true');
    }
    return this.http.get<Department[]>(this.apiUrl, { params });
  }

  /**
   * Lấy chi tiết phòng ban với đầy đủ thông tin và thống kê
   */
  getDepartmentDetail(id: string): Observable<DepartmentDetail> {
    return this.http.get<DepartmentDetail>(`${this.apiUrl}/${id}`);
  }
}
