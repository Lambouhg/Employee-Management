import { Component, inject, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ManagerService } from '@app/core/services/manager.service';
import { DepartmentService } from '@core/services/department.service';
import { forkJoin } from 'rxjs';
import { CreateEmployeeDto, UpdateEmployeeDto } from '@core/models/employee.model';
import { Role } from '@core/models/role.model';
import { Department } from '@core/models/department.model';
import { LucideAngularModule, X, Info } from 'lucide-angular';

@Component({
  selector: 'app-employee-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
templateUrl: './employee-form-modal.component.html',
})
export class EmployeeFormModalComponent implements OnInit {
  @Input() employeeId?: string; // If provided, it's edit mode
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private managerService = inject(ManagerService);
  private departmentService = inject(DepartmentService);

  employeeForm!: FormGroup;
  roles: Role[] = [];
  departments: Department[] = [];
  originalIsActive?: boolean;
  
  isEditMode = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  readonly X = X;
  readonly Info = Info;

  ngOnInit(): void {
    this.isEditMode = !!this.employeeId;
    this.initForm();
    this.loadFormData();
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [this.isEditMode ? '' : '', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      phone: [''],
      roleId: ['', Validators.required],
      departmentId: [''],
      employmentType: ['FULL_TIME', Validators.required],
      fixedDayOff: [''],
      isActive: [true]
    });
  }

  loadFormData(): void {
    // Load roles and departments in parallel, then (if edit) load employee and patch
    const roles$ = this.managerService.getRoles();
    const depts$ = this.departmentService.getDepartments(true);

    forkJoin({ roles: roles$, depts: depts$ }).subscribe({
      next: ({ roles, depts }) => {
        this.roles = roles;
        this.departments = depts;

        if (this.isEditMode && this.employeeId) {
          this.managerService.getById(this.employeeId).subscribe({
            next: (employee) => {
              this.originalIsActive = employee.isActive;
              this.employeeForm.patchValue({
                fullName: employee.fullName,
                email: employee.email,
                phone: employee.phone,
                roleId: employee.role.id,
                departmentId: employee.department?.id || '',
                employmentType: employee.employmentType,
                fixedDayOff: employee.fixedDayOff || '',
                isActive: employee.isActive
              });
            },
            error: (err) => {
              console.error('Error loading employee:', err);
              this.errorMessage = 'Không thể tải thông tin nhân viên';
            }
          });
        }
      },
      error: (err) => {
        console.error('Error loading form data:', err);
        this.errorMessage = 'Không thể tải dữ liệu form';
      }
    });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = { ...this.employeeForm.value };
    
    // Clean up optional fields: convert empty strings to null
    const optionalStringFields = ['phone', 'fixedDayOff'];
    
    // For departmentId: send null when empty to explicitly remove department
    if (formValue.departmentId === '' || formValue.departmentId === null) {
      formValue.departmentId = null;
    }
    
    optionalStringFields.forEach(field => {
      if (formValue[field] === '') {
        formValue[field] = null;
      }
    });

    // If creating, remove isActive and ensure password is present
    if (!this.isEditMode) {
      delete formValue.isActive;
      this.managerService.create(formValue as CreateEmployeeDto).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit();
          this.onClose();
        },
        error: (err) => {
          console.error('Error creating employee:', err);
          this.errorMessage = err.error?.message || 'Đã xảy ra lỗi khi tạo nhân viên';
          this.isSubmitting = false;
        }
      });
      return;
    }

    // Edit mode: handle password separately
    if (!formValue.password || formValue.password === '') {
      delete formValue.password; // Don't update password if not provided
    }

    // Store and remove isActive from update payload
    const desiredIsActive = formValue.isActive;
    delete formValue.isActive;

    this.managerService.update(this.employeeId!, formValue as UpdateEmployeeDto).subscribe({
      next: () => {
        // If active state changed, call the specific endpoint
        if (this.originalIsActive !== undefined && this.originalIsActive !== desiredIsActive) {
          const action$ = desiredIsActive
            ? this.managerService.activate(this.employeeId!)
            : this.managerService.deactivate(this.employeeId!);

          action$.subscribe({
            next: () => {
              this.isSubmitting = false;
              this.saved.emit();
              this.onClose();
            },
            error: (err) => {
              console.error('Error updating active state:', err);
              this.errorMessage = err.error?.message || 'Đã xảy ra lỗi khi cập nhật trạng thái active';
              this.isSubmitting = false;
            }
          });
        } else {
          this.isSubmitting = false;
          this.saved.emit();
          this.onClose();
        }
      },
      error: (err) => {
        console.error('Error updating employee:', err);
        this.errorMessage = err.error?.message || 'Đã xảy ra lỗi khi cập nhật nhân viên';
        this.isSubmitting = false;
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}
