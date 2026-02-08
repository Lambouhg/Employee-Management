import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DeptManagerEmployeesService } from '../../services/dept-manager-employees.service';
import { EmployeeListItem, PaginatedEmployeesResponse } from '../../models';
import { LucideAngularModule, Search, Mail, Phone, Calendar } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, switchMap, catchError, of, map, startWith } from 'rxjs';

interface EmployeeState {
    data: EmployeeListItem[];
    isLoading: boolean;
    errorMessage: string;
    totalItems: number;
    totalPages: number;
    currentPage: number;
}

@Component({
    selector: 'app-employee-list',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, FormsModule],
    templateUrl: './employee-list.component.html',
    styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
    private employeesService = inject(DeptManagerEmployeesService);
    private router = inject(Router);

    // State management with BehaviorSubject
    private searchSubject$ = new BehaviorSubject<string>('');
    private pageSubject$ = new BehaviorSubject<number>(1);
    private readonly pageSize = 10;

    // Main state observable using async pipe
    state$!: Observable<EmployeeState>;

    // For two-way binding
    searchQuery = '';

    // Icons
    readonly SearchIcon = Search;
    readonly MailIcon = Mail;
    readonly PhoneIcon = Phone;
    readonly CalendarIcon = Calendar;
    readonly Math = Math;

    ngOnInit(): void {
        // Create state stream with async pipe pattern
        this.state$ = combineLatest([
            this.searchSubject$.pipe(
                debounceTime(400),
                distinctUntilChanged()
            ),
            this.pageSubject$
        ]).pipe(
            switchMap(([search, page]) =>
                this.employeesService
                    .getEmployees({
                        page,
                        limit: this.pageSize,
                        search
                    })
                    .pipe(
                        map((response: PaginatedEmployeesResponse) => ({
                            data: response.data,
                            isLoading: false,
                            errorMessage: '',
                            totalItems: response.meta.total,
                            totalPages: response.meta.totalPages,
                            currentPage: response.meta.page
                        })),
                        catchError(error => {
                            console.error('Error loading employees:', error);
                            return of({
                                data: [],
                                isLoading: false,
                                errorMessage: error.error?.message || 'Failed to load employees',
                                totalItems: 0,
                                totalPages: 0,
                                currentPage: 1
                            });
                        }),
                        startWith({
                            data: [],
                            isLoading: true,
                            errorMessage: '',
                            totalItems: 0,
                            totalPages: 0,
                            currentPage: page
                        })
                    )
            )
        );
    }

    /**
     * Handle search input change
     */
    onSearchChange(): void {
        this.searchSubject$.next(this.searchQuery);
        this.pageSubject$.next(1); // Reset to first page on search
    }

    /**
     * Navigate to employee detail page
     */
    onEmployeeClick(employeeId: string): void {
        this.router.navigate(['/dept-manager/employees', employeeId]);
    }

    /**
     * Go to specific page
     */
    goToPage(page: number, totalPages: number): void {
        if (page < 1 || page > totalPages) return;
        this.pageSubject$.next(page);
    }

    /**
     * Get page numbers for pagination
     */
    getPageNumbers(currentPage: number, totalPages: number): number[] {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    }

    /**
     * Get CSS classes for employment type badge
     */
    getEmploymentTypeClass(type: string): string {
        return type === 'FULL_TIME' 
            ? 'bg-blue-50 text-blue-600 border-blue-100'
            : 'bg-purple-50 text-purple-600 border-purple-100';
    }

    /**
     * Clear error message
     */
    clearError(): void {
        // Error will be cleared on next successful load
        this.pageSubject$.next(this.pageSubject$.value);
    }
}
