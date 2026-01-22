import { Component, inject, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '@core/services/department.service';
import { EmployeeService } from '@core/services/employee.service';
import { Department } from '@core/models/department.model';
import { LucideAngularModule, X, UserCog, Check, Info } from 'lucide-angular';

@Component({
  selector: 'app-assign-manager-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './assign-manager-modal.component.html',
})
export class AssignManagerModalComponent implements OnInit, OnChanges {
  @Input() departmentId?: string;
  @Input() department?: Department;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private departmentService = inject(DepartmentService);
  private employeeService = inject(EmployeeService);

  form!: FormGroup;
  managers: { id: string; fullName: string; email: string }[] = [];
  isSubmitting = false;
  errorMessage: string | null = null;

  readonly X = X;
  readonly UserCog = UserCog;
  readonly Check = Check;
  readonly Info = Info;

  ngOnInit(): void {
    this.initForm();
    this.loadManagers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['department'] && this.department) {
      this.form.patchValue({
        managerId: this.department.manager?.id || null
      });
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      managerId: [null]
    });
  }

  loadManagers(): void {
    console.log('Loading department managers...');
    // Use dedicated endpoint for department managers (DEPT_MANAGER only)
    this.employeeService.getDepartmentManagers().subscribe({
      next: (managers) => {
        console.log('Raw managers response:', managers);
        if (!managers || managers.length === 0) {
          console.warn('No department managers found');
          this.errorMessage = 'Không có quản lý phòng ban nào trong hệ thống';
          this.managers = [];
          return;
        }
        this.managers = managers.map(manager => ({
          id: manager.id,
          fullName: manager.fullName,
          email: manager.email
        }));
        console.log('Loaded department managers:', this.managers);
        this.errorMessage = null;
      },
      error: (err) => {
        console.error('Error loading department managers:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          url: err.url
        });
        this.errorMessage = err.error?.message || 'Không thể tải danh sách quản lý phòng ban';
        this.managers = [];
      }
    });
  }

  onSubmit(): void {
    if (!this.departmentId) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const managerId = this.form.value.managerId;

    this.departmentService.assignManager(this.departmentId, managerId).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.saved.emit();
        this.onClose();
      },
      error: (err) => {
        console.error('Error assigning manager:', err);
        this.errorMessage = err.error?.message || 'Không thể gán quản lý';
        this.isSubmitting = false;
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }

  getSelectedManagerName(): string {
    const managerId = this.form.value.managerId;
    if (!managerId) return 'Không có';

    const manager = this.managers.find(m => m.id === managerId);
    return manager ? manager.fullName : 'Không tìm thấy';
  }
}