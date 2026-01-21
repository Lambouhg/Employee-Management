import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '@core/services/auth.service';
import { EmployeeService } from '@core/services/employee.service';
import { DepartmentService } from '@core/services/department.service';
import { Employee, EmployeeQueryParams } from '@core/models/employee.model';
import { Role } from '@core/models/role.model';
import { Department } from '@core/models/department.model';
import { User } from '@core/models/auth.model';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { EmployeeFormModalComponent } from '../../components/employee-form-modal/employee-form-modal.component';
import { EmployeeMetricsComponent, type EmployeeMetrics } from '../../components/employee-metrics/employee-metrics.component';
import { EmployeeToolbarComponent } from '../../components/employee-toolbar/employee-toolbar.component';
import { EmployeeFiltersComponent, type FilterState } from '../../components/employee-filters/employee-filters.component';
import { EmployeeTableComponent, type EmployeeActionEvent } from '../../components/employee-table/employee-table.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LucideAngularModule, 
    EmployeeFormModalComponent,
    EmployeeMetricsComponent,
    EmployeeToolbarComponent,
    EmployeeFiltersComponent,
    EmployeeTableComponent
  ],
  templateUrl:'./employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private departmentService = inject(DepartmentService);
  private cdr = inject(ChangeDetectorRef);
  
  currentUser: User | null = null;
  searchText = '';
  activeTab = 'active';
  
  // Data
  employees: Employee[] = [];
  departments: Department[] = [];
  roles: Role[] = [];
  currentPage = 1;
  pageSize = 10;
  totalEmployees = 0;
  totalPages = 0;
  
  // Metrics
  metrics: EmployeeMetrics = {
    total: 0,
    active: 0,
    managers: 0,
    departments: 0
  };
  
  // Filters
  showFilters = false;
  filterState: FilterState = {
    selectedDepartments: [],
    selectedRoles: [],
    selectedStatus: 'all'
  };
  
  // Loading & Error states
  isLoading = false;
  error: string | null = null;
  
  // Modal states
  showEmployeeForm = false;
  selectedEmployeeId?: string;
  
  // Lucide Icons
  readonly Plus = Plus;

  tabs = [
    { id: 'active', label: 'Active' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'off-boarding', label: 'Off-boarding' },
    { id: 'dismissed', label: 'Dismissed' }
  ];



  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe();
    }

    this.loadDepartments();
    this.loadRoles();
    this.loadEmployees();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.metrics.departments = departments.length;
      },
      error: (err) => console.error('Error loading departments:', err)
    });
  }

  loadRoles(): void {
    this.employeeService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (err) => console.error('Error loading roles:', err)
    });
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();

    const params: EmployeeQueryParams = {
      page: this.currentPage,
      limit: this.pageSize,
      isActive: this.activeTab === 'active' ? true : undefined
    };

    if (this.searchText.trim()) {
      params.search = this.searchText.trim();
    }

    // Apply filters
    if (this.filterState.selectedDepartments.length > 0) {
      params.departmentId = this.filterState.selectedDepartments[0]; // API chỉ support 1 department
    }

    if (this.filterState.selectedRoles.length > 0) {
      params.roleId = this.filterState.selectedRoles[0]; // API chỉ support 1 role
    }

    if (this.filterState.selectedStatus !== 'all') {
      params.isActive = this.filterState.selectedStatus === 'active';
    }

    console.log('Loading employees with params:', params);

    this.employeeService.getAll(params)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
      next: (response) => {
        console.log('Employees loaded successfully:', response);
        console.log('Response data:', response.data);
        console.log('Response data length:', response.data?.length);
        
        // Debug subordinatesCount
        response.data.forEach((emp: Employee) => {
          console.log(`Employee: ${emp.fullName}, subordinatesCount: ${emp.subordinatesCount}, subordinates:`, emp.subordinates);
        });
        
        this.employees = response.data;
        this.totalEmployees = response.meta.total;
        this.totalPages = response.meta.totalPages;
        this.currentPage = response.meta.page;
        
        // Update metrics
        this.metrics.total = response.meta.total;
        this.metrics.active = response.data.filter((e: Employee) => e.isActive).length;
        this.metrics.managers = response.data.filter((e: Employee) => e.role.level >= 2).length;
        
        console.log('After assignment - employees:', this.employees);
        console.log('After assignment - employees.length:', this.employees.length);
        console.log('After assignment - isLoading:', this.isLoading);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading employees:', err);
        this.error = 'Không thể tải danh sách nhân viên. Vui lòng thử lại.';
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadEmployees();
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    this.currentPage = 1;
    this.loadEmployees();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadEmployees();
  }

  deleteEmployee(id: string): void {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      return;
    }

    this.employeeService.delete(id).subscribe({
      next: () => {
        alert('Xóa nhân viên thành công');
        this.loadEmployees();
      },
      error: (err) => {
        console.error('Error deleting employee:', err);
        const errorMsg = err.error?.message || 'Không thể xóa nhân viên. Vui lòng thử lại.';
        alert(errorMsg);
      }
    });
  }

  toggleEmployeeStatus(employee: Employee): void {
    const action = employee.isActive ? 'deactivate' : 'activate';
    const actionText = employee.isActive ? 'vô hiệu hóa' : 'kích hoạt';

    if (!confirm(`Bạn có chắc chắn muốn ${actionText} nhân viên này?`)) {
      return;
    }

    const request = employee.isActive 
      ? this.employeeService.deactivate(employee.id)
      : this.employeeService.activate(employee.id);

    request.subscribe({
      next: () => {
        alert(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} nhân viên thành công`);
        this.loadEmployees();
      },
      error: (err) => {
        console.error(`Error ${action} employee:`, err);
        const errorMsg = err.error?.message || `Không thể ${actionText} nhân viên. Vui lòng thử lại.`;
        alert(errorMsg);
      }
    });
  }

  resetPassword(employee: Employee): void {
    if (!confirm(`Bạn có chắc chắn muốn reset mật khẩu của ${employee.fullName}?`)) {
      return;
    }

    this.employeeService.resetPassword(employee.id).subscribe({
      next: (response) => {
        alert(response.message || 'Reset mật khẩu thành công. Mật khẩu mới: 123456');
      },
      error: (err) => {
        console.error('Error resetting password:', err);
        const errorMsg = err.error?.message || 'Không thể reset mật khẩu. Vui lòng thử lại.';
        alert(errorMsg);
      }
    });
  }

  openEmployeeForm(employeeId?: string): void {
    this.selectedEmployeeId = employeeId;
    this.showEmployeeForm = true;
  }

  closeEmployeeForm(): void {
    this.showEmployeeForm = false;
    this.selectedEmployeeId = undefined;
  }

  onEmployeeSaved(): void {
    this.loadEmployees();
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    return names.length > 1 
      ? names[0][0] + names[names.length - 1][0]
      : names[0][0];
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatEmploymentType(type: string): string {
    return type === 'FULL_TIME' ? 'Full Time' : 'Part Time';
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  toggleDepartmentFilter(deptId: string): void {
    const index = this.filterState.selectedDepartments.indexOf(deptId);
    if (index > -1) {
      this.filterState.selectedDepartments.splice(index, 1);
    } else {
      this.filterState.selectedDepartments = [deptId]; // Chỉ chọn 1
    }
    this.currentPage = 1;
    this.loadEmployees();
  }

  toggleRoleFilter(roleId: string): void {
    const index = this.filterState.selectedRoles.indexOf(roleId);
    if (index > -1) {
      this.filterState.selectedRoles.splice(index, 1);
    } else {
      this.filterState.selectedRoles = [roleId]; // Chỉ chọn 1
    }
    this.currentPage = 1;
    this.loadEmployees();
  }

  setStatusFilter(status: string): void {
    this.filterState.selectedStatus = status;
    this.currentPage = 1;
    this.loadEmployees();
  }

  clearFilters(): void {
    this.filterState = {
      selectedDepartments: [],
      selectedRoles: [],
      selectedStatus: 'all'
    };
    this.currentPage = 1;
    this.loadEmployees();
  }

  get hasActiveFilters(): boolean {
    return this.filterState.selectedDepartments.length > 0 || 
           this.filterState.selectedRoles.length > 0 || 
           this.filterState.selectedStatus !== 'all';
  }

  get activeFiltersCount(): number {
    return this.filterState.selectedDepartments.length + 
           this.filterState.selectedRoles.length + 
           (this.filterState.selectedStatus !== 'all' ? 1 : 0);
  }

  handleTableAction(event: EmployeeActionEvent): void {
    switch (event.type) {
      case 'toggle-status':
        if (event.employee) this.toggleEmployeeStatus(event.employee);
        break;
      case 'reset-password':
        if (event.employee) this.resetPassword(event.employee);
        break;
      case 'edit':
        this.openEmployeeForm(event.employeeId);
        break;
      case 'delete':
        this.deleteEmployee(event.employeeId);
        break;
    }
  }
}
