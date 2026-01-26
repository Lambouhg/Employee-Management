import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '@core/services/department.service';
import { ManagerService } from '@app/core/services/manager.service';
import { DepartmentFormModalComponent } from '../../components/department-form-modal/department-form-modal.component';
import { AssignManagerModalComponent } from '../../components/assign-manager-modal/assign-manager-modal.component';
import { ManageEmployeesModalComponent } from '../../components/manage-employees-modal/manage-employees-modal.component';
import { Info } from 'lucide-angular';
import { Department, DepartmentEmployee } from '@core/models/department.model';
import { Employee } from '@core/models/employee.model';
import {
  LucideAngularModule,
  Building2,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  UserPlus,
  UserMinus,
  UserCog,
  MoreVertical,
  Users
} from 'lucide-angular';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    DepartmentFormModalComponent,
    AssignManagerModalComponent,
    ManageEmployeesModalComponent,
  ],
  templateUrl:'./department-list.component.html',
})
export class DepartmentListComponent implements OnInit {
  public departments: Department[] = [];
  public employees: Employee[] = [];
  public isLoading = true;
  public readonly Building2 = Building2;
  public readonly Plus = Plus;
  public readonly Edit = Edit;
  public readonly Trash2 = Trash2;
  public readonly ChevronRight = ChevronRight;
  public readonly UserPlus = UserPlus;
  public readonly UserMinus = UserMinus;
  public readonly UserCog = UserCog;
  public readonly MoreVertical = MoreVertical;
  public readonly Users = Users;

  constructor(
    public departmentService: DepartmentService,
    private employeeService: ManagerService,
    private cdr: ChangeDetectorRef
  ) {}

  // Search and Filter
  searchTerm = '';
  filterStatus: 'all' | 'with-manager' | 'without-manager' = 'all';

  // Modal states
  showDepartmentForm = false;
  showAssignManager = false;
  showManageEmployees = false;
  editingDepartmentId?: string | null;
  selectedDepartmentId?: string;
  selectedDepartment?: Department;

  // Cache department managers for faster access
  departmentManagers: { id: string; fullName: string; email: string }[] = [];
  isLoadingManagers = false;

  // Dropdown state
  openDropdownId: string | null = null;

  // Expanded state for department cards
  private expandedIds = new Set<string>();

  // Filtered departments based on search and filter
  get filteredDepartments(): Department[] {
    return this.departments.filter(dept => {
      // Search filter
      const searchMatch = !this.searchTerm || 
        dept.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // Status filter
      let statusMatch = true;
      if (this.filterStatus === 'with-manager') {
        statusMatch = !!dept.manager;
      } else if (this.filterStatus === 'without-manager') {
        statusMatch = !dept.manager;
      }
      
      return searchMatch && statusMatch;
    });
  }

  // Statistics methods
  getTotalEmployees(): number {
    return this.departments.reduce((sum, dept) => sum + (dept._count?.employees || 0), 0);
  }

  getDepartmentsWithManager(): number {
    return this.departments.filter(dept => dept.manager).length;
  }

  getDepartmentsWithoutManager(): number {
    return this.departments.filter(dept => !dept.manager).length;
  }

  trackByDeptId(index: number, dept: Department): string {
    return dept.id;
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEmployees();
    this.loadDepartmentManagers(); // Preload managers for faster modal opening
  }

  toggleExpanded(id: string): void {
    if (this.expandedIds.has(id)) this.expandedIds.delete(id);
    else this.expandedIds.add(id);
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  loadDepartments(): void {
    this.isLoading = true;
    this.departmentService.getDepartments(true).subscribe({
      next: (departments) => {
        this.departments = departments;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading departments:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getAll().subscribe({
      next: (response) => {
        this.employees = response.data;
      },
      error: (err) => {
        console.error('Error loading employees:', err);
      }
    });
  }

  loadDepartmentManagers(): void {
    this.isLoadingManagers = true;
    this.employeeService.getDepartmentManagers().subscribe({
      next: (managers) => {
        this.departmentManagers = managers.map(manager => ({
          id: manager.id,
          fullName: manager.fullName,
          email: manager.email
        }));
        this.isLoadingManagers = false;
      },
      error: (err) => {
        console.error('Error loading department managers:', err);
        this.isLoadingManagers = false;
      }
    });
  }

  openDepartmentForm(deptId?: string): void {
    this.editingDepartmentId = deptId;
    this.showDepartmentForm = true;
    this.closeDropdown();
  }

  closeDepartmentForm(): void {
    this.showDepartmentForm = false;
    this.editingDepartmentId = undefined;
  }

  onDepartmentSaved(): void {
    this.closeDepartmentForm();
    this.loadDepartments();
  }

  onManagerAssigned(): void {
    this.closeAssignManager();
    this.loadDepartments();
  }

  onEmployeesManaged(): void {
    this.closeManageEmployees();
    this.loadDepartments();
  }

  deleteDepartment(id: string): void {
    this.closeDropdown();
    if (!confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) return;
    this.departmentService.remove(id).subscribe({
      next: () => this.loadDepartments(),
      error: (err) => alert(err.error?.message || 'Không thể xóa phòng ban')
    });
  }

  // Dropdown methods
  toggleDropdown(deptId: string, event: Event): void {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === deptId ? null : deptId;
  }

  isDropdownOpen(deptId: string): boolean {
    return this.openDropdownId === deptId;
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }

  // Modal methods
  openAssignManager(dept: Department): void {
    this.selectedDepartmentId = dept.id;
    this.selectedDepartment = dept;
    this.showAssignManager = true;
    this.closeDropdown();
  }

  closeAssignManager(): void {
    this.showAssignManager = false;
    this.selectedDepartmentId = undefined;
    this.selectedDepartment = undefined;
  }

  openManageEmployees(dept: Department): void {
    this.selectedDepartmentId = dept.id;
    this.selectedDepartment = dept;
    this.showManageEmployees = true;
    this.closeDropdown();
  }

  closeManageEmployees(): void {
    this.showManageEmployees = false;
    this.selectedDepartmentId = undefined;
    this.selectedDepartment = undefined;
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    return names.length > 1 
      ? names[0][0] + names[names.length - 1][0]
      : names[0][0];
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Check if click is outside dropdown
    if (!target.closest('.dropdown-container') && this.openDropdownId) {
      this.closeDropdown();
    }
  }
}
