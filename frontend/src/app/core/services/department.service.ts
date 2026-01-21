import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Department, 
  DepartmentDetail, 
} from '../models/department.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/manager/departments`;

  /**
   * Lấy danh sách phòng ban
   * @param includeEmployees - True để lấy cả thông tin employees, false chỉ lấy thông tin cơ bản
   */
  getDepartments(includeEmployees: boolean = false): Observable<Department[]> {
    let params = new HttpParams();
    if (includeEmployees) {
      params = params.set('includeEmployees', 'true');
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => Array.isArray(res) ? res : res?.data ?? [])
    );
  }

  /**
   * Lấy chi tiết phòng ban với đầy đủ thông tin và thống kê
   */
  getDepartmentDetail(id: string): Observable<DepartmentDetail> {
    return this.http.get<DepartmentDetail>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new department
   */
  create(data: Partial<Department>): Observable<Department> {
    return this.http.post<Department>(`${environment.apiUrl}/manager/departments`, data);
  }

  /**
   * Update existing department
   */
  update(id: string, data: Partial<Department>): Observable<Department> {
    return this.http.patch<Department>(`${environment.apiUrl}/manager/departments/${id}`, data);
  }

  /**
   * Delete department
   */
  remove(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/manager/departments/${id}`);
  }

  /**
   * Assign manager for a department
   */
  assignManager(id: string, managerId: string | null): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/manager/departments/${id}/assign-manager`, { managerId });
  }

  /**
   * Gán nhiều nhân viên vào phòng ban
   * @param id - ID phòng ban
   * @param employeeIds - Danh sách ID nhân viên
   * @param autoAssignManager - Tự động gán trưởng phòng làm manager trực tiếp (mặc định: true)
   */
  assignEmployees(id: string, employeeIds: string[], autoAssignManager: boolean = true): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/assign-employees`, {
      employeeIds,
      autoAssignManager,
    });
  }

  /**
   * Bỏ gán nhiều nhân viên khỏi phòng ban
   * @param id - ID phòng ban
   * @param employeeIds - Danh sách ID nhân viên
   */
  removeEmployees(id: string, employeeIds: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/remove-employees`, {
      employeeIds,
    });
  }
}
