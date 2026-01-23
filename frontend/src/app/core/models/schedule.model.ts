export enum ScheduleStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  LOCKED = 'LOCKED'
}

export enum ShiftType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT'
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export interface Shift {
  id: string;
  scheduleId: string;
  employeeId: string;
  employee?: {
    id: string;
    fullName: string;
    email: string;
  };
  date: string; // ISO date string
  shiftType: ShiftType;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkSchedule {
  id: string;
  weekStartDate: string; // ISO date string (Monday)
  employeeId: string;
  employee?: {
    id: string;
    fullName: string;
    email: string;
    employmentType: string;
    department?: {
      id: string;
      name: string;
    };
  };
  submittedAt: string;
  status: ScheduleStatus;
  approvedById?: string;
  approvedBy?: {
    id: string;
    fullName: string;
  };
  approvedAt?: string;
  lockedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shifts?: Shift[];
}

export interface CreateScheduleDto {
  weekStartDate: string; // ISO date string (Monday)
  employeeId: string;
  notes?: string;
  shifts: CreateShiftDto[];
}

export interface CreateShiftDto {
  date: string; // ISO date string
  shiftType: ShiftType;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  notes?: string;
}

export interface UpdateScheduleDto {
  status?: ScheduleStatus;
  notes?: string;
  approvedById?: string;
}

export interface ScheduleFilterDto {
  status?: ScheduleStatus;
  employeeId?: string;
  departmentId?: string;
  weekStartDate?: string;
  startDate?: string;
  endDate?: string;
}
