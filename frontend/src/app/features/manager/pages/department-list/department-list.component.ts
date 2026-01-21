import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '@core/services/department.service';
import { DepartmentFormModalComponent } from '../../components/department-form-modal/department-form-modal.component';
import { Department } from '@core/models/department.model';
import { 
  LucideAngularModule, 
  Building2,
  Plus,
  Edit,
  Trash2,
  ChevronRight
} from 'lucide-angular';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DepartmentFormModalComponent],
  templateUrl:'./department-list.component.html',
})
export class DepartmentListComponent implements OnInit {
  public departments: Department[] = [];
  public isLoading = true;
  public readonly Building2 = Building2;
  public readonly Plus = Plus;
  public readonly Edit = Edit;
  public readonly Trash2 = Trash2;
  public readonly ChevronRight = ChevronRight;

  constructor(
    public departmentService: DepartmentService,
    private cdr: ChangeDetectorRef
  ) {}

  // Modal state
  showDepartmentForm = false;
  editingDepartmentId?: string | null;
  // Expanded state for department cards
  private expandedIds = new Set<string>();

  ngOnInit(): void {
    this.loadDepartments();
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

  openDepartmentForm(deptId?: string): void {
    this.editingDepartmentId = deptId;
    this.showDepartmentForm = true;
  }

  closeDepartmentForm(): void {
    this.showDepartmentForm = false;
    this.editingDepartmentId = undefined;
  }

  onDepartmentSaved(): void {
    this.closeDepartmentForm();
    this.loadDepartments();
  }

  deleteDepartment(id: string): void {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) return;
    this.departmentService.remove(id).subscribe({
      next: () => this.loadDepartments(),
      error: (err) => alert(err.error?.message || 'Không thể xóa phòng ban')
    });
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    return names.length > 1 
      ? names[0][0] + names[names.length - 1][0]
      : names[0][0];
  }
}
