import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DepartmentService } from '@core/services/department.service';
import { ManagerService } from '@core/services/manager.service';
import { DepartmentDetail } from '@core/models/department.model';
import { DepartmentFormModalComponent } from '../../components/department-form-modal/department-form-modal.component';
import { AssignManagerModalComponent } from '../../components/assign-manager-modal/assign-manager-modal.component';
import { ManageEmployeesModalComponent } from '../../components/manage-employees-modal/manage-employees-modal.component';
import { Employee } from '@core/models/employee.model';
import { Observable, of, catchError, tap, switchMap, shareReplay } from 'rxjs';
import {
    LucideAngularModule,
    Building2,
    ArrowLeft,
    Edit,
    UserCog,
    Users,
    UserPlus,
    Trash2,
    Mail,
    Briefcase,
} from 'lucide-angular';

@Component({
    selector: 'app-department-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        LucideAngularModule,
        DepartmentFormModalComponent,
        AssignManagerModalComponent,
        ManageEmployeesModalComponent,
    ],
    templateUrl: './department-detail.component.html',
})
export class DepartmentDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private departmentService = inject(DepartmentService);
    private employeeService = inject(ManagerService);

    // Use Observable with async pipe
    department$!: Observable<DepartmentDetail | null>;
    departmentId: string | null = null;
    employees: Employee[] = [];
    errorMessage: string | null = null;

    // Modal states
    showDepartmentForm = false;
    showAssignManager = false;
    showManageEmployees = false;
    departmentManagers: { id: string; fullName: string; email: string }[] = [];

    // Icons
    readonly Building2 = Building2;
    readonly ArrowLeft = ArrowLeft;
    readonly Edit = Edit;
    readonly UserCog = UserCog;
    readonly Users = Users;
    readonly UserPlus = UserPlus;
    readonly Trash2 = Trash2;
    readonly Mail = Mail;
    readonly Briefcase = Briefcase;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.router.navigate(['/manager/departments']);
            return;
        }

        this.departmentId = id;

        // Setup department$ Observable with error handling
        this.department$ = this.departmentService.getDepartmentDetail(id).pipe(
            tap(department => {
                console.log('Department loaded:', department);
                if (!department) {
                    this.errorMessage = 'Department not found';
                }
            }),
            catchError(err => {
                console.error('Error loading department:', err);
                this.errorMessage = err.error?.message || 'Failed to load department';
                return of(null);
            }),
            shareReplay(1)
        );

        this.loadEmployees();
        this.loadDepartmentManagers();
    }

    loadEmployees(): void {
        this.employeeService.getAll({ departmentId: null }).subscribe({
            next: (response) => {
                this.employees = response.data;
            },
            error: (err) => {
                console.error('Error loading employees:', err);
            }
        });
    }

    loadDepartmentManagers(): void {
        this.employeeService.getDepartmentManagers().subscribe({
            next: (managers) => {
                this.departmentManagers = managers.map(manager => ({
                    id: manager.id,
                    fullName: manager.fullName,
                    email: manager.email
                }));
            },
            error: (err) => {
                console.error('Error loading department managers:', err);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/manager/departments']);
    }

    // Helper method to reload department data
    private reloadDepartment(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) return;

        this.department$ = this.departmentService.getDepartmentDetail(id).pipe(
            tap(department => {
                console.log('Department reloaded:', department);
                if (!department) {
                    this.errorMessage = 'Department not found';
                }
            }),
            catchError(err => {
                console.error('Error reloading department:', err);
                this.errorMessage = err.error?.message || 'Failed to load department';
                return of(null);
            })
        );
    }

    openDepartmentForm(): void {
        this.showDepartmentForm = true;
    }

    closeDepartmentForm(): void {
        this.showDepartmentForm = false;
    }

    onDepartmentSaved(): void {
        this.closeDepartmentForm();
        this.reloadDepartment();
    }

    openAssignManager(): void {
        this.showAssignManager = true;
    }

    closeAssignManager(): void {
        this.showAssignManager = false;
    }

    onManagerAssigned(): void {
        this.closeAssignManager();
        this.reloadDepartment();
    }

    openManageEmployees(): void {
        this.showManageEmployees = true;
    }

    closeManageEmployees(): void {
        this.showManageEmployees = false;
    }

    onEmployeesManaged(): void {
        this.closeManageEmployees();
        this.reloadDepartment();
        this.loadEmployees();
    }

    deleteDepartment(department: DepartmentDetail): void {
        if (!department || !this.departmentId) return;

        if (!confirm(`Are you sure you want to delete "${department.name}"?`)) return;

        this.departmentService.remove(this.departmentId).subscribe({
            next: () => {
                this.router.navigate(['/manager/departments']);
            },
            error: (err) => {
                alert(err.error?.message || 'Failed to delete department');
            }
        });
    }

    getInitials(name: string | null | undefined): string {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return (parts[0][0] || '?').toUpperCase();
    }
}
