import { Component, inject, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '@core/services/department.service';
import { Department, DepartmentEmployee } from '@core/models/department.model';
import { Employee } from '@core/models/employee.model';
import { LucideAngularModule, X, UserPlus, UserMinus, Check, Users, Info } from 'lucide-angular';

@Component({
  selector: 'app-manage-employees-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './manage-employees-modal.component.html',
})
export class ManageEmployeesModalComponent implements OnInit, OnChanges {
  @Input() departmentId?: string;
  @Input() department?: Department;
  @Input() allEmployees: Employee[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private departmentService = inject(DepartmentService);

  // State
  availableEmployees: Employee[] = [];
  currentEmployees: DepartmentEmployee[] = [];
  selectedToAdd: Set<string> = new Set();
  selectedToRemove: Set<string> = new Set();

  isSubmitting = false;
  errorMessage: string | null = null;

  readonly X = X;
  readonly UserPlus = UserPlus;
  readonly UserMinus = UserMinus;
  readonly Check = Check;
  readonly Users = Users;
  readonly Info = Info;

  ngOnInit(): void {
    this.initializeEmployees();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['department'] || changes['allEmployees']) {
      this.initializeEmployees();
    }
  }

  initializeEmployees(): void {
    if (!this.department || !this.allEmployees) return;

    // Current employees in department
    this.currentEmployees = this.department.employees || [];

    // Available employees (not in current department)
    const currentEmployeeIds = new Set(this.currentEmployees.map(emp => emp.id));
    this.availableEmployees = this.allEmployees.filter(emp => !currentEmployeeIds.has(emp.id));

    // Reset selections
    this.selectedToAdd.clear();
    this.selectedToRemove.clear();
  }

  toggleAddEmployee(employeeId: string): void {
    if (this.selectedToAdd.has(employeeId)) {
      this.selectedToAdd.delete(employeeId);
    } else {
      this.selectedToAdd.add(employeeId);
    }
  }

  toggleRemoveEmployee(employeeId: string): void {
    if (this.selectedToRemove.has(employeeId)) {
      this.selectedToRemove.delete(employeeId);
    } else {
      this.selectedToRemove.add(employeeId);
    }
  }

  selectAllToAdd(): void {
    if (this.selectedToAdd.size === this.availableEmployees.length) {
      this.selectedToAdd.clear();
    } else {
      this.availableEmployees.forEach(emp => this.selectedToAdd.add(emp.id));
    }
  }

  selectAllToRemove(): void {
    if (this.selectedToRemove.size === this.currentEmployees.length) {
      this.selectedToRemove.clear();
    } else {
      this.currentEmployees.forEach(emp => this.selectedToRemove.add(emp.id));
    }
  }

  onSubmit(): void {
    if (!this.departmentId) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const employeesToAdd = Array.from(this.selectedToAdd);
    const employeesToRemove = Array.from(this.selectedToRemove);

    // Execute operations in sequence
    const operations = [];

    if (employeesToAdd.length > 0) {
      operations.push(
        this.departmentService.assignEmployees(this.departmentId, employeesToAdd, true)
      );
    }

    if (employeesToRemove.length > 0) {
      operations.push(
        this.departmentService.removeEmployees(this.departmentId, employeesToRemove)
      );
    }

    if (operations.length === 0) {
      this.isSubmitting = false;
      this.onClose();
      return;
    }

    // Execute all operations
    Promise.all(operations.map(op => op.toPromise())).then(
      () => {
        this.isSubmitting = false;
        this.saved.emit();
        this.onClose();
      },
      (error) => {
        console.error('Error managing employees:', error);
        this.errorMessage = error.error?.message || 'Không thể cập nhật nhân viên';
        this.isSubmitting = false;
      }
    );
  }

  onClose(): void {
    this.closed.emit();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}