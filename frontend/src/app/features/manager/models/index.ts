// Manager Feature Models
export interface EmployeeMetrics {
  total: number;
  active: number;
  onLeave: number;
  newThisMonth: number;
}

export interface FilterState {
  search: string;
  departmentId: string | null;
  roleId: string | null;
  status: string | null;
}

export interface EmployeeActionEvent {
  action: 'view' | 'edit' | 'delete' | 'activate' | 'deactivate';
  employeeId: string;
}

export interface DepartmentMetrics {
  totalDepartments: number;
  totalEmployees: number;
  averageEmployeesPerDept: number;
}

export interface ReportFilter {
  startDate: string;
  endDate: string;
  departmentId?: string;
  employeeId?: string;
}
