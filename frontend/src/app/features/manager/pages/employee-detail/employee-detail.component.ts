import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Mail, Phone, Briefcase, Calendar, Users, Building2, UserCog, Shield, Edit, Trash2, UserCheck, UserX, RefreshCw } from 'lucide-angular';
import { ManagerService } from '@core/services/manager.service';
import { Employee } from '@core/models/employee.model';
import { EmployeeFormModalComponent } from '../../components/employee-form-modal/employee-form-modal.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, EmployeeFormModalComponent],
  templateUrl: './employee-detail.component.html'
})
export class EmployeeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(ManagerService);
  private cdr = inject(ChangeDetectorRef);

  employee: Employee | null = null;
  reportingChain: any[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Modal state
  showEmployeeForm = false;

  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Briefcase = Briefcase;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly Building2 = Building2;
  readonly UserCog = UserCog;
  readonly Shield = Shield;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly UserCheck = UserCheck;
  readonly UserX = UserX;
  readonly RefreshCw = RefreshCw;

  ngOnInit(): void {
    const employeeId = this.route.snapshot.paramMap.get('id');
    if (employeeId) {
      this.loadEmployeeDetail(employeeId);
    } else {
      this.router.navigate(['/manager/employees']);
    }
  }

  loadEmployeeDetail(id: string): void {
    this.isLoading = true;
    this.error = null;
    console.log('Loading employee detail for ID:', id);

    this.employeeService.getById(id)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          console.log('Finalize called - isLoading set to false');
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data: any) => {
          console.log('Employee data received:', data);
          this.employee = data;
          this.reportingChain = data.reportingChain || [];
          console.log('Employee set:', this.employee);
          console.log('Reporting chain set:', this.reportingChain);
          console.log('isLoading:', this.isLoading);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading employee detail:', err);
          this.error = 'Không thể tải thông tin nhân viên. Vui lòng thử lại.';
          this.cdr.detectChanges();
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/manager/employees']);
  }

  editEmployee(): void {
    if (this.employee) {
      this.showEmployeeForm = true;
    }
  }

  closeEmployeeForm(): void {
    this.showEmployeeForm = false;
  }

  onEmployeeSaved(): void {
    // Reload employee data after saving
    if (this.employee) {
      this.loadEmployeeDetail(this.employee.id);
    }
  }

  deleteEmployee(): void {
    if (!this.employee) return;
    
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên ${this.employee.fullName}?`)) {
      return;
    }

    this.employeeService.delete(this.employee.id).subscribe({
      next: () => {
        alert('Xóa nhân viên thành công');
        this.router.navigate(['/manager/employees']);
      },
      error: (err) => {
        console.error('Error deleting employee:', err);
        alert(err.error?.message || 'Không thể xóa nhân viên. Vui lòng thử lại.');
      }
    });
  }

  toggleStatus(): void {
    if (!this.employee) return;

    const action = this.employee.isActive ? 'deactivate' : 'activate';
    const actionText = this.employee.isActive ? 'vô hiệu hóa' : 'kích hoạt';

    if (!confirm(`Bạn có chắc chắn muốn ${actionText} nhân viên này?`)) {
      return;
    }

    const request = this.employee.isActive 
      ? this.employeeService.deactivate(this.employee.id)
      : this.employeeService.activate(this.employee.id);

    request.subscribe({
      next: () => {
        alert(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} nhân viên thành công`);
        this.loadEmployeeDetail(this.employee!.id);
      },
      error: (err) => {
        console.error(`Error ${action} employee:`, err);
        alert(err.error?.message || `Không thể ${actionText} nhân viên.`);
      }
    });
  }

  resetPassword(): void {
    if (!this.employee) return;

    if (!confirm(`Bạn có chắc chắn muốn reset mật khẩu của ${this.employee.fullName}?`)) {
      return;
    }

    this.employeeService.resetPassword(this.employee.id).subscribe({
      next: (response) => {
        alert(response.message || 'Reset mật khẩu thành công. Mật khẩu mới: 123456');
      },
      error: (err) => {
        console.error('Error resetting password:', err);
        alert(err.error?.message || 'Không thể reset mật khẩu.');
      }
    });
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    return names.length > 1 
      ? names[0][0] + names[names.length - 1][0]
      : names[0][0];
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatEmploymentType(type: string): string {
    return type === 'FULL_TIME' ? 'Full Time' : 'Part Time';
  }
}
