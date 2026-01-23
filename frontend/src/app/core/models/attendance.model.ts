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
