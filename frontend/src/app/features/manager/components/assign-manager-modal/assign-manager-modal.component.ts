import { Component, inject, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '@core/services/department.service';
import { ManagerService } from '@core/services/manager.service';
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
  @Input() managers?: { id: string; fullName: string; email: string }[]; // Preloaded managers
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private departmentService = inject(DepartmentService);
  private managerService = inject(ManagerService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  managersList: { id: string; fullName: string; email: string }[] = [];
  isSubmitting = false;
  isLoadingManagers = false;
  errorMessage: string | null = null;

  readonly X = X;
  readonly UserCog = UserCog;
  readonly Check = Check;
  readonly Info = Info;

  ngOnInit(): void {
    this.initForm();
    // Always try to update managers list on init
    this.updateManagersList();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['department'] && this.department) {
      // Use setTimeout to ensure form is ready
      setTimeout(() => {
        if (this.form) {
          this.form.patchValue({
            managerId: this.department?.manager?.id || null
          });
        }
      }, 0);
    }
    // If managers are provided via input, use them immediately
    if (changes['managers']) {
      this.updateManagersList();
    }
  }

  private updateManagersList(): void {
    // Use preloaded managers if available, otherwise load them
    if (this.managers && this.managers.length > 0) {
      this.managersList = [...this.managers]; // Create new array reference
      this.isLoadingManagers = false;
      // Force change detection after a microtask to ensure DOM is updated
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
    } else if (!this.isLoadingManagers && this.managersList.length === 0) {
      // Only load if we don't have managers and haven't started loading
      this.loadManagers();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      managerId: [null]
    });
  }

  loadManagers(): void {
    this.isLoadingManagers = true;
    this.errorMessage = null;
    
    // Use dedicated endpoint for department managers (DEPT_MANAGER only)
    this.managerService.getDepartmentManagers().subscribe({
      next: (managers) => {
        if (!managers || managers.length === 0) {
          this.errorMessage = 'Không có quản lý phòng ban nào trong hệ thống';
          this.managersList = [];
          this.isLoadingManagers = false;
          return;
        }
        this.managersList = managers.map(manager => ({
          id: manager.id,
          fullName: manager.fullName,
          email: manager.email
        }));
        this.errorMessage = null;
        this.isLoadingManagers = false;
        // Force change detection after a microtask to ensure DOM is updated
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.error('Error loading department managers:', err);
        this.errorMessage = err.error?.message || 'Không thể tải danh sách quản lý phòng ban';
        this.managersList = [];
        this.isLoadingManagers = false;
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

    const manager = this.managersList.find(m => m.id === managerId);
    return manager ? manager.fullName : 'Không tìm thấy';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length > 1 
      ? names[0][0] + names[names.length - 1][0]
      : names[0][0];
  }
}