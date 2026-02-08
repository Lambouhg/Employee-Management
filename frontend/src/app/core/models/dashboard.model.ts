export interface DepartmentInfoDto {
  id: string;
  name: string;
  manager: {
    id: string;
    fullName: string;
    email: string;
  };
  _count: {
    employees: number;
  };
}

export interface OverviewMetricsDto {
  totalEmployees: number;
  fullTimeEmployees: number;
  partTimeEmployees: number;
  activeEmployees: number;
}

export interface WeeklyMetricsDto {
  currentWeekPlanStatus: 'DRAFT' | 'PUBLISHED' | 'LOCKED' | 'NONE';
  totalShiftsThisWeek: number;
  assignedShifts: number;
  vacantShifts: number;
  totalHoursScheduled: number;
  weekStartDate: string;
}

export interface TodayMetricsDto {
  currentActiveShifts: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  totalShiftsToday: number;
}

export interface PendingActionsDto {
  pendingShiftRegistrations: number;
  pendingLeaveRequests: number;
  pendingSchedules: number;
  understaffedShifts: number;
}

export interface ShiftCoverageDto {
  date: string;
  dayOfWeek: string;
  totalShifts: number;
  assignedShifts: number;
  vacantShifts: number;
  status: 'FULL' | 'PARTIAL' | 'EMPTY';
}

export interface AttendanceTrendDto {
  date: string;
  totalShifts: number;
  present: number;
  absent: number;
  late: number;
  presentRate: number;
}

export interface EmployeeWorkloadDto {
  employeeId: string;
  fullName: string;
  employmentType: 'FULL_TIME' | 'PART_TIME';
  shiftsThisWeek: number;
  maxShiftsAllowed: number;
  isOverloaded: boolean;
  isUnderloaded: boolean;
}

export interface RecentActivityDto {
  id: string;
  type: 'SHIFT_REGISTRATION' | 'LEAVE_REQUEST' | 'PLAN_CREATED' | 'PLAN_PUBLISHED';
  message: string;
  timestamp: Date | string;
  employeeName?: string;
}

export interface AlertDto {
  id: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
}

export interface CompleteDashboardDto {
  department: DepartmentInfoDto;
  overview: OverviewMetricsDto;
  weekly: WeeklyMetricsDto;
  today: TodayMetricsDto;
  pendingActions: PendingActionsDto;
  weeklyShiftCoverage: ShiftCoverageDto[];
  attendanceTrend: AttendanceTrendDto[];
  employeeWorkload: EmployeeWorkloadDto[];
  recentActivities: RecentActivityDto[];
  alerts: AlertDto[];
}
