import { Component, inject, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from '@core/services/employee.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from '@core/models/employee.model';
import { Role, Manager } from '@core/models/role.model';
import { Department } from '@core/models/department.model';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-employee-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="onClose()">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEditMode ? 'Edit Employee' : 'Add New Employee' }}
          </h2>
          <button (click)="onClose()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i-lucide [img]="X" class="w-5 h-5 text-gray-500"></i-lucide>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()" class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div class="grid grid-cols-2 gap-4">
            <!-- Full Name -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="fullName"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter full name">
              <p *ngIf="employeeForm.get('fullName')?.invalid && employeeForm.get('fullName')?.touched" 
                class="text-red-500 text-xs mt-1">
                Full name is required
              </p>
            </div>

            <!-- Email -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email <span class="text-red-500">*</span>
              </label>
              <input
                type="email"
                formControlName="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="email@company.com">
              <p *ngIf="employeeForm.get('email')?.invalid && employeeForm.get('email')?.touched" 
                class="text-red-500 text-xs mt-1">
                Valid email is required
              </p>
            </div>

            <!-- Password (only for create) -->
            <div *ngIf="!isEditMode" class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Password <span class="text-red-500">*</span>
              </label>
              <input
                type="password"
                formControlName="password"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter password">
              <p *ngIf="employeeForm.get('password')?.invalid && employeeForm.get('password')?.touched" 
                class="text-red-500 text-xs mt-1">
                Password is required (min 6 characters)
              </p>
            </div>

            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                formControlName="phone"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0123456789">
            </div>

            <!-- Role -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Role <span class="text-red-500">*</span>
              </label>
              <select
                formControlName="roleId"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select role</option>
                <option *ngFor="let role of roles" [value]="role.id">
                  {{ role.displayName }} (Level {{ role.level }})
                </option>
              </select>
              <p *ngIf="employeeForm.get('roleId')?.invalid && employeeForm.get('roleId')?.touched" 
                class="text-red-500 text-xs mt-1">
                Role is required
              </p>
            </div>

            <!-- Department -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                formControlName="departmentId"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">No department</option>
                <option *ngFor="let dept of departments" [value]="dept.id">
                  {{ dept.name }} ({{ dept.code }})
                </option>
              </select>
            </div>

            <!-- Manager -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Manager</label>
              <select
                formControlName="managerId"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">No manager</option>
                <option *ngFor="let manager of managers" [value]="manager.id">
                  {{ manager.fullName }} ({{ manager.role.displayName }})
                </option>
              </select>
            </div>

            <!-- Employment Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Employment Type <span class="text-red-500">*</span>
              </label>
              <select
                formControlName="employmentType"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
              </select>
            </div>

            <!-- Fixed Day Off -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fixed Day Off</label>
              <select
                formControlName="fixedDayOff"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">None</option>
                <option value="MONDAY">Monday</option>
                <option value="TUESDAY">Tuesday</option>
                <option value="WEDNESDAY">Wednesday</option>
                <option value="THURSDAY">Thursday</option>
                <option value="FRIDAY">Friday</option>
                <option value="SATURDAY">Saturday</option>
                <option value="SUNDAY">Sunday</option>
              </select>
            </div>

            <!-- Is Active (only for edit) -->
            <div *ngIf="isEditMode" class="col-span-2">
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  formControlName="isActive"
                  class="rounded border-gray-300">
                <span class="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {{ errorMessage }}
          </div>
        </form>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            (click)="onClose()"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            (click)="onSubmit()"
            [disabled]="employeeForm.invalid || isSubmitting"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class EmployeeFormModalComponent implements OnInit {
  @Input() employeeId?: string; // If provided, it's edit mode
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);

  employeeForm!: FormGroup;
  roles: Role[] = [];
  managers: Manager[] = [];
  departments: Department[] = [];
  
  isEditMode = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  readonly X = X;

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
      managerId: [''],
      employmentType: ['FULL_TIME', Validators.required],
      fixedDayOff: [''],
      isActive: [true]
    });
  }

  loadFormData(): void {
    // Load roles, managers, departments
    this.employeeService.getRoles().subscribe(roles => this.roles = roles);
    this.employeeService.getManagers().subscribe(managers => this.managers = managers);
    this.employeeService.getDepartments().subscribe(departments => this.departments = departments);

    // If edit mode, load employee data
    if (this.isEditMode && this.employeeId) {
      this.employeeService.getById(this.employeeId).subscribe({
        next: (employee) => {
          this.employeeForm.patchValue({
            fullName: employee.fullName,
            email: employee.email,
            phone: employee.phone,
            roleId: employee.role.id,
            departmentId: employee.department?.id || '',
            managerId: employee.manager?.id || '',
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
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.employeeForm.value;
    
    // Clean up empty strings to null
    Object.keys(formValue).forEach(key => {
      if (formValue[key] === '') {
        formValue[key] = null;
      }
    });

    const request = this.isEditMode && this.employeeId
      ? this.employeeService.update(this.employeeId, formValue as UpdateEmployeeDto)
      : this.employeeService.create(formValue as CreateEmployeeDto);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.saved.emit();
        this.onClose();
      },
      error: (err) => {
        console.error('Error saving employee:', err);
        this.errorMessage = err.error?.message || 'Đã xảy ra lỗi khi lưu nhân viên';
        this.isSubmitting = false;
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}
