// ============ Attendance Models ============
import { ShiftType } from './schedule.model';

// Re-export for convenience
export { ShiftType } from './schedule.model';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EARLY_LEAVE = 'EARLY_LEAVE',
  ON_LEAVE = 'ON_LEAVE'
}

export interface Attendance {
  id: string;
  shiftId: string;
  shift?: {
    id: string;
    date: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    employee?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  employeeId: string;
  employee?: {
    id: string;
    fullName: string;
    email: string;
    department?: {
      id: string;
      name: string;
    };
  };
  checkInTime?: string; // ISO datetime string
  checkOutTime?: string; // ISO datetime string
  totalMinutes?: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceDto {
  shiftId: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface UpdateAttendanceDto {
  checkInTime?: string;
  checkOutTime?: string;
  status?: AttendanceStatus;
  notes?: string;
}

export interface AttendanceFilterDto {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}

export interface AttendanceReport {
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  totalShifts: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  onLeaveCount: number;
  totalMinutes: number;
  attendanceRate: number; // percentage
}

// ============ Staff Attendance Models ============

export interface ShiftInfo {
  id: string;
  date: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface ShiftWithAttendance {
  id: string;
  date: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  notes?: string;
  attendance?: {
    id: string;
    checkInTime: string | null;
    status: AttendanceStatus;
    notes: string | null;
  };
  canCheckIn: boolean;
  message: string;
}

export interface AttendanceInfo {
  id: string;
  checkInTime: string | null;
  status: AttendanceStatus;
  notes?: string;
  canCheckIn: boolean;
  message?: string;
}

export interface TodayAttendance {
  hasShift: boolean;
  shifts: ShiftWithAttendance[];
  message: string;
}

export interface AttendanceRecord {
  id: string;
  shiftId: string;
  employeeId: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalMinutes: number | null;
  status: AttendanceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  shift: {
    date: string;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
  };
}

export interface AttendanceHistory {
  data: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CheckInRequest {
  shiftId: string;
  notes?: string;
}

export interface GetHistoryParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
