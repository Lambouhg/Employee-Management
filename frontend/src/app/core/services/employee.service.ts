import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Employee, 
  EmployeeQueryParams, 
  CreateEmployeeDto, 
  UpdateEmployeeDto, 
  SubordinatesResponse 
} from '../models/employee.model';
import { Role, Manager } from '../models/role.model';
import { Department } from '../models/department.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/manager/employees`;

  /**
   * Lấy danh sách nhân viên với phân trang và filter
   */
  getAll(params?: EmployeeQueryParams): Observable<PaginatedResponse<Employee>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Employee>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Lấy chi tiết nhân viên theo ID
   */
  getById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  /**
   * Tạo nhân viên mới
   */
  create(data: CreateEmployeeDto): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, data);
  }

  /**
   * Cập nhật thông tin nhân viên
   */
  update(id: string, data: UpdateEmployeeDto): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Xóa nhân viên (soft delete)
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Kích hoạt nhân viên
   */
  activate(id: string): Observable<{ message: string; user: { id: string; isActive: boolean } }> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/activate`, {});
  }

  /**
   * Vô hiệu hóa nhân viên
   */
  deactivate(id: string): Observable<{ message: string; user: { id: string; isActive: boolean } }> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  /**
   * Chuyển nhân viên sang phòng ban khác
   */
  transferDepartment(userId: string, departmentId: string | null): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${userId}/transfer-department`, { departmentId });
  }

  /**
   * Gán/thay đổi quản lý trực tiếp
   */
  assignManager(userId: string, managerId: string | null): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${userId}/assign-manager`, { managerId });
  }

  /**
   * Reset mật khẩu về mặc định (123456)
   */
  resetPassword(id: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/reset-password`, {});
  }

  /**
   * Lấy danh sách nhân viên dưới quyền
   */
  getSubordinates(managerId: string): Observable<SubordinatesResponse> {
    return this.http.get<SubordinatesResponse>(`${this.apiUrl}/${managerId}/subordinates`);
  }

  /**
   * Lấy danh sách vai trò
   */
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${environment.apiUrl}/manager/roles`);
  }

  /**
   * Lấy danh sách quản lý (tất cả managers - TEAM_LEAD và above)
   */
  getManagers(): Observable<Manager[]> {
    return this.http.get<Manager[]>(`${this.apiUrl}/managers`);
  }

  /**
   * Lấy danh sách quản lý phòng ban (chỉ DEPT_MANAGER)
   */
  getDepartmentManagers(): Observable<Manager[]> {
    return this.http.get<Manager[]>(`${this.apiUrl}/managers/department`);
  }

  /**
   * Lấy danh sách phòng ban
   */
  getDepartments(includeEmployees: boolean = false): Observable<Department[]> {
    // Departments are served under /manager/departments (not under employees)
    let params = new HttpParams();
    if (includeEmployees) {
      params = params.set('includeEmployees', 'true');
    }
    return this.http.get<Department[]>(`${environment.apiUrl}/manager/departments`, { params });
  }
}
