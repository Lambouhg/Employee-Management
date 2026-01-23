import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Users, UserCheck, UserX, RefreshCw, Edit, Trash2, MoreVertical, Eye } from 'lucide-angular';
import { Employee } from '@core/models/employee.model';

export interface EmployeeActionEvent {
  type: 'toggle-status' | 'reset-password' | 'edit' | 'delete' | 'view';
  employeeId: string;
  employee?: Employee;
}

@Component({
  selector: 'app-employee-table',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './employee-table.component.html'
})
export class EmployeeTableComponent {
  employees = input.required<Employee[]>();
  isLoading = input<boolean>(false);
  error = input<string | null>(null);
  currentPage = input<number>(1);
  pageSize = input<number>(10);
  totalEmployees = input<number>(0);

  action = output<EmployeeActionEvent>();
  pageChange = output<number>();
  reload = output<void>();

  // Dropdown state
  openDropdownId: string | null = null;

  // Icons
  readonly Users = Users;
  readonly UserCheck = UserCheck;
  readonly UserX = UserX;
  readonly RefreshCw = RefreshCw;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly MoreVertical = MoreVertical;
  readonly Eye = Eye;

  readonly Math = Math;

  get totalPages(): number {
    return Math.ceil(this.totalEmployees() / this.pageSize());
  }

  getPageNumbers(): number[] {
    const pages = this.totalPages;
    return Array.from({ length: pages }, (_, i) => i + 1);
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatEmploymentType(type: string): string {
    const types: Record<string, string> = {
      FULL_TIME: 'Full Time',
      PART_TIME: 'Part Time',
      CONTRACT: 'Contract',
      INTERN: 'Intern'
    };
    return types[type] || type;
  }

  onAction(type: EmployeeActionEvent['type'], employee: Employee): void {
    this.openDropdownId = null; // Close dropdown after action
    this.action.emit({ type, employeeId: employee.id, employee });
  }

  toggleDropdown(employeeId: string, event: Event): void {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === employeeId ? null : employeeId;
  }

  isDropdownOpen(employeeId: string): boolean {
    return this.openDropdownId === employeeId;
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onReload(): void {
    this.reload.emit();
  }
}
