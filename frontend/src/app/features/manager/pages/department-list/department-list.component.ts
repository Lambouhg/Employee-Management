import { Component, OnInit, ChangeDetectorRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DepartmentService } from '@core/services/department.service';
import { ManagerService } from '@app/core/services/manager.service';
import { DepartmentFormModalComponent } from '../../components/department-form-modal/department-form-modal.component';
import { AssignManagerModalComponent } from '../../components/assign-manager-modal/assign-manager-modal.component';
import { ManageEmployeesModalComponent } from '../../components/manage-employees-modal/manage-employees-modal.component';
import { Department } from '@core/models/department.model';
import { Employee } from '@core/models/employee.model';
import { BehaviorSubject, combineLatest, map, Observable, startWith, switchMap, tap, shareReplay } from 'rxjs';
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
    RouterModule,
    LucideAngularModule,
    DepartmentFormModalComponent,
    AssignManagerModalComponent,
    ManageEmployeesModalComponent,
  ],
  templateUrl: './department-list.component.html',
})
export class DepartmentListComponent implements OnInit {
  private departmentService = inject(DepartmentService);
  private employeeService = inject(ManagerService);
  private cdr = inject(ChangeDetectorRef);

  // Observables for data
  private refreshDepartments$ = new BehaviorSubject<void>(undefined);
  public departments$: Observable<Department[]> = this.refreshDepartments$.pipe(
    switchMap(() => this.departmentService.getDepartments(true)),
    shareReplay(1)
  );

  // Search and Filter Subjects
  public searchTerm$ = new BehaviorSubject<string>('');
  public filterStatus$ = new BehaviorSubject<'all' | 'with-manager' | 'without-manager'>('all');

  // Computed filtered departments
  public filteredDepartments$: Observable<Department[]> = combineLatest([
    this.departments$,
    this.searchTerm$,
    this.filterStatus$
  ]).pipe(
    map(([departments, searchTerm, filterStatus]) => {
      return departments.filter(dept => {
        const searchMatch = !searchTerm ||
          dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dept.code.toLowerCase().includes(searchTerm.toLowerCase());

        let statusMatch = true;
        if (filterStatus === 'with-manager') {
          statusMatch = !!dept.manager;
        } else if (filterStatus === 'without-manager') {
          statusMatch = !dept.manager;
        }

        return searchMatch && statusMatch;
      });
    })
  );

  public employees: Employee[] = [];
  public isLoading = true; // Still used for initial loading state if needed, or can be handled by async pipe

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

  // Modal states
  showDepartmentForm = false;
  showAssignManager = false;
  showManageEmployees = false;
  editingDepartmentId?: string | null;
  selectedDepartmentId?: string;
  selectedDepartment?: Department;

  // Cache department managers
  departmentManagers: { id: string; fullName: string; email: string }[] = [];
  isLoadingManagers = false;

  // Dropdown state
  openDropdownId: string | null = null;

  ngOnInit(): void {
    // We don't need manual loadDepartments anymore as departments$ handles it
    // But we still need to load employees and managers for modals
    this.loadEmployees();
    this.loadDepartmentManagers();

    // Track loading state
    this.departments$.pipe(
      tap(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe();
  }

  loadEmployees(): void {
    this.employeeService.getAll({ departmentId: null }).subscribe({
      next: (response) => {
        this.employees = response.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading employees:', err)
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
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading department managers:', err);
        this.isLoadingManagers = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Statistics Observables
  public totalEmployees$ = this.departments$.pipe(
    map(depts => depts.reduce((sum, dept) => sum + (dept._count?.employees || 0), 0))
  );

  public deptsWithManager$ = this.departments$.pipe(
    map(depts => depts.filter(dept => dept.manager).length)
  );

  public deptsWithoutManager$ = this.departments$.pipe(
    map(depts => depts.filter(dept => !dept.manager).length)
  );

  trackByDeptId(index: number, dept: Department): string {
    return dept.id;
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
    this.refreshDepartments$.next();
  }

  onManagerAssigned(): void {
    this.closeAssignManager();
    this.refreshDepartments$.next();
  }

  onEmployeesManaged(): void {
    this.closeManageEmployees();
    this.refreshDepartments$.next();
  }

  deleteDepartment(id: string): void {
    this.closeDropdown();
    if (!confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) return;
    this.departmentService.remove(id).subscribe({
      next: () => this.refreshDepartments$.next(),
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

  getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0][0] || '?').toUpperCase();
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
