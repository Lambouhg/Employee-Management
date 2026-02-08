import { ApiProperty } from '@nestjs/swagger';

export class DepartmentInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  manager?: {
    id: string;
    fullName: string;
    email: string;
  };

  @ApiProperty()
  _count?: {
    employees: number;
  };
}

export class OverviewMetricsDto {
  @ApiProperty({ description: 'Tổng số nhân viên' })
  totalEmployees: number;

  @ApiProperty({ description: 'Số nhân viên Full-time' })
  fullTimeEmployees: number;

  @ApiProperty({ description: 'Số nhân viên Part-time' })
  partTimeEmployees: number;

  @ApiProperty({ description: 'Số nhân viên đang hoạt động' })
  activeEmployees: number;
}

export class WeeklyMetricsDto {
  @ApiProperty({ description: 'Trạng thái lịch tuần hiện tại' })
  currentWeekPlanStatus: 'DRAFT' | 'PUBLISHED' | 'LOCKED' | 'NONE';

  @ApiProperty({ description: 'Tổng số ca trong tuần' })
  totalShiftsThisWeek: number;

  @ApiProperty({ description: 'Số ca đã phân công' })
  assignedShifts: number;

  @ApiProperty({ description: 'Số ca còn trống' })
  vacantShifts: number;

  @ApiProperty({ description: 'Tổng số giờ làm việc tuần này' })
  totalHoursScheduled: number;

  @ApiProperty({ description: 'Ngày bắt đầu tuần' })
  weekStartDate: string;
}

export class TodayMetricsDto {
  @ApiProperty({ description: 'Số ca đang làm hiện tại' })
  currentActiveShifts: number;

  @ApiProperty({ description: 'Số nhân viên có mặt' })
  present: number;

  @ApiProperty({ description: 'Số nhân viên vắng' })
  absent: number;

  @ApiProperty({ description: 'Số nhân viên đi muộn' })
  late: number;

  @ApiProperty({ description: 'Số nhân viên nghỉ phép' })
  onLeave: number;

  @ApiProperty({ description: 'Tổng số ca hôm nay' })
  totalShiftsToday: number;
}

export class PendingActionsDto {
  @ApiProperty({ description: 'Số đăng ký ca chờ duyệt' })
  pendingShiftRegistrations: number;

  @ApiProperty({ description: 'Số yêu cầu nghỉ phép chờ duyệt' })
  pendingLeaveRequests: number;

  @ApiProperty({ description: 'Số lịch làm việc chờ duyệt' })
  pendingSchedules: number;

  @ApiProperty({ description: 'Số ca thiếu nhân viên trong tuần' })
  understaffedShifts: number;
}

export class ShiftCoverageDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  dayOfWeek: string;

  @ApiProperty()
  totalShifts: number;

  @ApiProperty()
  assignedShifts: number;

  @ApiProperty()
  vacantShifts: number;

  @ApiProperty()
  status: 'FULL' | 'PARTIAL' | 'EMPTY';
}

export class AttendanceTrendDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  totalShifts: number;

  @ApiProperty()
  present: number;

  @ApiProperty()
  absent: number;

  @ApiProperty()
  late: number;

  @ApiProperty()
  presentRate: number; // percentage
}

export class EmployeeWorkloadDto {
  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  employmentType: 'FULL_TIME' | 'PART_TIME';

  @ApiProperty()
  shiftsThisWeek: number;

  @ApiProperty()
  maxShiftsAllowed: number;

  @ApiProperty()
  isOverloaded: boolean;

  @ApiProperty()
  isUnderloaded: boolean;
}

export class RecentActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: 'SHIFT_REGISTRATION' | 'LEAVE_REQUEST' | 'PLAN_PUBLISHED' | 'ATTENDANCE';

  @ApiProperty()
  message: string;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  employeeName?: string;
}

export class AlertDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  severity: 'ERROR' | 'WARNING' | 'INFO';

  @ApiProperty()
  message: string;

  @ApiProperty()
  actionRequired: boolean;

  @ApiProperty()
  actionUrl?: string;
}

export class CompleteDashboardDto {
  @ApiProperty()
  department: DepartmentInfoDto;

  @ApiProperty()
  overview: OverviewMetricsDto;

  @ApiProperty()
  weekly: WeeklyMetricsDto;

  @ApiProperty()
  today: TodayMetricsDto;

  @ApiProperty()
  pendingActions: PendingActionsDto;

  @ApiProperty({ type: [ShiftCoverageDto] })
  weeklyShiftCoverage: ShiftCoverageDto[];

  @ApiProperty({ type: [AttendanceTrendDto] })
  attendanceTrend: AttendanceTrendDto[];

  @ApiProperty({ type: [EmployeeWorkloadDto] })
  employeeWorkload: EmployeeWorkloadDto[];

  @ApiProperty({ type: [RecentActivityDto] })
  recentActivities: RecentActivityDto[];

  @ApiProperty({ type: [AlertDto] })
  alerts: AlertDto[];
}
