import { Component, inject, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ManagerService } from '@app/core/services/manager.service';
import { DepartmentService } from '@core/services/department.service';
import { Observable, forkJoin, of, catchError, map, tap, finalize, switchMap } from 'rxjs';
import { CreateEmployeeDto, UpdateEmployeeDto, Employee } from '@core/models/employee.model';
import { Role } from '@core/models/role.model';
import { Department } from '@core/models/department.model';
import { LucideAngularModule, X, Info } from 'lucide-angular';

// Interface for form data loaded via AsyncPipe
interface FormData {
  roles: Role[];
  departments: Department[];
  employee?: Employee;
}

@Component({
  selector: 'app-employee-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './employee-form-modal.component.html',
})
export class EmployeeFormModalComponent implements OnInit {
  @Input() employeeId?: string;
  @Input() employeeData?: Employee;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private managerService = inject(ManagerService);
  private departmentService = inject(DepartmentService);

  // Observable for AsyncPipe - auto unsubscribe, auto change detection
  formData$!: Observable<FormData>;
  employeeForm!: FormGroup;
  
  isEditMode = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  private originalIsActive?: boolean;

  readonly X = X;
  readonly Info = Info;

  ngOnInit(): void {
    this.isEditMode = !!this.employeeId;
    this.initForm();
    this.formData$ = this.loadFormData();
  }

  private initForm(): void {
    this.employeeForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      phone: [''],
      roleId: ['', Validators.required],
      departmentId: [''],
      employmentType: ['FULL_TIME', Validators.required],
      fixedDayOff: [''],
      isActive: [true]
    });
  }

  /**
   * Load form data reactively - returns Observable for AsyncPipe
   * Benefits: auto unsubscribe, auto change detection, clean code
   */
  private loadFormData(): Observable<FormData> {
    const roles$ = this.managerService.getRoles();
    const depts$ = this.departmentService.getDepartments(true);

    // Case 1: Employee data is pre-loaded (fastest)
    if (this.employeeData) {
      return forkJoin({ roles: roles$, departments: depts$ }).pipe(
        map(data => ({ ...data, employee: this.employeeData })),
        tap(data => this.patchEmployeeData(data.employee!)),
        catchError(err => this.handleLoadError(err))
      );
    }

    // Case 2: Edit mode - need to fetch employee
    if (this.isEditMode && this.employeeId) {
      const employee$ = this.managerService.getById(this.employeeId);
      return forkJoin({ roles: roles$, departments: depts$, employee: employee$ }).pipe(
        tap(data => this.patchEmployeeData(data.employee)),
        catchError(err => this.handleLoadError(err))
      );
    }

    // Case 3: Create mode - only need roles and departments
    return forkJoin({ roles: roles$, departments: depts$ }).pipe(
      map(data => ({ ...data, employee: undefined })),
      catchError(err => this.handleLoadError(err))
    );
  }

  private handleLoadError(err: any): Observable<FormData> {
    this.errorMessage = err?.error?.message || err?.message || 'Không thể tải dữ liệu form';
    return of({ roles: [], departments: [], employee: undefined });
  }

  private patchEmployeeData(employee: Employee): void {
    if (!employee) return;

    this.originalIsActive = employee.isActive;
    
    this.employeeForm.patchValue({
      fullName: employee.fullName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      roleId: employee.role?.id || '',
      departmentId: employee.department?.id || '',
      employmentType: employee.employmentType || 'FULL_TIME',
      fixedDayOff: employee.fixedDayOff || '',
      isActive: employee.isActive ?? true
    }, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.prepareFormValue();

    if (!this.isEditMode) {
      this.createEmployee(formValue);
    } else {
      this.updateEmployee(formValue);
    }
  }

  private prepareFormValue(): any {
    const formValue = { ...this.employeeForm.value };
    
    // Clean up optional fields
    ['phone', 'fixedDayOff'].forEach(field => {
      if (formValue[field] === '') formValue[field] = null;
    });

    if (formValue.departmentId === '') formValue.departmentId = null;
    
    return formValue;
  }

  private createEmployee(formValue: any): void {
    delete formValue.isActive;
    
    this.managerService.create(formValue as CreateEmployeeDto).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        this.saved.emit();
        this.onClose();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Đã xảy ra lỗi khi tạo nhân viên';
      }
    });
  }

  private updateEmployee(formValue: any): void {
    // Handle password
    if (!formValue.password) delete formValue.password;

    const desiredIsActive = formValue.isActive;
    delete formValue.isActive;

    // Update employee info
    this.managerService.update(this.employeeId!, formValue as UpdateEmployeeDto).pipe(
      // Chain status update if needed
      switchMap(() => {
        if (this.originalIsActive !== undefined && this.originalIsActive !== desiredIsActive) {
          return desiredIsActive
            ? this.managerService.activate(this.employeeId!)
            : this.managerService.deactivate(this.employeeId!);
        }
        return of(null);
      }),
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        this.saved.emit();
        this.onClose();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Đã xảy ra lỗi khi cập nhật nhân viên';
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}
