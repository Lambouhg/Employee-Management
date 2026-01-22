import { Component, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '@core/services/department.service';
import { DepartmentDetail } from '@core/models/department.model';
import { LucideAngularModule, X, Info } from 'lucide-angular';

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

  form!: FormGroup;
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
      description: ['']
    });
  }

  loadData() {
    if (this.isEdit && this.departmentId) {
      this.departmentService.getDepartmentDetail(this.departmentId).subscribe({
        next: (detail) => {
          this.patchForm(detail);
        },
        error: (err) => {
          console.error('Error loading department form data', err);
          this.errorMessage = 'Không thể tải dữ liệu phòng ban';
        }
      });
    }
  }

  patchForm(detail: DepartmentDetail) {
    this.form.patchValue({
      name: detail.name,
      code: detail.code,
      description: detail.description || ''
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const formValue = this.form.value;
    
    // Prepare payload - only name, code, description (NO managerId)
    const payload = {
      name: formValue.name,
      code: formValue.code?.toUpperCase(),
      description: formValue.description || undefined
    };

    if (!this.isEdit) {
      // Create mode
      this.departmentService.create(payload).subscribe({
        next: () => { 
          this.isSubmitting = false; 
          this.saved.emit(); 
          this.onClose(); 
        },
        error: (err) => {
          console.error('Create error:', err);
          console.error('Error response:', err.error);
          this.isSubmitting = false;
          
          // Handle different error formats
          let errorMsg = 'Lỗi tạo phòng ban';
          if (err.error) {
            if (Array.isArray(err.error.message)) {
              errorMsg = err.error.message.join(', ');
            } else if (typeof err.error.message === 'string') {
              errorMsg = err.error.message;
            } else if (err.error.error) {
              errorMsg = err.error.error;
            }
          }
          this.errorMessage = errorMsg;
        }
      });
    } else {
      // Edit mode - only update metadata, NOT manager
      this.departmentService.update(this.departmentId!, payload).subscribe({
        next: () => { 
          this.isSubmitting = false; 
          this.saved.emit(); 
          this.onClose(); 
        },
        error: (err) => {
          console.error('Update error:', err);
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || 'Lỗi cập nhật phòng ban';
        }
      });
    }
  }

  onClose() { this.closed.emit(); }
}
