import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DeptManagerEmployeesService } from '../../services/dept-manager-employees.service';
import { EmployeeDetail } from '../../models';
import { LucideAngularModule, ArrowLeft, Mail, Phone, Calendar, Briefcase, User } from 'lucide-angular';
import { Observable, switchMap, catchError, of, map, startWith } from 'rxjs';

interface EmployeeDetailState {
  employee: EmployeeDetail | null;
  isLoading: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule,LucideAngularModule],
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.css']
})
export class EmployeeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeesService = inject(DeptManagerEmployeesService);

  state$!: Observable<EmployeeDetailState>;

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly CalendarIcon = Calendar;
  readonly BriefcaseIcon = Briefcase;
  readonly UserIcon = User;

  ngOnInit(): void {
    this.state$ = this.route.paramMap.pipe(
      switchMap(params => {
        const employeeId = params.get('id');
        if (!employeeId) {
          return of({
            employee: null,
            isLoading: false,
            errorMessage: 'Employee ID not found'
          });
        }

        return this.employeesService.getEmployeeDetail(employeeId).pipe(
          map(employee => ({
            employee,
            isLoading: false,
            errorMessage: ''
          })),
          catchError(error => {
            console.error('Error loading employee detail:', error);
            return of({
              employee: null,
              isLoading: false,
              errorMessage: error.error?.message || 'Failed to load employee details'
            });
          }),
          startWith({
            employee: null,
            isLoading: true,
            errorMessage: ''
          })
        );
      })
    );
  }

  goBack(): void {
    this.router.navigate(['/dept-manager/employees']);
  }

  getEmploymentTypeLabel(type: string): string {
    return type === 'FULL_TIME' ? 'Full-time' : 'Part-time';
  }

  getEmploymentTypeClass(type: string): string {
    return type === 'FULL_TIME'
      ? 'bg-blue-50 text-blue-600 border-blue-200'
      : 'bg-purple-50 text-purple-600 border-purple-200';
  }

  getDayOfWeekLabel(dayOff: number | undefined): string {
    if (dayOff === undefined || dayOff === null) return 'N/A';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOff] || 'N/A';
  }
}
