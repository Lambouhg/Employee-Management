import { Component, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '@core/services/department.service';
import { EmployeeService } from '@core/services/employee.service';
import { Department, DepartmentDetail } from '@core/models/department.model';
import { LucideAngularModule, X, Info } from 'lucide-angular';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-department-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './department-form-modal.component.html',
})
export class DepartmentFormModalComponent implements OnInit {
  @Input() departmentId?: string;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private departmentService = inject(DepartmentService);
  private employeeService = inject(EmployeeService);

  form!: FormGroup;
  managers: { id: string; fullName: string }[] = [];
  isEdit = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  readonly X = X;
  readonly Info = Info;

  ngOnInit(): void {
    this.isEdit = !!this.departmentId;
    this.initForm();
    this.loadData();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_-]+$/)]],
      description: [''],
      managerId: ['']
    });
  }

  loadData() {
    const managers$ = this.employeeService.getManagers();

    if (this.isEdit && this.departmentId) {
      const detail$ = this.departmentService.getDepartmentDetail(this.departmentId);
      forkJoin({ managers: managers$, detail: detail$ }).subscribe({
        next: ({ managers, detail }) => {
          this.managers = managers as any;
          this.patchForm(detail);
        },
        error: (err) => {
          console.error('Error loading department form data', err);
          this.errorMessage = 'Không thể tải dữ liệu phòng ban';
        }
      });
    } else {
      managers$.subscribe({
        next: (managers) => {
          this.managers = managers as any;
        },
        error: (err) => {
          console.error('Error loading form lists', err);
          this.errorMessage = 'Không thể tải dữ liệu form';
        }
      });
    }
  }

  patchForm(detail: DepartmentDetail) {
    this.form.patchValue({
      name: detail.name,
      code: detail.code,
      description: detail.description || '',
      managerId: detail.manager?.id || ''
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = { ...this.form.value };
    
    // Normalize department code to uppercase if provided
    if (payload.code) {
      payload.code = (payload.code as string).toUpperCase();
    }

    // Clean empty string fields - convert to null or remove
    // Handle managerId differently for create vs edit mode
    if (payload.managerId === '' || payload.managerId === null) {
      if (this.isEdit) {
        // In edit mode: send null explicitly to tell backend to remove manager
        payload.managerId = null;
      } else {
        // In create mode: remove field (optional, backend will handle)
        delete payload.managerId;
      }
    }
    if (payload.description === '' || payload.description === null) {
      delete payload.description; // Remove empty description
    }

    if (!this.isEdit) {
      this.departmentService.create(payload).subscribe({
        next: () => { this.isSubmitting = false; this.saved.emit(); this.onClose(); },
        error: (err) => { this.isSubmitting = false; this.errorMessage = err.error?.message || 'Lỗi tạo phòng ban'; }
      });
      return;
    }

    this.departmentService.update(this.departmentId!, payload).subscribe({
      next: () => { this.isSubmitting = false; this.saved.emit(); this.onClose(); },
      error: (err) => { this.isSubmitting = false; this.errorMessage = err.error?.message || 'Lỗi cập nhật phòng ban'; }
    });
  }

  onClose() { this.closed.emit(); }
}
