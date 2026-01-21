import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
}

export interface FilterState {
  selectedDepartments: string[];
  selectedRoles: string[];
  selectedStatus: string;
}

@Component({
  selector: 'app-employee-filters',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './employee-filters.component.html'
})
export class EmployeeFiltersComponent {
  departments = input.required<Department[]>();
  roles = input.required<Role[]>();
  filterState = input.required<FilterState>();
  hasActiveFilters = input.required<boolean>();

  close = output<void>();
  departmentToggle = output<string>();
  roleToggle = output<string>();
  statusChange = output<string>();
  clearAll = output<void>();

  // Icons
  readonly X = X;

  onClose(): void {
    this.close.emit();
  }

  onDepartmentToggle(deptId: string): void {
    this.departmentToggle.emit(deptId);
  }

  onRoleToggle(roleId: string): void {
    this.roleToggle.emit(roleId);
  }

  onStatusChange(status: string): void {
    this.statusChange.emit(status);
  }

  onClearAll(): void {
    this.clearAll.emit();
  }

  isDepartmentSelected(deptId: string): boolean {
    return this.filterState().selectedDepartments.includes(deptId);
  }

  isRoleSelected(roleId: string): boolean {
    return this.filterState().selectedRoles.includes(roleId);
  }
}
