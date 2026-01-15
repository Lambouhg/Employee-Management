import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent, NavMenuItem } from '../../../../shared/components/navbar/navbar.component';
import { AuthService } from '@core/services/auth.service';
import { EmployeeService } from '@core/services/employee.service';
import { Employee, EmployeeQueryParams } from '@core/models/employee.model';
import { Role } from '@core/models/role.model';
import { Department } from '@core/models/department.model';
import { User } from '@core/models/auth.model';
import { LucideAngularModule, LayoutDashboard, Users, CheckCircle, FileText, Plus, Search, Filter, ArrowUpDown, MoreVertical, Edit, Trash2, RefreshCw, UserCheck, UserX } from 'lucide-angular';
import { EmployeeFormModalComponent } from '../../components/employee-form-modal/employee-form-modal.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, LucideAngularModule, EmployeeFormModalComponent],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private cdr = inject(ChangeDetectorRef);
  
  currentUser: User | null = null;
  searchText = '';
  activeTab = 'active';
  
  // Data
  employees: Employee[] = [];
  currentPage = 1;
  pageSize = 10;
  totalEmployees = 0;
  totalPages = 0;
  
  // Loading & Error states
  isLoading = false;
  error: string | null = null;
  
  // Modal states
  showEmployeeForm = false;
  selectedEmployeeId?: string;
  
  // Lucide Icons
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly ArrowUpDown = ArrowUpDown;
  readonly MoreVertical = MoreVertical;
  readonly Users = Users;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly RefreshCw = RefreshCw;
  readonly UserCheck = UserCheck;
  readonly UserX = UserX;

  tabs = [
    { id: 'active', label: 'Active' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'off-boarding', label: 'Off-boarding' },
    { id: 'dismissed', label: 'Dismissed' }
  ];

  menuItems: NavMenuItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      route: '/manager'
    },
    {
      label: 'Quản lý nhân viên',
      icon: Users,
      route: '/manager/employees',
      requiredPermission: 'manage_all_employees'
    },
    {
      label: 'Phê duyệt',
      icon: CheckCircle,
      route: '/manager/approvals'
    },
    {
      label: 'Báo cáo',
      icon: FileText,
      route: '/manager/reports'
    }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe();
    }

    this.loadEmployees();
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

    console.log('Loading employees with params:', params);

    this.employeeService.getAll(params).pipe(
      finalize(() => {
        console.log('Request completed, setting isLoading to false');
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        console.log('Employees loaded successfully:', response);
        console.log('Response data:', response.data);
        console.log('Response data length:', response.data?.length);
        this.employees = response.data;
        this.totalEmployees = response.meta.total;
        this.totalPages = response.meta.totalPages;
        this.currentPage = response.meta.page;
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
        alert('Không thể xóa nhân viên. Vui lòng thử lại.');
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
        alert(`Không thể ${actionText} nhân viên. Vui lòng thử lại.`);
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
        alert('Không thể reset mật khẩu. Vui lòng thử lại.');
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
    return type === 'FULL_TIME' ? 'Employment' : 'Contractor';
  }

  // Helper for pagination template
  Math = Math;
}
